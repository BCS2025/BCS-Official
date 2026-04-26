/*
  BCS Order Manager & Notifier (Google Apps Script) - V6 (ECPay 物流)

  FEATURES:
  - Supports LINE Messaging API (Flex Messages with Customer Info)
  - Beautiful HTML Email Template with Tracking Page Link
  - Robust Low Stock Alerting support
  - LINE Pay payment_confirmed / payment_refunded notifications (email + LINE Flex)
  - ECPay 物流狀態變更：admin LINE Flex + 客戶里程碑 Email（已寄出 / 到店待取 / 已送達）

  SETUP:
  1. Script Properties: LINE_CHANNEL_ACCESS_TOKEN, LINE_USER_ID, ADMIN_EMAIL
  2. (Optional) Script Properties: BCS_BASE_URL（追蹤頁連結用，預設 https://bcs.tw）
*/

const BCS_BASE_URL = (function () {
    try {
        return PropertiesService.getScriptProperties().getProperty('BCS_BASE_URL') || 'https://bcs.tw';
    } catch (_) { return 'https://bcs.tw'; }
})();

function bcsTrackingUrl(orderId) {
    return BCS_BASE_URL.replace(/\/$/, '') + '/store/track?orderId=' + encodeURIComponent(orderId || '');
}

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const scriptProps = PropertiesService.getScriptProperties();

        const CHANNEL_TOKEN = scriptProps.getProperty('LINE_CHANNEL_ACCESS_TOKEN');
        const USER_ID = scriptProps.getProperty('LINE_USER_ID');

        // --- CASE 1: SYSTEM ALERT (Low Stock) ---
        if (data.type === 'system_alert') {
            sendLineMessagingApi(CHANNEL_TOKEN, USER_ID, [
                { type: 'text', text: data.message }
            ]);
            return ContentService.createTextOutput(JSON.stringify({ status: 'success', type: 'alert' }));
        }

        // --- CASE 2: CUSTOM QUOTE REQUEST ---
        if (data.type === 'custom_quote') {
            // 1. Send Email Acknowledgment to Customer
            if (data.customer && data.customer.email) {
                try {
                    sendQuoteAcknowledgeEmail(data);
                } catch (err) {
                    console.error("Quote Email Error:", err);
                }
            }

            // 2. Send Quote Details to Admin via LINE
            try {
                const quoteFlex = createQuoteFlexMessage(data);
                sendLineMessagingApi(CHANNEL_TOKEN, USER_ID, [quoteFlex]);
            } catch (err) {
                console.error("Quote Line Error:", err);
            }
            return ContentService.createTextOutput(JSON.stringify({ status: 'success', id: data.quote_id }));
        }

        // --- CASE 3: CUSTOMER INQUIRY (網頁客服詢問) ---
        if (data.type === 'inquiry') {
            try {
                const inquiryFlex = createInquiryFlexMessage(data);
                sendLineMessagingApi(CHANNEL_TOKEN, USER_ID, [inquiryFlex]);
            } catch (err) {
                console.error("Inquiry Line Error:", err);
            }
            return ContentService.createTextOutput(JSON.stringify({ status: 'success', type: 'inquiry' }));
        }

        // --- CASE 4: LINE PAY PAYMENT CONFIRMED ---
        if (data.type === 'payment_confirmed') {
            // 1. Email to customer (付款完成確認信)
            if (data.customer && data.customer.email) {
                try {
                    sendPaymentConfirmedEmail(data);
                } catch (err) {
                    console.error("PaymentConfirmed Email Error:", err);
                }
            }

            // 2. Flex to admin (付款完成通知)
            try {
                const flex = createPaymentConfirmedFlex(data);
                sendLineMessagingApi(CHANNEL_TOKEN, USER_ID, [flex]);
            } catch (err) {
                console.error("PaymentConfirmed Line Error:", err);
            }

            return ContentService.createTextOutput(JSON.stringify({ status: 'success', type: 'payment_confirmed', id: data.orderId }));
        }

        // --- CASE 5: LINE PAY PAYMENT REFUNDED ---
        if (data.type === 'payment_refunded') {
            // 1. Email to customer (退款通知)
            if (data.customer && data.customer.email) {
                try {
                    sendPaymentRefundedEmail(data);
                } catch (err) {
                    console.error("PaymentRefunded Email Error:", err);
                }
            }

            // 2. Flex to admin (退款通知)
            try {
                const flex = createPaymentRefundedFlex(data);
                sendLineMessagingApi(CHANNEL_TOKEN, USER_ID, [flex]);
            } catch (err) {
                console.error("PaymentRefunded Line Error:", err);
            }

            return ContentService.createTextOutput(JSON.stringify({ status: 'success', type: 'payment_refunded', id: data.orderId }));
        }

        // --- CASE 6: ECPAY 物流狀態變更 ---
        if (data.type === 'logistics_status') {
            const milestone = classifyLogisticsStatus(data.subType, data.rtnCode);

            // 1. Admin Flex（不論里程碑都通知）
            try {
                const flex = createLogisticsStatusFlex(data, milestone);
                sendLineMessagingApi(CHANNEL_TOKEN, USER_ID, [flex]);
            } catch (err) {
                console.error("LogisticsStatus Line Error:", err);
            }

            // 2. Customer Email — 僅在關鍵里程碑（已寄出 / 到店待取 / 已送達）發送
            const SHOULD_EMAIL = { shipped: true, arrived: true, delivered: true };
            if (SHOULD_EMAIL[milestone.key] && data.customer && data.customer.email) {
                try {
                    sendLogisticsStatusEmail(data, milestone);
                } catch (err) {
                    console.error("LogisticsStatus Email Error:", err);
                }
            }

            return ContentService.createTextOutput(JSON.stringify({
                status: 'success',
                type: 'logistics_status',
                id: data.orderId,
                milestone: milestone.key,
            }));
        }

        // --- CASE 7: NEW ORDER (fallback，無 type 欄位) ---
        // 1. Send Beautiful Email to Customer
        if (data.customer && data.customer.email) {
            try {
                sendCustomerEmail(data);
            } catch (err) {
                console.error("Email Error:", err);
            }
        }

        // 2. Send Flex Message Receipt to Admin
        try {
            const flexMessage = createFlexReceipt(data);
            sendLineMessagingApi(CHANNEL_TOKEN, USER_ID, [flexMessage]);
        } catch (err) {
            console.error("Line Error:", err);
        }

        return ContentService.createTextOutput(JSON.stringify({ status: 'success', id: data.orderId }));

    } catch (error) {
        console.error("Error in doPost:", error);
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }));
    }
}

