function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName('Orders') || doc.insertSheet('Orders');
    
    // Parse Incoming Data
    const rawData = JSON.parse(e.postData.contents);
    
    // Prepare Header Row if needed
    // Updated Headers: Added '訂單編號', '是否對稿'
    const headers = [
      '訂單編號', '訂單時間', '訂購人', '電話', 'Email', 
      '運送方式', '運送詳情', '運費', '總金額',
      '商品明細', '對稿需求'
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
    
    // Handle needProof (Default to 'yes' if missing)
    const needProofText = (customer.needProof === 'no') ? '不需對稿 (直接製作)' : '需要對稿';

    const rowData = [
      rawData.orderId || 'N/A', // New Order ID
      rawData.timestamp,
      customer.name,
      "'"+customer.phone, // Force string for phone
      customer.email,
      getShippingMethodName(customer.shippingMethod),
      shippingDetail,
      customer.shippingCost,
      rawData.totalAmount,
      itemsDescription,
      needProofText // New Column
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
  const token = scriptProperties.getProperty('LINE_CHANNEL_ACCESS_TOKEN');
  const userId = scriptProperties.getProperty('LINE_USER_ID'); 

  if (!token || !userId) return;

  // rowData mapping: 
  // 0:ID, 1:Time, 2:Name, 3:Phone, 4:Email, 5:Method, 6:Detail, 7:Cost, 8:Total, 9:Items, 10:Proof
  
  const messageText = `
📦 新訂單: ${rowData[0]}
----------
👤 姓名: ${rowData[2]}
📞 電話: ${rowData[3]}
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
      "headers": {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      "payload": JSON.stringify(payload)
    });
  } catch (e) {
    // Silent fail
  }
}
