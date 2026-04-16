import { supabase } from './supabaseClient';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * fetch 加指數退避重試。
 *
 * 注意：由於 mode:'no-cors' 無法讀取回應狀態碼，
 * 此處只能捕捉「網路層例外」（DNS 失敗、CORS preflight 拒絕、離線等）。
 * GAS 回傳 500 屬於應用層錯誤，在 no-cors 模式下無法偵測。
 */
async function fetchWithRetry(url, options, maxRetries = MAX_RETRIES) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await fetch(url, options);
            return; // 網路請求成功送出
        } catch (err) {
            lastError = err;
            if (attempt < maxRetries) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 500 → 1000 → 2000 ms
                console.warn(`[Webhook] 第 ${attempt} 次失敗，${delay}ms 後重試...`, err.message);
                await sleep(delay);
            }
        }
    }
    throw lastError;
}

/**
 * 將失敗的 webhook 寫入 Supabase notification_failures 表，
 * 作為最後的 fallback（可在後台手動補送或查詢）。
 */
async function logFailure(context, payload) {
    const { error } = await supabase.from('notification_failures').insert([{
        context,
        payload,
        failed_at: new Date().toISOString(),
    }]);

    if (error) {
        // DB 也失敗時，結構化輸出讓部署日誌能夠搜尋
        console.error('[Webhook] FALLBACK FAILED — 通知永久遺失，請手動補查：', {
            context,
            payload: JSON.stringify(payload),
            dbError: error.message,
        });
    } else {
        console.warn(`[Webhook] ${context} 已寫入 notification_failures，請至後台補送。`);
    }
}

/**
 * 送出 GAS webhook，附帶重試機制與 Supabase fallback。
 *
 * @param {object} payload - 要傳送的 JSON payload
 * @param {string} context - 識別用途標籤（用於日誌與 DB 記錄），例如 'order_notify'
 */
export async function notifyGAS(payload, context = 'webhook') {
    const GAS_URL = import.meta.env.VITE_GAS_WEBHOOK_URL;
    if (!GAS_URL) {
        console.error('[Webhook] VITE_GAS_WEBHOOK_URL 未設定，跳過通知');
        return;
    }

    const options = {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    };

    try {
        await fetchWithRetry(GAS_URL, options);
    } catch (err) {
        console.error(`[Webhook] ${context} 重試 ${MAX_RETRIES} 次後仍失敗：`, err.message);
        await logFailure(context, payload);
    }
}