// --- HELPER: Send Line Messaging API ---
function sendLineMessagingApi(token, userId, messages) {
    if (!token || !userId) return;

    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
        'method': 'post',
        'headers': {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        'payload': JSON.stringify({
            to: userId,
            messages: messages
        })
    });
}

// --- HELPER: Create Flex Message (Receipt Style) ---
function createFlexReceipt(order) {
    const itemRows = order.items.map(item => {
        let details = [];
        Object.keys(item).forEach(key => {
            if (['productId', 'productName', '_id', 'price', 'quantity', 'image'].includes(key)) return;
            if (key === 'proofFileLater') return;
            if (key.endsWith('_filename')) return;
            if (item[key + '_filename']) return; // file URL，下方專屬列出
            if (item[key] === null || item[key] === '' || item[key] === undefined) return;
            details.push(item[key]);
        });
        const detailText = details.join(' / ');

        // 檔案行
        const fileRows = Object.keys(item)
            .filter(k => k.endsWith('_filename') && item[k] && item[k.replace(/_filename$/, '')])
            .map(k => {
                const url = item[k.replace(/_filename$/, '')];
                return { type: "text", text: '📎 ' + item[k] + ' → ' + url, size: "xs", color: "#1d4ed8", wrap: true, margin: "xs" };
            });

        const lateRow = item.proofFileLater
            ? { type: "text", text: '⚠️ 稍後上傳（待客戶補件）', size: "xs", color: "#c2410c", weight: "bold", margin: "xs" }
            : null;

        return {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
                {
                    type: "box",
                    layout: "baseline",
                    spacing: "sm",
                    contents: [
                        { type: "text", text: item.productName || item.productId, weight: "bold", size: "sm", color: "#333333", flex: 4, wrap: true },
                        { type: "text", text: `x${item.quantity}`, size: "sm", color: "#666666", align: "end", flex: 1 }
                    ]
                },
                detailText ? { type: "text", text: detailText, size: "xs", color: "#aaaaaa", wrap: true, margin: "xs" } : null,
                ...fileRows,
                lateRow
            ].filter(Boolean)
        };
    });

    return {
        type: "flex",
        altText: `新訂單 ${order.orderId}`,
        contents: {
            type: "bubble",
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    { type: "text", text: "NEW ORDER", weight: "bold", color: "#1DB446", size: "sm" },
                    { type: "text", text: "BCS 客製工坊", weight: "bold", size: "xl", margin: "md" },
                    { type: "text", text: `ID: ${order.orderId}`, size: "xs", color: "#aaaaaa", wrap: true },
                    { type: "separator", margin: "xxl" },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "xxl",
                        spacing: "sm",
                        contents: itemRows
                    },
                    { type: "separator", margin: "xxl" },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "xxl",
                        spacing: "sm",
                        contents: [
                            {
                                type: "box",
                                layout: "baseline",
                                contents: [
                                    { type: "text", text: "總金額", color: "#555555" },
                                    { type: "text", text: `$${order.totalAmount}`, color: "#111111", size: "lg", weight: "bold", align: "end" }
                                ]
                            }
                        ]
                    },
                    { type: "separator", margin: "xxl" },
                    {
                        type: "box", layout: "vertical", margin: "lg", spacing: "sm",
                        contents: [
                            { type: "text", text: `客戶: ${order.customer.name}`, size: "sm", color: "#555555" },
                            { type: "text", text: `電話: ${order.customer.phone}`, size: "sm", color: "#555555" },
                            { type: "text", text: `配送: ${order.customer.shippingMethod === 'pickup' ? '自取' : '郵寄'}`, size: "sm", color: "#555555" },
                            order.customer.address ? { type: "text", text: `地址: ${order.customer.address}`, size: "xs", color: "#999999", wrap: true } : null
                        ].filter(Boolean)
                    }
                ]
            }
        }
    };
}

