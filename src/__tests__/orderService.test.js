import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitOrder } from '../lib/orderService';

// ─── Mock Supabase ────────────────────────────────────────────────────────────
// vi.mock 必須在 import 之前宣告，Vitest 會自動 hoist

vi.mock('../lib/supabaseClient', () => {
    const insertMock = vi.fn();
    const fromMock = vi.fn(() => ({ insert: insertMock }));
    const rpcMock = vi.fn();

    return {
        supabase: {
            rpc: rpcMock,
            from: fromMock,
            // 讓測試可以直接取得 mock 函式
            _mocks: { rpcMock, fromMock, insertMock },
        },
    };
});

// ─── 取得 mock 參考（每次重置）────────────────────────────────────────────────

async function getMocks() {
    const { supabase } = await import('../lib/supabaseClient');
    return supabase._mocks;
}

// ─── 測試用假訂單資料 ──────────────────────────────────────────────────────────

const sampleOrder = {
    orderId: 'ORD-123456',
    customer: { name: '王小明', phone: '0912345678' },
    items: [{ productId: 'p1', productName: '鑰匙圈', quantity: 2 }],
    totalAmount: 198,
    couponCode: null,
    discountAmount: 0,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('submitOrder', () => {
    let mocks;

    beforeEach(async () => {
        vi.clearAllMocks();
        mocks = await getMocks();
    });

    it('庫存驗證通過 + DB insert 成功，回傳含 orderId 的物件', async () => {
        // validate_cart_stock RPC → 無錯誤
        mocks.rpcMock.mockResolvedValueOnce({ data: [], error: null });
        // insert → 成功
        mocks.insertMock.mockResolvedValueOnce({ data: null, error: null });

        const result = await submitOrder(sampleOrder);

        expect(result.orderId).toBe('ORD-123456');
        expect(result.id).toBe('submitted');
    });

    it('庫存驗證回傳錯誤列表時，throw 含商品名稱的中文錯誤訊息', async () => {
        mocks.rpcMock.mockResolvedValueOnce({
            data: [
                { product_name: '鑰匙圈', reason: '庫存不足' },
            ],
            error: null,
        });

        let caughtMessage = '';
        try {
            await submitOrder(sampleOrder);
        } catch (e) {
            caughtMessage = e.message;
        }

        expect(caughtMessage).toContain('庫存不足，無法結帳');
        expect(caughtMessage).toContain('鑰匙圈');
    });

    it('RPC 自身發生錯誤時，fallback 繼續執行 insert（不直接 throw）', async () => {
        // RPC error → fallback
        mocks.rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'rpc timeout' } });
        // insert 成功
        mocks.insertMock.mockResolvedValueOnce({ data: null, error: null });

        // 不應該 throw，應繼續走到 insert
        const result = await submitOrder(sampleOrder);
        expect(result.id).toBe('submitted');
        expect(mocks.insertMock).toHaveBeenCalledTimes(1);
    });

    it('DB insert 發生 check_positive_stock 約束錯誤時，throw 用戶友善中文訊息', async () => {
        mocks.rpcMock.mockResolvedValueOnce({ data: [], error: null });
        mocks.insertMock.mockResolvedValueOnce({
            data: null,
            error: {
                message: 'violates check constraint "check_positive_stock"',
                details: null,
            },
        });

        await expect(submitOrder(sampleOrder)).rejects.toThrow('庫存不足！有商品已被搶購一空');
    });

    it('DB insert 發生其他錯誤時，原樣 re-throw', async () => {
        mocks.rpcMock.mockResolvedValueOnce({ data: [], error: null });
        const dbError = { message: 'connection refused', code: '08006' };
        mocks.insertMock.mockResolvedValueOnce({ data: null, error: dbError });

        await expect(submitOrder(sampleOrder)).rejects.toMatchObject({ message: 'connection refused' });
    });

    it('有 couponCode 時正確帶入 insert payload', async () => {
        mocks.rpcMock.mockResolvedValueOnce({ data: [], error: null });
        mocks.insertMock.mockResolvedValueOnce({ data: null, error: null });

        const orderWithCoupon = { ...sampleOrder, couponCode: 'SAVE100', discountAmount: 100 };
        await submitOrder(orderWithCoupon);

        const [insertPayload] = mocks.insertMock.mock.calls[0][0]; // 第一個 call 的第一個陣列元素
        expect(insertPayload.coupon_code).toBe('SAVE100');
        expect(insertPayload.discount_amount).toBe(100);
    });

    it('couponCode 為 null 時，insert payload 中 coupon_code 也為 null', async () => {
        mocks.rpcMock.mockResolvedValueOnce({ data: [], error: null });
        mocks.insertMock.mockResolvedValueOnce({ data: null, error: null });

        await submitOrder(sampleOrder);

        const [insertPayload] = mocks.insertMock.mock.calls[0][0];
        expect(insertPayload.coupon_code).toBeNull();
        expect(insertPayload.discount_amount).toBe(0);
    });
});
