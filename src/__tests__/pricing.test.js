import { describe, it, expect } from 'vitest';
import {
    calculateKeychainPrice,
    calculateVariantPrice,
    formatCurrency,
} from '../lib/pricing';

// ─── calculateKeychainPrice ───────────────────────────────────────────────────

describe('calculateKeychainPrice', () => {
    // 邊界：數量 0 或負數
    it('數量為 0 時回傳 0', () => {
        expect(calculateKeychainPrice({ siding: 'single' }, 0)).toBe(0);
    });

    it('數量為負數時回傳 0', () => {
        expect(calculateKeychainPrice({ siding: 'single' }, -5)).toBe(0);
    });

    it('數量為字串型空值時回傳 0', () => {
        expect(calculateKeychainPrice({ siding: 'single' }, '')).toBe(0);
    });

    // 散客定價
    it('單面 × 1 件 = $99', () => {
        expect(calculateKeychainPrice({ siding: 'single' }, 1)).toBe(99);
    });

    it('雙面 × 1 件 = $150', () => {
        expect(calculateKeychainPrice({ siding: 'double' }, 1)).toBe(150);
    });

    it('單面 × 49 件（散客上限） = 99 × 49', () => {
        expect(calculateKeychainPrice({ siding: 'single' }, 49)).toBe(99 * 49);
    });

    it('雙面 × 49 件（散客上限） = 150 × 49', () => {
        expect(calculateKeychainPrice({ siding: 'double' }, 49)).toBe(150 * 49);
    });

    // 批量臨界值：>= 50 件
    it('單面 × 50 件（剛好達批量） = 50 × 50', () => {
        expect(calculateKeychainPrice({ siding: 'single' }, 50)).toBe(50 * 50);
    });

    it('雙面 × 50 件（剛好達批量） = 70 × 50', () => {
        expect(calculateKeychainPrice({ siding: 'double' }, 50)).toBe(70 * 50);
    });

    it('單面 × 100 件 = 50 × 100', () => {
        expect(calculateKeychainPrice({ siding: 'single' }, 100)).toBe(50 * 100);
    });

    it('雙面 × 100 件 = 70 × 100', () => {
        expect(calculateKeychainPrice({ siding: 'double' }, 100)).toBe(70 * 100);
    });

    // siding 不為 'double' 時視為單面
    it('siding 為任意非 double 值時套用單面定價', () => {
        expect(calculateKeychainPrice({ siding: undefined }, 10)).toBe(99 * 10);
        expect(calculateKeychainPrice({}, 10)).toBe(99 * 10);
    });

    // 字串數量應被正確解析
    it('數量為字串 "10" 時正確計算', () => {
        expect(calculateKeychainPrice({ siding: 'single' }, '10')).toBe(99 * 10);
    });
});

// ─── calculateVariantPrice ────────────────────────────────────────────────────

describe('calculateVariantPrice', () => {
    it('數量為 0 時回傳 0', () => {
        expect(calculateVariantPrice(500, {}, 0, {})).toBe(0);
    });

    it('無 modifiers 時 = basePrice × qty', () => {
        expect(calculateVariantPrice(500, {}, 3, {})).toBe(1500);
        expect(calculateVariantPrice(500, {}, 3, null)).toBe(1500);
        expect(calculateVariantPrice(500, {}, 3, undefined)).toBe(1500);
    });

    it('有一個 modifier 命中時正確加成', () => {
        const pricingLogic = { modifiers: { size: { '14': 200 } } };
        // basePrice=500 + 200 = 700/unit, qty=2 → 1400
        expect(calculateVariantPrice(500, { size: '14' }, 2, pricingLogic)).toBe(1400);
    });

    it('有多個 modifiers 全命中時累加', () => {
        const pricingLogic = {
            modifiers: {
                size: { '14': 200 },
                movement: { 'radio': 300 },
            },
        };
        // 500 + 200 + 300 = 1000/unit, qty=1
        expect(calculateVariantPrice(500, { size: '14', movement: 'radio' }, 1, pricingLogic)).toBe(1000);
    });

    it('config 中無對應 key 時不加成', () => {
        const pricingLogic = { modifiers: { size: { '14': 200 } } };
        // config 有 size='20'，無對應規則
        expect(calculateVariantPrice(500, { size: '20' }, 1, pricingLogic)).toBe(500);
    });

    it('部分 modifier 命中時只累加命中的', () => {
        const pricingLogic = {
            modifiers: {
                size: { '14': 200 },
                movement: { 'radio': 300 },
            },
        };
        // 只有 size 命中
        expect(calculateVariantPrice(500, { size: '14', movement: 'quartz' }, 2, pricingLogic)).toBe((500 + 200) * 2);
    });

    it('modifier 加成為 0 時不影響結果', () => {
        const pricingLogic = { modifiers: { color: { 'black': 0 } } };
        expect(calculateVariantPrice(500, { color: 'black' }, 1, pricingLogic)).toBe(500);
    });
});

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe('formatCurrency', () => {
    it('格式化整數金額為繁體中文台幣格式', () => {
        const result = formatCurrency(1000);
        expect(result).toContain('1,000');
        expect(result).toMatch(/NT\$|TWD|\$|NT/);
    });

    it('格式化 0 時不含小數點', () => {
        const result = formatCurrency(0);
        expect(result).toContain('0');
        expect(result).not.toContain('.');
    });

    it('格式化大數字時正確加千分位', () => {
        const result = formatCurrency(12345);
        expect(result).toContain('12,345');
    });
});