// --- HELPER: Send Professional HTML Email ---
function sendCustomerEmail(order) {
    const subject = `【BCS 訂單確認】${order.orderId} - 感謝您的訂購`;

    let itemsHtml = order.items.map(item => {
        let details = [];
        Object.keys(item).forEach(key => {
            if (['productId', 'productName', '_id', 'price', 'quantity', 'image'].includes(key)) return;
            if (key === 'proofFileLater') return;
            if (key.endsWith('_filename')) return;
            if (item[key + '_filename']) return;
            if (item[key] === null || item[key] === '' || item[key] === undefined) return;
            details.push(`${key}: ${item[key]}`);
        });

        const fileLines = Object.keys(item)
            .filter(k => k.endsWith('_filename') && item[k] && item[k.replace(/_filename$/, '')])
            .map(k => {
                const url = item[k.replace(/_filename$/, '')];
                return `<div style="font-size:12px;margin-top:4px;"><a href="${url}" style="color:#1d4ed8;">📎 ${item[k]}</a></div>`;
            }).join('');

        const lateHtml = item.proofFileLater
            ? '<div style="font-size:12px;color:#c2410c;font-weight:bold;margin-top:4px;">⚠️ 稍後上傳（待客戶補件）</div>'
            : '';

        return `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 0;">
          <div style="font-weight: bold; color: #333;">${item.productName || item.productId}</div>
          <div style="font-size: 12px; color: #888;">${details.join(' | ')}</div>
          ${fileLines}
          ${lateHtml}
        </td>
        <td style="padding: 12px 0; text-align: right; color: #555;">x ${item.quantity}</td>
      </tr>
    `;
    }).join('');

    const body = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .btn { display: inline-block; background: #00B900; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .container { max-width: 600px; margin: 0 auto; font-family: sans-serif; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
        .header { background: #333; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; }
      </style>
    </head>
    <body style="margin:0; padding:20px; background:#f5f5f5;">
      <div class="container" style="background: white;">
        <div class="header">
          <h1 style="margin:0; font-size: 20px;">訂單確認</h1>
          <p style="margin:5px 0 0; opacity: 0.8;">${order.orderId}</p>
        </div>
        
        <div class="content">
          <p>親愛的 ${order.customer.name} 您好，</p>
          <p>感謝您的訂購！我們已經收到您的訂單資料。</p>
          
          <h3 style="border-bottom: 2px solid #333; padding-bottom: 10px; margin-top: 30px;">訂單明細</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsHtml}
            <tr>
              <td style="padding: 15px 0; font-weight: bold; font-size: 18px;">總金額</td>
              <td style="padding: 15px 0; text-align: right; font-weight: bold; font-size: 18px; color: #e53e3e;">$${order.totalAmount}</td>
            </tr>
          </table>
          
          <div style="background: #f0f7ff; border: 1px solid #cce4ff; padding: 15px; border-radius: 5px; margin-top: 30px;">
            <h4 style="margin: 0 0 10px; color: #004488;">🛒 下一步：付款與確認</h4>
            <p style="margin: 5px 0; font-size: 14px;">1. 請將款項匯至：<b>822 (中信) 123-456-7890</b></p>
            <p style="margin: 5px 0; font-size: 14px;">2. 匯款後，請點擊下方按鈕加入官方 LINE，告知我們您的<b>「帳號末五碼」</b>以完成對帳。</p>

            <div style="text-align: center; margin-top: 20px;">
              <a href="https://line.me/R/ti/p/@bcs_official" class="btn" style="color: white !important;">LINE 聯繫客服</a>
            </div>
          </div>

          <div style="text-align:center;margin-top:20px;">
            <a href="${bcsTrackingUrl(order.orderId)}" style="display:inline-block;background:#EA580C;color:white !important;padding:10px 20px;text-decoration:none;border-radius:5px;font-weight:bold;">📦 查看物流追蹤</a>
            <p style="font-size:12px;color:#888;margin-top:8px;">付款確認後會自動建立託運單，可隨時回此頁查看狀態。</p>
          </div>
        </div>
        
        <div class="footer">
          <p>此信件為系統自動發送</p>
          <p>Be Creative Space | 客製化工坊</p>
        </div>
      </div>
    </body>
    </html>
  `;

    MailApp.sendEmail({
        to: order.customer.email,
        subject: subject,
        htmlBody: body
    });
}

// --- HELPER: Create Flex Message for Custom Quotes ---
function createQuoteFlexMessage(quote) {
    let specText = "";
    if (quote.method === 'laser') {
        specText = `需向量服務: ${quote.specifications.needVectorService ? '是' : '否'}`;
    } else {
        specText = `填充: ${quote.specifications.infill} / 層高: ${quote.specifications.layerHeight}`;
    }

    const contents = [
        { type: "text", text: "NEW QUOTE REQUEST", weight: "bold", color: "#F59E0B", size: "sm" },
        { type: "text", text: "鍛造工坊詢價", weight: "bold", size: "xl", margin: "md" },
        { type: "text", text: `ID: ${quote.quote_id}`, size: "xs", color: "#aaaaaa", wrap: true },
        { type: "separator", margin: "xxl" },
        {
            type: "box", layout: "vertical", margin: "lg", spacing: "sm",
            contents: [
                { type: "text", text: `工法: ${quote.method === 'laser' ? '雷射切割/雕刻' : 'FDM 3D列印'}`, size: "sm", weight: "bold", color: "#333333" },
                { type: "text", text: `材質: ${quote.material}`, size: "sm", color: "#555555" },
                { type: "text", text: `規格: ${specText}`, size: "sm", color: "#555555" },
                { type: "text", text: `尺寸: X:${quote.dimensions.dimX} Y:${quote.dimensions.dimY} Z:${quote.dimensions.dimZ} (mm)`, size: "sm", color: "#555555" },
                { type: "text", text: `優化需求: ${quote.need_optimization ? '需要' : '不需要'}`, size: "sm", color: quote.need_optimization ? "#E11D48" : "#555555" }
            ]
        },
        { type: "separator", margin: "xxl" },
        {
            type: "box", layout: "vertical", margin: "lg", spacing: "sm",
            contents: [
                { type: "text", text: `客戶: ${quote.customer.name}`, size: "sm", color: "#555555" },
                { type: "text", text: `Email: ${quote.customer.email}`, size: "xs", color: "#555555" },
                quote.customer.lineId ? { type: "text", text: `LINE ID: ${quote.customer.lineId}`, size: "sm", color: "#555555" } : null,
                quote.notes ? { type: "text", text: `備註: ${quote.notes}`, size: "xs", color: "#999999", wrap: true, margin: "md" } : null
            ].filter(Boolean)
        }
    ];

    if (quote.file_url) {
        contents.push({
            type: "button",
            style: "primary",
            color: "#D97706",
            margin: "xl",
            action: {
                type: "uri",
                label: "下載設計檔",
                uri: quote.file_url
            }
        });
    }

    return {
        type: "flex",
        altText: `新詢價單 ${quote.quote_id}`,
        contents: {
            type: "bubble",
            body: {
                type: "box",
                layout: "vertical",
                contents: contents
            }
        }
    };
}

// --- HELPER: Create Flex Message for Customer Inquiry ---
function createInquiryFlexMessage(inquiry) {
    const BRAND_COLORS = {
        '販創所':   '#EA580C',
        '鍛造工坊': '#1D4ED8',
        '創客世界': '#16A34A',
        '比創空間': '#111111'
    };
    const brandColor = BRAND_COLORS[inquiry.brand] || '#111111';

    const ts = inquiry.submitted_at ? new Date(inquiry.submitted_at) : new Date();
    const timeStr = Utilities.formatDate(ts, 'Asia/Taipei', 'MM/dd HH:mm');

    // 客戶可能連續傳多則訊息，每則一行
    const messages = (inquiry.messages && inquiry.messages.length)
        ? inquiry.messages
        : [inquiry.question || ''];
    const messageContents = messages.map(function (msg) {
        return {
            type: "text",
            text: "💬 " + msg,
            size: "sm",
            color: "#333333",
            wrap: true,
            margin: "sm"
        };
    });

    // 來源頁面：商品頁顯示商品名，其他顯示 path
    const pageLabel = inquiry.product_name
        ? "📦 " + inquiry.product_name
        : "📍 " + (inquiry.page_path || '/');

    return {
        type: "flex",
        altText: "[" + inquiry.brand + "] 新詢問: " + (messages[0] || '').slice(0, 30),
        contents: {
            type: "bubble",
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    { type: "text", text: "NEW INQUIRY", weight: "bold", color: brandColor, size: "sm" },
                    { type: "text", text: inquiry.brand + " 客服詢問", weight: "bold", size: "lg", margin: "md" },
                    { type: "text", text: pageLabel, size: "xs", color: "#888888", wrap: true, margin: "sm" },
                    { type: "separator", margin: "lg" },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "lg",
                        spacing: "xs",
                        contents: messageContents
                    },
                    { type: "separator", margin: "lg" },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "lg",
                        spacing: "sm",
                        contents: [
                            { type: "text", text: "📞 " + inquiry.contact, size: "md", weight: "bold", color: brandColor, wrap: true },
                            { type: "text", text: timeStr, size: "xs", color: "#aaaaaa", margin: "xs" }
                        ]
                    }
                ]
            }
        }
    };
}

// --- HELPER: Send Quote Acknowledgment HTML Email ---
function sendQuoteAcknowledgeEmail(quote) {
    const subject = `【BCS 鍛造工坊】${quote.quote_id} - 已收到您的報價需求`;
    const methodStr = quote.method === 'laser' ? '雷射切割/雕刻' : 'FDM 3D列印';

    const body = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container { max-width: 600px; margin: 0 auto; font-family: sans-serif; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
        .header { background: #333; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; line-height: 1.6; color: #333; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; }
        .box { background: #fdfbf7; border: 1px solid #e5e5e5; padding: 15px; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body style="margin:0; padding:20px; background:#f5f5f5;">
      <div class="container" style="background: white;">
        <div class="header">
          <h1 style="margin:0; font-size: 20px; color: #F59E0B;">鍛造工坊 詢價確認</h1>
          <p style="margin:5px 0 0; opacity: 0.8;">${quote.quote_id}</p>
        </div>
        
        <div class="content">
          <p>親愛的 ${quote.customer.name} 您好，</p>
          <p>我們已經收到您的 <strong>${methodStr}</strong> 客製化製造評估需求與設計檔案。</p>
          <p>我們的工程團隊將會針對您提供的檔案進行製造可行性與成本評估。</p>
          
          <div class="box">
            <h4 style="margin: 0 0 10px; color: #D97706;">📝 需求摘要</h4>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li><strong>材質:</strong> ${quote.material}</li>
              <li><strong>最大包絡尺寸 (mm):</strong> X:${quote.dimensions.dimX}, Y:${quote.dimensions.dimY}, Z:${quote.dimensions.dimZ}</li>
              <li><strong>進階優化:</strong> ${quote.need_optimization ? '需要機構優化評估' : '無'}</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px;"><strong>⏳ 接下來會發生什麼事？</strong><br>
          我們預計在 <strong>3 個工作天</strong>內，透過 Email (或您留下的 LINE ID) 提供給您正式報價單與加工建議。若圖檔有無法解讀之情形，我們也會盡快與您聯繫。</p>
          
          <p>感謝您對比創空間 (BCS) 的支持，期待為您 "Make it Real"！</p>
        </div>
        
        <div class="footer">
          <p>此信件為系統自動發送，請勿直接回覆。</p>
          <p>Be Creative Space | 鍛造工坊</p>
        </div>
      </div>
    </body>
    </html>
  `;

    MailApp.sendEmail({
        to: quote.customer.email,
        subject: subject,
        htmlBody: body
    });
}

// --- HELPER: Payment Confirmed Email (LINE Pay 付款完成確認信) ---
function sendPaymentConfirmedEmail(data) {
    const subject = `【BCS 付款完成】${data.orderId} - LINE Pay 付款已確認`;

    let itemsHtml = '';
    if (data.items && data.items.length) {
        itemsHtml = data.items.map(function (item) {
            let details = [];
            Object.keys(item).forEach(function (key) {
                if (['productId', 'productName', '_id', 'price', 'quantity', 'image'].includes(key)) return;
                if (key === 'proofFileLater') return;
                if (key.endsWith('_filename')) return;
                if (item[key + '_filename']) return;
                if (item[key] === null || item[key] === '' || item[key] === undefined) return;
                details.push(key + ': ' + item[key]);
            });
            const fileLines = Object.keys(item)
                .filter(function (k) { return k.endsWith('_filename') && item[k] && item[k.replace(/_filename$/, '')]; })
                .map(function (k) {
                    const url = item[k.replace(/_filename$/, '')];
                    return '<div style="font-size:12px;margin-top:4px;"><a href="' + url + '" style="color:#1d4ed8;">📎 ' + item[k] + '</a></div>';
                }).join('');
            const lateHtml = item.proofFileLater
                ? '<div style="font-size:12px;color:#c2410c;font-weight:bold;margin-top:4px;">⚠️ 稍後上傳（待客戶補件）</div>'
                : '';
            return '<tr style="border-bottom:1px solid #eee;">'
                + '<td style="padding:12px 0;">'
                + '<div style="font-weight:bold;color:#333;">' + (item.productName || item.productId) + '</div>'
                + '<div style="font-size:12px;color:#888;">' + details.join(' | ') + '</div>'
                + fileLines
                + lateHtml
                + '</td>'
                + '<td style="padding:12px 0;text-align:right;color:#555;">x ' + item.quantity + '</td>'
                + '</tr>';
        }).join('');
    }

    const paidAtStr = data.paidAt
        ? Utilities.formatDate(new Date(data.paidAt), 'Asia/Taipei', 'yyyy/MM/dd HH:mm')
        : Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd HH:mm');

    const body = ''
        + '<!DOCTYPE html><html><head><style>'
        + '.container{max-width:600px;margin:0 auto;font-family:sans-serif;border:1px solid #eee;border-radius:8px;overflow:hidden;}'
        + '.header{background:#00B900;color:white;padding:20px;text-align:center;}'
        + '.content{padding:20px;line-height:1.6;}'
        + '.footer{background:#f9f9f9;padding:20px;text-align:center;font-size:12px;color:#999;}'
        + '.info-box{background:#f0fdf4;border:1px solid #bbf7d0;padding:15px;border-radius:5px;margin-top:20px;}'
        + '</style></head>'
        + '<body style="margin:0;padding:20px;background:#f5f5f5;">'
        + '<div class="container" style="background:white;">'
        + '<div class="header">'
        + '<h1 style="margin:0;font-size:20px;">✅ 付款完成</h1>'
        + '<p style="margin:5px 0 0;opacity:0.9;">' + data.orderId + '</p>'
        + '</div>'
        + '<div class="content">'
        + '<p>親愛的 ' + (data.customer && data.customer.name ? data.customer.name : '客戶') + ' 您好，</p>'
        + '<p>我們已收到您透過 <strong>LINE Pay</strong> 完成的付款，訂單已進入處理階段。</p>'
        + '<div class="info-box">'
        + '<h4 style="margin:0 0 10px;color:#16a34a;">💳 付款資訊</h4>'
        + '<p style="margin:5px 0;font-size:14px;">訂單編號：<b>' + data.orderId + '</b></p>'
        + '<p style="margin:5px 0;font-size:14px;">付款金額：<b>$' + data.totalAmount + '</b></p>'
        + '<p style="margin:5px 0;font-size:14px;">付款時間：<b>' + paidAtStr + '</b></p>'
        + '<p style="margin:5px 0;font-size:14px;">交易編號：<b style="font-family:monospace;">' + (data.transactionId || '-') + '</b></p>'
        + '</div>'
        + (itemsHtml
            ? '<h3 style="border-bottom:2px solid #333;padding-bottom:10px;margin-top:30px;">訂單明細</h3>'
              + '<table style="width:100%;border-collapse:collapse;">' + itemsHtml
              + '<tr><td style="padding:15px 0;font-weight:bold;font-size:18px;">總金額</td>'
              + '<td style="padding:15px 0;text-align:right;font-weight:bold;font-size:18px;color:#16a34a;">$' + data.totalAmount + '</td></tr>'
              + '</table>'
            : '')
        + '<div style="text-align:center;margin-top:30px;">'
        + '<a href="' + bcsTrackingUrl(data.orderId) + '" style="display:inline-block;background:#EA580C;color:white !important;padding:10px 20px;text-decoration:none;border-radius:5px;font-weight:bold;">📦 查看物流追蹤</a>'
        + '<p style="font-size:12px;color:#888;margin-top:8px;">託運單建立後，狀態會自動更新到追蹤頁。</p>'
        + '</div>'
        + '<p style="margin-top:30px;">我們將盡快為您準備商品。若有任何問題，歡迎 <a href="https://line.me/R/ti/p/@bcs_official">LINE 聯繫客服</a>。</p>'
        + '</div>'
        + '<div class="footer"><p>此信件為系統自動發送</p><p>Be Creative Space | 客製化工坊</p></div>'
        + '</div></body></html>';

    MailApp.sendEmail({
        to: data.customer.email,
        subject: subject,
        htmlBody: body
    });
}

// --- HELPER: Payment Confirmed Flex Message (管理員 LINE 通知) ---
function createPaymentConfirmedFlex(data) {
    const paidAtStr = data.paidAt
        ? Utilities.formatDate(new Date(data.paidAt), 'Asia/Taipei', 'MM/dd HH:mm')
        : Utilities.formatDate(new Date(), 'Asia/Taipei', 'MM/dd HH:mm');

    return {
        type: "flex",
        altText: '✅ LINE Pay 付款完成 ' + data.orderId + ' $' + data.totalAmount,
        contents: {
            type: "bubble",
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    { type: "text", text: "PAYMENT CONFIRMED", weight: "bold", color: "#00B900", size: "sm" },
                    { type: "text", text: "LINE Pay 付款完成", weight: "bold", size: "xl", margin: "md" },
                    { type: "text", text: 'ID: ' + data.orderId, size: "xs", color: "#aaaaaa", wrap: true },
                    { type: "separator", margin: "xxl" },
                    {
                        type: "box", layout: "vertical", margin: "xxl", spacing: "sm",
                        contents: [
                            {
                                type: "box", layout: "baseline",
                                contents: [
                                    { type: "text", text: "付款金額", color: "#555555", size: "sm" },
                                    { type: "text", text: '$' + data.totalAmount, color: "#00B900", size: "lg", weight: "bold", align: "end" }
                                ]
                            },
                            {
                                type: "box", layout: "baseline",
                                contents: [
                                    { type: "text", text: "付款時間", color: "#555555", size: "sm", flex: 2 },
                                    { type: "text", text: paidAtStr, color: "#111111", size: "sm", align: "end", flex: 3 }
                                ]
                            },
                            {
                                type: "box", layout: "baseline",
                                contents: [
                                    { type: "text", text: "交易編號", color: "#555555", size: "sm", flex: 2 },
                                    { type: "text", text: String(data.transactionId || '-'), color: "#111111", size: "xs", align: "end", flex: 3, wrap: true }
                                ]
                            }
                        ]
                    },
                    { type: "separator", margin: "xxl" },
                    {
                        type: "box", layout: "vertical", margin: "lg", spacing: "sm",
                        contents: [
                            data.customer && data.customer.name ? { type: "text", text: '客戶: ' + data.customer.name, size: "sm", color: "#555555" } : null,
                            data.customer && data.customer.phone ? { type: "text", text: '電話: ' + data.customer.phone, size: "sm", color: "#555555" } : null
                        ].filter(Boolean)
                    }
                ]
            }
        }
    };
}

