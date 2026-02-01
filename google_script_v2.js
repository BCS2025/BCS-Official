/* 
  BCS Order Manager & Notifier (Google Apps Script) - V4 (Ultimate)
  
  FEATURES:
  - Supports LINE Messaging API (Flex Messages with Customer Info)
  - Beautiful HTML Email Template with Correct Link
  - Robust Low Stock Alerting support
  
  SETUP:
  1. Script Properties: LINE_CHANNEL_ACCESS_TOKEN, LINE_USER_ID, ADMIN_EMAIL
*/

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

        // --- CASE 2: NEW ORDER ---
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
            if (key.endsWith('_filename')) return;
            details.push(item[key]);
        });
        const detailText = details.join(' / ');

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
                detailText ? { type: "text", text: detailText, size: "xs", color: "#aaaaaa", wrap: true, margin: "xs" } : null
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
            if (key.endsWith('_filename')) return;
            details.push(`${key}: ${item[key]}`);
        });

        return `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 0;">
          <div style="font-weight: bold; color: #333;">${item.productName || item.productId}</div>
          <div style="font-size: 12px; color: #888;">${details.join(' | ')}</div>
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
