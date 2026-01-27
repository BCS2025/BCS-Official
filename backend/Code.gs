function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName('Orders') || doc.insertSheet('Orders');
    
    // Parse Incoming Data
    const rawData = JSON.parse(e.postData.contents);
    
    // Prepare Header Row if needed
    const headers = [
      '訂單時間', '訂購人', '電話', 'Email', 
      '運送方式', '運送詳情', '運費', '總金額',
      '商品明細'
    ];
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }
    
    // Format Data for Sheet
    const customer = rawData.customer;
    const shippingDetail = getShippingDetail(customer);
    const itemsDescription = rawData.items.map(item => 
      `${item.productName} (${item.shape}/${item.font}) x${item.quantity}`
    ).join('\n');

    const rowData = [
      rawData.timestamp,
      customer.name,
      "'"+customer.phone, // Force string for phone
      customer.email,
      getShippingMethodName(customer.shippingMethod),
      shippingDetail,
      customer.shippingCost,
      rawData.totalAmount,
      itemsDescription
    ];

    sheet.appendRow(rowData);

    // --- LINE Notification Logic (Messaging API) ---
    sendLinePushMessage(rowData);

    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'row': sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': e }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Helper: Format Shipping Info
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
    case 'pickup': return `${c.pickupLocation} (${c.pickupTime})`;
    case 'friend': return `代領人: ${c.friendName}`;
    default: return c.address;
  }
}

// --- LINE Messaging API (Push Message) ---
function sendLinePushMessage(rowData) {
  const scriptProperties = PropertiesService.getScriptProperties();
  
  // 1. Get Token and User ID from Script Properties
  const token = scriptProperties.getProperty('LINE_CHANNEL_ACCESS_TOKEN');
  const userId = scriptProperties.getProperty('LINE_USER_ID'); 

  if (!token || !userId) {
    console.log("LINE credentials (Token or User ID) not set.");
    return;
  }

  // 2. Construct Message
  const messageText = `
📦 新訂單通知！
----------
👤 姓名: ${rowData[1]}
📞 電話: ${rowData[2]}
🚚 方式: ${rowData[4]}
📍 詳情: ${rowData[5]}
💰 總額: $${rowData[7]} (含運費 $${rowData[6]})
----------
📝 商品:
${rowData[8]}`.trim();

  // 3. Send Push Message Request
  const url = "https://api.line.me/v2/bot/message/push";
  
  const payload = {
    "to": userId,
    "messages": [
      {
        "type": "text",
        "text": messageText
      }
    ]
  };

  const options = {
    "method": "post",
    "headers": {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    },
    "payload": JSON.stringify(payload)
  };

  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    console.log("Error sending LINE Push Message: " + e);
  }
}