// --- HELPER: Payment Refunded Email (LINE Pay 退款通知) ---
function sendPaymentRefundedEmail(data) {
    const isFull = !!data.isFull;
    const subject = '【BCS ' + (isFull ? '全額' : '部分') + '退款通知】' + data.orderId;

    const body = ''
        + '<!DOCTYPE html><html><head><style>'
        + '.container{max-width:600px;margin:0 auto;font-family:sans-serif;border:1px solid #eee;border-radius:8px;overflow:hidden;}'
        + '.header{background:#dc2626;color:white;padding:20px;text-align:center;}'
        + '.content{padding:20px;line-height:1.6;}'
        + '.footer{background:#f9f9f9;padding:20px;text-align:center;font-size:12px;color:#999;}'
        + '.info-box{background:#fef2f2;border:1px solid #fecaca;padding:15px;border-radius:5px;margin-top:20px;}'
        + '</style></head>'
        + '<body style="margin:0;padding:20px;background:#f5f5f5;">'
        + '<div class="container" style="background:white;">'
        + '<div class="header">'
        + '<h1 style="margin:0;font-size:20px;">🔁 ' + (isFull ? '全額' : '部分') + '退款通知</h1>'
        + '<p style="margin:5px 0 0;opacity:0.9;">' + data.orderId + '</p>'
        + '</div>'
        + '<div class="content">'
        + '<p>親愛的 ' + (data.customer && data.customer.name ? data.customer.name : '客戶') + ' 您好，</p>'
        + '<p>我們已為您處理完成 LINE Pay ' + (isFull ? '全額' : '部分') + '退款，款項將由 LINE Pay 於數個工作日內退回您的原付款方式。</p>'
        + '<div class="info-box">'
        + '<h4 style="margin:0 0 10px;color:#dc2626;">💰 退款資訊</h4>'
        + '<p style="margin:5px 0;font-size:14px;">訂單編號：<b>' + data.orderId + '</b></p>'
        + '<p style="margin:5px 0;font-size:14px;">退款金額：<b>$' + data.refundAmount + '</b></p>'
        + '<p style="margin:5px 0;font-size:14px;">退款類型：<b>' + (isFull ? '全額退款（訂單已取消）' : '部分退款') + '</b></p>'
        + (data.refundTransactionId
            ? '<p style="margin:5px 0;font-size:14px;">退款交易編號：<b style="font-family:monospace;">' + data.refundTransactionId + '</b></p>'
            : '')
        + '</div>'
        + '<p style="margin-top:30px;">若有任何疑問，歡迎 <a href="https://line.me/R/ti/p/@bcs_official">LINE 聯繫客服</a>。</p>'
        + '</div>'
        + '<div class="footer"><p>此信件為系統自動發送</p><p>Be Creative Space | 客製化工坊</p></div>'
        + '</div></body></html>';

    MailApp.sendEmail({
        to: data.customer.email,
        subject: subject,
        htmlBody: body
    });
}

