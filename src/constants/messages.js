/**
 * 前台使用者可見的錯誤訊息與提示文字集中管理。
 *
 * 分組說明：
 *   VALIDATION  - 表單欄位驗證錯誤（CustomerInfo）
 *   CART        - 購物車相關提示
 *   ORDER       - 訂單送出流程錯誤
 *   UPLOAD      - 檔案上傳錯誤
 *   STOCK       - 庫存相關錯誤
 *
 * 後台 Admin 頁面的訊息目前仍散落各頁面，可視後續需求另建 adminMessages.js。
 */

export const MESSAGES = {
    // ── 表單驗證 ─────────────────────────────────────────────
    VALIDATION: {
        PHONE_REQUIRED: '請輸入電話號碼',
        PHONE_FORMAT: '請輸入有效的台灣手機號碼 (09xxxxxxxx)',
        EMAIL_REQUIRED: '請輸入 Email',
        EMAIL_FORMAT: '請輸入有效的 Email 格式',
        STORE_NAME_HINT: '建議填寫完整「門市名稱」與「店號」以避免寄送錯誤。',
    },

    // ── 購物車 ────────────────────────────────────────────────
    CART: {
        COUPON_VALIDATE_FAILED: '驗證失敗，請稍後再試',
        FREE_SHIPPING_QUALIFIED: '恭喜！您已符合免運資格',
    },

    // ── 訂單送出 ──────────────────────────────────────────────
    ORDER: {
        SUBMIT_FAILED: '送出失敗，請稍後再試或直接聯繫我們。',
        // RPC 回傳逐項錯誤（含商品名稱動態插值）
        STOCK_DETAIL: (lines) => `庫存不足，無法結帳：\n${lines}`,
        // DB check_positive_stock 約束觸發的泛用訊息
        STOCK_INSUFFICIENT: '庫存不足！有商品已被搶購一空，請檢查購物車數量。',
    },

    // ── 檔案上傳 ──────────────────────────────────────────────
    UPLOAD: {
        FAILED: '圖片上傳失敗，請稍後再試',
        SIZE_EXCEEDED: (sizeMB) =>
            `檔案大小不能超過 10MB（目前 ${sizeMB}MB）`,
    },
};
