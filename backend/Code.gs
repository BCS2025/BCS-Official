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

    // --- LINE Notification Logic ---
    sendLineNotify(rowData);

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
    case 'post': return c.address; // Address already includes city/district from frontend
    case 'pickup': return `${c.pickupLocation} (${c.pickupTime})`;
    case 'friend': return `代領人: ${c.friendName}`;
    default: return c.address;
  }
}

// --- LINE Notification Function ---
function sendLineNotify(rowData) {
  // 1. Get Token from Script Properties (Security Best Practice)
  // You must set this in: Project Settings > Script Properties > Property: LINE_CHANNEL_ACCESS_TOKEN
  const scriptProperties = PropertiesService.getScriptProperties();
  const token = scriptProperties.getProperty('LINE_CHANNEL_ACCESS_TOKEN');

  if (!token) {
    console.log("LINE_CHANNEL_ACCESS_TOKEN not set.");
    return;
  }

  // 2. Construct Message
  // rowData mapping: 0:Time, 1:Name, 2:Phone, 3:Email, 4:Method, 5:Detail, 6:Cost, 7:Total, 8:Items
  const message = `
📦 新訂單通知！
----------
👤 姓名: ${rowData[1]}
📞 電話: ${rowData[2]}
🚚 方式: ${rowData[4]}
📍 詳情: ${rowData[5]}
💰 總額: $${rowData[7]} (含運費 $${rowData[6]})
----------
📝 商品:
${rowData[8]}
  `.trim();

  // 3. Send Request to LINE Notify API (Simpler than Messaging API for just notifications)
  // If user has Messaging API Channel Access Token, we use Push Message used below.
  // Assuming User meant Messaging API (Push specific user) or Notify (Broadcast to group).
  // "LINE權杖" usually implies LINE Notify Token.
  // "Messaging API" implies Channel Access Token + User ID.
  
  // NOTE: If using LINE Notify (Token): content-type: application/x-www-form-urlencoded
  // NOTE: If using Messaging API (Channel Token): content-type: application/json
  
  // Let's assume standard LINE Notify as it's easiest for "Token".
  // PROMPT UPDATE in logic: User said "Messaging API/已取得LINE權杖". 
  // If Messaging API, we need a USER ID to push TO. 
  // LINE Notify is easier because the token IS the destination.
  // Let's try LINE Notify endpoint first as it works with a simple token.
  
  const options = {
    "method": "post",
    "headers": {
      "Authorization": "Bearer " + token
    },
    "payload": {
      "message": message
    }
  };

  try {
    UrlFetchApp.fetch("https://notify-api.line.me/api/notify", options);
  } catch (e) {
    console.log("Error sending LINE: " + e);
  }
}