// --- HELPER: Payment Refunded Flex Message (管理員 LINE 通知) ---
function createPaymentRefundedFlex(data) {
    const isFull = !!data.isFull;
    return {
        type: "flex",
        altText: '🔁 LINE Pay ' + (isFull ? '全額' : '部分') + '退款 ' + data.orderId + ' $' + data.refundAmount,
        contents: {
            type: "bubble",
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    { type: "text", text: "PAYMENT REFUNDED", weight: "bold", color: "#dc2626", size: "sm" },
                    { type: "text", text: 'LINE Pay ' + (isFull ? '全額' : '部分') + '退款', weight: "bold", size: "xl", margin: "md" },
                    { type: "text", text: 'ID: ' + data.orderId, size: "xs", color: "#aaaaaa", wrap: true },
                    { type: "separator", margin: "xxl" },
                    {
                        type: "box", layout: "vertical", margin: "xxl", spacing: "sm",
                        contents: [
                            {
                                type: "box", layout: "baseline",
                                contents: [
                                    { type: "text", text: "退款金額", color: "#555555", size: "sm" },
                                    { type: "text", text: '$' + data.refundAmount, color: "#dc2626", size: "lg", weight: "bold", align: "end" }
                                ]
                            },
                            {
                                type: "box", layout: "baseline",
                                contents: [
                                    { type: "text", text: "退款類型", color: "#555555", size: "sm", flex: 2 },
                                    { type: "text", text: isFull ? '全額退款' : '部分退款', color: "#111111", size: "sm", align: "end", flex: 3 }
                                ]
                            },
                            data.refundTransactionId ? {
                                type: "box", layout: "baseline",
                                contents: [
                                    { type: "text", text: "退款編號", color: "#555555", size: "sm", flex: 2 },
                                    { type: "text", text: String(data.refundTransactionId), color: "#111111", size: "xs", align: "end", flex: 3, wrap: true }
                                ]
                            } : null,
                            data.refundedBy ? {
                                type: "box", layout: "baseline",
                                contents: [
                                    { type: "text", text: "操作者", color: "#555555", size: "sm", flex: 2 },
                                    { type: "text", text: String(data.refundedBy), color: "#111111", size: "xs", align: "end", flex: 3, wrap: true }
                                ]
                            } : null
                        ].filter(Boolean)
                    },
                    data.customer && data.customer.name ? { type: "separator", margin: "xxl" } : null,
                    data.customer && data.customer.name ? {
                        type: "box", layout: "vertical", margin: "lg", spacing: "sm",
                        contents: [
                            { type: "text", text: '客戶: ' + data.customer.name, size: "sm", color: "#555555" }
                        ]
                    } : null
                ].filter(Boolean)
            }
        }
    };
}

