/* 
  BCS Order Manager & Notifier (Google Apps Script)
  
  DEPLOYMENT INSTRUCTIONS:
  1. Go to https://script.google.com/
  2. Paste this code into Code.gs
  3. Set Script Properties (Project Settings > Script Properties):
     - LINE_TOKEN: Your Line Notify Token
     - ADMIN_EMAIL: Your Email (e.g., admin@bcs.tw)
  4. Deploy as Web App -> "Who has access": "Anyone"
*/

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const scriptProps = PropertiesService.getScriptProperties();
        const LINE_TOKEN = scriptProps.getProperty('LINE_TOKEN');
        const ADMIN_EMAIL = scriptProps.getProperty('ADMIN_EMAIL') || 'roylo@example.com'; // Change to default if not set

        // --- CASE 1: SYSTEM ALERT (Low Stock) ---
        if (data.type === 'system_alert') {
            sendLineNotify(LINE_TOKEN, data.message);
            return ContentService.createTextOutput(JSON.stringify({ status: 'success', type: 'alert' }));
        }

        // --- CASE 2: NEW ORDER ---
        // 1. Send Email to Customer
        if (data.customer && data.customer.email) {
            sendCustomerEmail(data);
        }

        // 2. Send Line Notify to Admin
        const lineMsg = formatLineMessage(data);
        sendLineNotify(LINE_TOKEN, lineMsg);

        return ContentService.createTextOutput(JSON.stringify({ status: 'success', id: data.orderId }));

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }));
    }
}

// --- HELPER: Send Line Notify ---
function sendLineNotify(token, message) {
    if (!token) return;

    UrlFetchApp.fetch('https://notify-api.line.me/api/notify', {
        'method': 'post',
        'headers': {
            'Authorization': 'Bearer ' + token
        },
        'payload': {
            'message': message
        }
    });
}

// --- HELPER: Format Order for Line ---
function formatLineMessage(order) {
    let msg = `\n📦 新訂單通知 (${order.orderId})\n`;
    msg += `----------------\n`;
    msg += `姓名: ${order.customer.name}\n`;
    msg += `金額: $${order.totalAmount}\n`;
    msg += `付款: 尚未付款 (請確認)\n`;
    msg += `----------------\n`;

    order.items.forEach((item, idx) => {
        // Note: The Frontend now sends "productName" (Chinese) and translated labels!
        msg += `${idx + 1}. ${item.productName || item.productId} x ${item.quantity}\n`;

        // Append options if any (Skip internal keys)
        Object.keys(item).forEach(key => {
            // Skip known non-option keys
            if (['productId', 'productName', '_id', 'price', 'quantity', 'image'].includes(key)) return;
            if (key.endsWith('_filename')) return;

            msg += `   - ${key}: ${item[key]}\n`;
        });
    });

    return msg;
}

// --- HELPER: Send Customer Email ---
function sendCustomerEmail(order) {
    const subject = `【Be Creative Space】訂單確認通知 (${order.orderId})`;

    // Convert items to HTML list
    let itemsHtml = '<ul>';
    order.items.forEach(item => {
        let optionsHtml = '';
        Object.keys(item).forEach(key => {
            if (['productId', 'productName', '_id', 'price', 'quantity', 'image'].includes(key)) return;
            if (key.endsWith('_filename')) return;
            // Convert camelCase to Readable if needed, or just show Value
            optionsHtml += `<span style="color:#666; font-size:12px; margin-left:5px;">[${item[key]}]</span>`;
        });

        itemsHtml += `<li><b>${item.productName || item.productId}</b> x ${item.quantity} ${optionsHtml}</li>`;
    });
    itemsHtml += '</ul>';

    const body = `
    <h2>感謝您的訂購！</h2>
    <p>親愛的 ${order.customer.name} 您好，</p>
    <p>我們已收到您的訂單 <b>${order.orderId}</b>。</p>
    
    <h3>訂單內容：</h3>
    ${itemsHtml}
    
    <h3>總金額：$${order.totalAmount}</h3>
    
    <hr>
    <h3>接下來的步驟：</h3>
    <p><b>1. 請完成匯款</b></p>
    <p>銀行代碼：822 (中國信託)<br>帳號：123-456-7890</p>
    <p><b>2. 回傳證明</b></p>
    <p>匯款後請至官方 Line (@bcs_official) 告知末五碼。</p>
    
    <p style="color:#888; font-size:12px;">此郵件為系統自動發送，請勿直接回信。</p>
  `;

    MailApp.sendEmail({
        to: order.customer.email,
        subject: subject,
        htmlBody: body
    });
}
