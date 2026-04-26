function doGet(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    const action = e ? e.parameter.action : '';
    
    if (action === 'getInventory') {
      return getInventory();
    }
    
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: 'Invalid Action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: 'Server Busy' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName('Orders') || doc.insertSheet('Orders');
    
    // Parse Incoming Data
    const rawData = JSON.parse(e.postData.contents);
    
    // --- INVENTORY CHECK & DEDUCTION ---
    // Perform this BEFORE saving order
    const stockCheck = checkAndDeductStock(doc, rawData.items);
    if (!stockCheck.success) {
      return ContentService.createTextOutput(JSON.stringify({ 
        result: 'error', 
        error: `Inventory Error: ${stockCheck.message}` 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    // -----------------------------------

    // Prepare Header Row if needed
    const headers = [
      '訂單編號', '訂單時間', '訂購人', '電話', 'Email', 
      '運送方式', '運送詳情', '運費', '總金額',
      '商品明細', '對稿需求', '預計出貨/取貨日'
    ];
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }
    
    // Format Data for Sheet
    const customer = rawData.customer;
    const shippingDetail = getShippingDetail(customer);
    const itemsDescription = rawData.items.map(item => 
      `${item.productName} (${item.shape||'-'}/${item.font||'-'}) x${item.quantity}`
    ).join('\n');
    
    const needProofText =
      customer.needProof === 'yes' ? '需要對稿'
      : customer.needProof === 'no' ? '不需對稿（客戶選擇直接製作）'
      : '不適用（訂單無對稿商品）';

    const rowData = [
      rawData.orderId || 'N/A',
      rawData.timestamp,
      customer.name,
      "'"+customer.phone,
      customer.email,
      getShippingMethodName(customer.shippingMethod),
      shippingDetail,
      customer.shippingCost,
      rawData.totalAmount,
      itemsDescription,
      needProofText,
      rawData.estimatedDate || 'N/A'
    ];

    sheet.appendRow(rowData);

    // 1. LINE Notification (To Admin)
    sendLinePushMessage(rowData);

    // 2. Email Notification (To Customer)
    if (customer.email) {
      // Calculate Total Quantity
      const totalQuantity = rawData.items.reduce((sum, item) => sum + Number(item.quantity), 0);
      
      // Calculate Estimated Ship Date
      const processingDays = getProcessingWorkingDays(totalQuantity);
      const estimatedShipDateObj = addWorkingDays(new Date(), processingDays);
      const estimatedShipDateStr = formatDate(estimatedShipDateObj);

      sendOrderConfirmationEmail(customer.email, rowData, rawData.items, estimatedShipDateStr, processingDays);
    }

    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'row': sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- Inventory Logic ---
function getInventory() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = doc.getSheetByName('Inventory');
  
  // Initialize if missing
  if (!sheet) {
    sheet = doc.insertSheet('Inventory');
    sheet.appendRow(['SKU', 'Stock', 'ProductName']);
    // Seed sample data for testing?
    // Let's seed just one row so user sees it.
    sheet.appendRow(['wooden-keychain-style1', 100, '鑰匙圈-圓形']);
  }
  
  const data = sheet.getDataRange().getValues();
  const inventory = {};
  
  // Skip header
  for (let i = 1; i < data.length; i++) {
    const sku = data[i][0];
    const stock = data[i][1];
    if (sku) {
      inventory[sku] = stock;
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ result: 'success', inventory: inventory }))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkAndDeductStock(doc, items) {
  let sheet = doc.getSheetByName('Inventory');
  if (!sheet) return { success: true }; // No inventory sheet = No Check logic (or fail? User wants control. Let's pass to avoid blocking if setup incomplete)
  
  const data = sheet.getDataRange().getValues();
  // Map SKU to Row Index (1-based) and Current Stock
  const stockMap = new Map(); // SKU -> { row: number, stock: number }
  
  for (let i = 1; i < data.length; i++) {
    const sku = String(data[i][0]);
    const stock = parseInt(data[i][1], 10);
    stockMap.set(sku, { row: i + 1, stock: isNaN(stock) ? 0 : stock });
  }
  
  // Check Steps
  const deductions = [];
  
  for (const item of items) {
    const sku = item.shape ? `${item.productId}-${item.shape}` : item.productId;
    
    // If SKU exists in inventory management, check it.
    // If NOT exists, we assume UNLIMITED (or we can enforce strict check).
    // Let's enforce strict only if SKU exists in sheet.
    
    if (stockMap.has(sku)) {
      const current = stockMap.get(sku);
      if (current.stock < item.quantity) {
        return { success: false, message: `${item.productName} 庫存不足 (剩餘: ${current.stock})` };
      }
      deductions.push({ row: current.row, newStock: current.stock - item.quantity });
      
      // Update local map to handle multiple items of same SKU in one order (corner case)
      current.stock -= item.quantity; 
    }
  }
  
  // Execution Steps (Deduct)
  for (const act of deductions) {
    sheet.getRange(act.row, 2).setValue(act.newStock);
  }
  
  return { success: true };
}

// --- Email Notification ---
function sendOrderConfirmationEmail(email, rowData, items, estimatedShipDateStr, processingDays) {
  const orderId = rowData[0];
  const totalAmount = rowData[8];
  const estimatedDate = rowData[11]; // Get date
  
  // HTML Email Template
  const subject = `【比創空間】訂單確認通知 (${orderId})`;
  
  let htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #5d4037; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">訂單確認通知</h2>
      </div>
      <div style="padding: 20px;">
        <p>親愛的 ${rowData[2]} 您好，</p>
        <p>感謝您的訂購！我們已收到您的訂單。</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #5d4037;">訂單資訊</h3>
          <p><strong>訂單編號：</strong>${orderId}</p>
          <p><strong>預計出貨/取貨日：</strong>${estimatedDate}</p>
          <p><strong>對稿需求：</strong>${rowData[10]}</p>
          <div style="background-color: #fff3e0; padding: 10px; border-radius: 5px; margin: 10px 0; border: 1px solid #ffe0b2;">
             <p style="margin: 0; color: #e65100;"><strong>📅 預計出貨日期：${estimatedShipDateStr}</strong></p>
             <p style="margin: 5px 0 0 0; font-size: 12px; color: #f57c00;">(收到款項後約 ${processingDays} 個工作天)</p>
          </div>
          <p><strong>總金額：</strong>$${totalAmount}</p>
        </div>

        <h3 style="color: #5d4037; border-bottom: 2px solid #5d4037; padding-bottom: 5px;">商品明細</h3>
        <ul style="padding-left: 20px;">
          ${items.map(item => `
            <li style="margin-bottom: 10px;">
              <strong>${item.productName}</strong><br/>
              規格：${item.shape || '-'} / ${item.font || '-'}<br/>
              數量：${item.quantity}
            </li>
          `).join('')}
        </ul>

        <div style="border: 2px dashed #8d6e63; padding: 15px; border-radius: 5px; margin-top: 25px;">
          <h3 style="margin-top: 0; color: #5d4037; text-align: center;">💰 匯款資訊</h3>
          <p>為了確保您的客製化權益，<strong>請優先完成匯款</strong>，我們確認款項後將立即開始排版設計/製作。</p>
          <p style="font-size: 16px;">
            銀行代碼：<strong>700 (中華郵政)</strong><br/>
            銀行帳號：<strong>0031421-0318644</strong><br/>
            戶名：<strong>黃詣</strong>
          </p>
          <p style="color: #d32f2f; font-size: 14px;">※ 匯款完成後，請務必透過 LINE 告知您的「訂單編號」與「帳號後五碼」。</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p>如有任何問題，歡迎隨時聯繫我們！</p>
          <a href="https://lin.ee/ax9WURy" style="background-color: #00c300; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">加入官方 LINE</a>
        </div>
      </div>
      <div style="background-color: #eeeeee; padding: 10px; text-align: center; font-size: 12px; color: #757575;">
        © 2026 比創空間設計工作室
      </div>
    </div>
  `;

  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
  } catch (e) {
    console.log("Error sending email: " + e);
  }
}

// --- Helpers & LINE Logic (Keep Existing) ---
function getShippingMethodName(method) {
  const map = {
    'store': '超商店到店',
    'post': '郵局掛號',
    'pickup': '自取',
    'friend': '親友代領'
  };
  return map[method] || method;
}

function getShippingDetail(c) {
  switch(c.shippingMethod) {
    case 'store': return c.storeName;
    case 'post': return c.address;
    case 'pickup': return `${c.pickupLocation} (${c.pickupDate} ${c.pickupTime})`;
    case 'friend': return `代領人: ${c.friendName}`;
    default: return c.address;
  }
}

function sendLinePushMessage(rowData) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const token = scriptProperties.getProperty('LINE_CHANNEL_ACCESS_TOKEN');
  const userId = scriptProperties.getProperty('LINE_USER_ID'); 

  if (!token || !userId) return;
  
  const messageText = `
📦 新訂單: ${rowData[0]}
----------
👤 姓名: ${rowData[2]}
📞 電話: ${rowData[3]}
📧 Email: ${rowData[4]}
🎨 對稿: ${rowData[10]}
🚚 方式: ${rowData[5]}
💰 總額: $${rowData[8]}
----------
📝 商品:
${rowData[9]}`.trim();

  const url = "https://api.line.me/v2/bot/message/push";
  const payload = {
    "to": userId,
    "messages": [{ "type": "text", "text": messageText }]
  };

  try {
    UrlFetchApp.fetch(url, {
      "method": "post",
      "headers": { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
      "payload": JSON.stringify(payload)
    });
  } catch (e) { console.log(e); }
}

// --- Date Helpers ---
function getProcessingWorkingDays(quantity) {
    if (quantity < 25) {
        return 3;
    }
    const baseDays = 5;
    const additionalChunk = Math.floor((quantity - 25) / 25);
    return baseDays + (additionalChunk * 2);
}

function addWorkingDays(startDate, days) {
    var result = new Date(startDate);
    var count = 0;
    
    while (count < days) {
        result.setDate(result.getDate() + 1);
        var dayOfWeek = result.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
    }
    return result;
}

function formatDate(date) {
    var y = date.getFullYear();
    var m = ('0' + (date.getMonth() + 1)).slice(-2);
    var d = ('0' + date.getDate()).slice(-2);
    return y + '/' + m + '/' + d;
}