// --- HELPER: 將綠界 RtnCode 對應到語意化里程碑 ---
function classifyLogisticsStatus(subType, rtnCode) {
    const code = String(rtnCode || '');
    const C2C_BRANDS = { UNIMARTC2C: 1, FAMIC2C: 1, HILIFEC2C: 1, OKMARTC2C: 1 };

    if (C2C_BRANDS[subType]) {
        if (code === '300' || code === '2030') return { key: 'created',  label: '訂單建立', emoji: '🆕', brand: brandLabel(subType) };
        if (code === '310' || code === '311')  return { key: 'shipped',  label: '已寄件',   emoji: '📦', brand: brandLabel(subType) };
        if (code === '2063' || code === '325' || code === '2067') return { key: 'arrived',   label: '到店待取', emoji: '🏪', brand: brandLabel(subType) };
        if (code === '320' || code === '322')  return { key: 'delivered', label: '已取貨',  emoji: '✅', brand: brandLabel(subType) };
    }
    if (subType === 'TCAT') {
        if (code === '300') return { key: 'created',  label: '訂單建立', emoji: '🆕', brand: '黑貓宅急便' };
        if (code === '901' || code === '902') return { key: 'shipped',   label: '已取件',  emoji: '📦', brand: '黑貓宅急便' };
        if (code === '906' || code === '907') return { key: 'inTransit', label: '配送中',  emoji: '🚚', brand: '黑貓宅急便' };
        if (code === '908' || code === '5008') return { key: 'delivered', label: '已送達', emoji: '✅', brand: '黑貓宅急便' };
    }
    if (subType === 'POST') {
        if (code === '300')   return { key: 'created',   label: '訂單建立', emoji: '🆕', brand: '中華郵政' };
        if (code === '30001') return { key: 'shipped',   label: '已交寄',   emoji: '📦', brand: '中華郵政' };
        if (code === '30002') return { key: 'inTransit', label: '投遞中',   emoji: '🚚', brand: '中華郵政' };
        if (code === '30003') return { key: 'delivered', label: '已投遞',   emoji: '✅', brand: '中華郵政' };
    }
    return { key: 'unknown', label: '狀態變更（' + code + '）', emoji: 'ℹ️', brand: brandLabel(subType) };
}

function brandLabel(subType) {
    return ({
        UNIMARTC2C: '7-11 賣貨便',
        FAMIC2C: '全家店到店',
        HILIFEC2C: '萊爾富店到店',
        OKMARTC2C: 'OK 超商店到店',
        TCAT: '黑貓宅急便',
        POST: '中華郵政',
    })[subType] || (subType || '物流');
}

// --- HELPER: 物流狀態變更 Admin Flex ---
function createLogisticsStatusFlex(data, milestone) {
    const tsStr = data.ts
        ? Utilities.formatDate(new Date(data.ts), 'Asia/Taipei', 'MM/dd HH:mm')
        : Utilities.formatDate(new Date(), 'Asia/Taipei', 'MM/dd HH:mm');

    const colorByMilestone = {
        shipped:   '#7c3aed',
        arrived:   '#16a34a',
        inTransit: '#2563eb',
        delivered: '#059669',
        created:   '#6b7280',
        unknown:   '#6b7280',
    }[milestone.key] || '#6b7280';

    const rows = [
        { type: "box", layout: "baseline", contents: [
            { type: "text", text: "物流", color: "#555555", size: "sm", flex: 2 },
            { type: "text", text: milestone.brand, color: "#111111", size: "sm", align: "end", flex: 3, wrap: true }
        ]},
        { type: "box", layout: "baseline", contents: [
            { type: "text", text: "狀態", color: "#555555", size: "sm", flex: 2 },
            { type: "text", text: milestone.label + '（' + (data.rtnMsg || data.rtnCode || '') + '）', color: colorByMilestone, size: "sm", weight: "bold", align: "end", flex: 3, wrap: true }
        ]},
        { type: "box", layout: "baseline", contents: [
            { type: "text", text: "託運單", color: "#555555", size: "sm", flex: 2 },
            { type: "text", text: String(data.shipmentNo || data.logisticsId || '-'), color: "#111111", size: "xs", align: "end", flex: 3, wrap: true }
        ]},
        data.storeName ? { type: "box", layout: "baseline", contents: [
            { type: "text", text: "取件門市", color: "#555555", size: "sm", flex: 2 },
            { type: "text", text: String(data.storeName), color: "#111111", size: "xs", align: "end", flex: 3, wrap: true }
        ]} : null,
        { type: "box", layout: "baseline", contents: [
            { type: "text", text: "更新時間", color: "#555555", size: "sm", flex: 2 },
            { type: "text", text: tsStr, color: "#111111", size: "sm", align: "end", flex: 3 }
        ]},
    ].filter(Boolean);

    return {
        type: "flex",
        altText: milestone.emoji + ' [物流] ' + milestone.label + ' ' + data.orderId,
        contents: {
            type: "bubble",
            body: {
                type: "box", layout: "vertical",
                contents: [
                    { type: "text", text: "LOGISTICS UPDATE", weight: "bold", color: colorByMilestone, size: "sm" },
                    { type: "text", text: milestone.emoji + ' ' + milestone.label, weight: "bold", size: "xl", margin: "md" },
                    { type: "text", text: 'ID: ' + data.orderId, size: "xs", color: "#aaaaaa", wrap: true },
                    { type: "separator", margin: "xxl" },
                    { type: "box", layout: "vertical", margin: "xxl", spacing: "sm", contents: rows },
                    (data.customer && (data.customer.name || data.customer.phone)) ? { type: "separator", margin: "xxl" } : null,
                    (data.customer && (data.customer.name || data.customer.phone)) ? {
                        type: "box", layout: "vertical", margin: "lg", spacing: "sm",
                        contents: [
                            data.customer.name  ? { type: "text", text: '客戶: ' + data.customer.name, size: "sm", color: "#555555" } : null,
                            data.customer.phone ? { type: "text", text: '電話: ' + data.customer.phone, size: "sm", color: "#555555" } : null,
                        ].filter(Boolean)
                    } : null,
                ].filter(Boolean)
            }
        }
    };
}

// --- HELPER: 物流里程碑 Email（給客戶）---
function sendLogisticsStatusEmail(data, milestone) {
    const subject = '【BCS 販創所】' + milestone.emoji + ' 訂單 ' + data.orderId + ' ' + milestone.label;
    const trackingUrl = bcsTrackingUrl(data.orderId);

    const tipByKey = {
        shipped:   '我們已將您的包裹交給物流，請耐心等待。',
        arrived:   '請於 7 天內持身分證件至取件門市領取，逾期將自動退回。',
        delivered: '感謝您的訂購！如商品有任何問題，歡迎透過 LINE 聯繫客服。',
    };
    const tip = tipByKey[milestone.key] || '';

    const storeBlock = (milestone.key === 'arrived' && data.storeName)
        ? '<div style="background:#fff7ed;border:1px solid #fed7aa;padding:15px;border-radius:5px;margin-top:20px;">'
          + '<h4 style="margin:0 0 10px;color:#c2410c;">🏪 取件門市</h4>'
          + '<p style="margin:5px 0;font-size:14px;"><b>' + data.storeName + '</b></p>'
          + (data.storeAddress ? '<p style="margin:5px 0;font-size:13px;color:#7c2d12;">' + data.storeAddress + '</p>' : '')
          + (data.paymentNo ? '<p style="margin:5px 0;font-size:13px;color:#7c2d12;">取件代碼：<span style="font-family:monospace;font-weight:bold;">' + data.paymentNo + '</span></p>' : '')
          + '</div>'
        : '';

    const body = ''
        + '<!DOCTYPE html><html><head><style>'
        + '.btn{display:inline-block;background:#EA580C;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;font-weight:bold;}'
        + '.container{max-width:600px;margin:0 auto;font-family:sans-serif;border:1px solid #eee;border-radius:8px;overflow:hidden;}'
        + '.header{background:#EA580C;color:white;padding:20px;text-align:center;}'
        + '.content{padding:20px;line-height:1.6;}'
        + '.footer{background:#f9f9f9;padding:20px;text-align:center;font-size:12px;color:#999;}'
        + '.info-box{background:#fff7ed;border:1px solid #fed7aa;padding:15px;border-radius:5px;margin-top:20px;}'
        + '</style></head>'
        + '<body style="margin:0;padding:20px;background:#f5f5f5;">'
        + '<div class="container" style="background:white;">'
        + '<div class="header">'
        + '<h1 style="margin:0;font-size:20px;">' + milestone.emoji + ' ' + milestone.label + '</h1>'
        + '<p style="margin:5px 0 0;opacity:0.9;">' + data.orderId + '</p>'
        + '</div>'
        + '<div class="content">'
        + '<p>親愛的 ' + (data.customer && data.customer.name ? data.customer.name : '客戶') + ' 您好，</p>'
        + '<p>您的訂單物流狀態已更新為 <strong>' + milestone.label + '</strong>。' + tip + '</p>'
        + '<div class="info-box">'
        + '<p style="margin:5px 0;font-size:14px;">物流方式：<b>' + milestone.brand + '</b></p>'
        + '<p style="margin:5px 0;font-size:14px;">託運編號：<b style="font-family:monospace;">' + (data.shipmentNo || data.logisticsId || '-') + '</b></p>'
        + '<p style="margin:5px 0;font-size:14px;">最新狀態：<b>' + (data.rtnMsg || milestone.label) + '</b></p>'
        + '</div>'
        + storeBlock
        + '<div style="text-align:center;margin-top:30px;">'
        + '<a href="' + trackingUrl + '" class="btn" style="color:white !important;">📦 查看物流追蹤頁</a>'
        + '</div>'
        + '<p style="margin-top:30px;font-size:13px;color:#888;">如有任何問題，歡迎 <a href="https://line.me/R/ti/p/@bcs_official">LINE 聯繫客服</a>。</p>'
        + '</div>'
        + '<div class="footer"><p>此信件為系統自動發送</p><p>比創空間 販創所</p></div>'
        + '</div></body></html>';

    MailApp.sendEmail({
        to: data.customer.email,
        subject: subject,
        htmlBody: body,
    });
}

function testLine() {
    var scriptProps = PropertiesService.getScriptProperties();
    var token = scriptProps.getProperty('LINE_CHANNEL_ACCESS_TOKEN');
    var userId = scriptProps.getProperty('LINE_USER_ID');

    if (!token || !userId) {
        Logger.log("❌ 錯誤：找不到 TOKEN 或 USER_ID！請檢查「專案設定 > 指令碼屬性」。");
        return;
    }

    Logger.log("✅ 準備發送...");
    try {
        sendLineMessagingApi(token, userId, [{ type: 'text', text: "🔔 測試成功！這是來自 GAS (Messaging API) 的測試訊息。" }]);
        Logger.log("✅ 訊息發送指令已執行，請檢查手機。");
    } catch (e) {
        Logger.log("❌ 發送失敗：" + e.toString());
    }
}
