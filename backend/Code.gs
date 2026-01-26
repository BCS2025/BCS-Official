/**
 * Custom Product Order System Backend
 * -----------------------------------
 * Handle POST requests from the React App and save to Google Sheets.
 */

// CONFIGURATION
const SHEET_NAME = 'Orders'; // Ensure your sheet has this name

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Wait up to 10s for other processes

  try {
    const sheet = getSheet();
    
    // Parse the incoming JSON data
    // e.postData.contents is the raw JSON string
    const data = JSON.parse(e.postData.contents);
    
    const timestamp = new Date();
    const orderId = generateOrderId();
    
    // Format the items list into a readable string
    // Format: "[Qty] Product - Front: X / Back: Y (Siding/Font)"
    const itemsSummary = data.items.map(item => {
      const details = [
        item.siding === 'double' ? '雙面' : '單面',
        item.shape,
        item.font
      ].join(', ');
      
      let text = `正面: ${item.textFront}`;
      if (item.textBack) text += ` / 背面: ${item.textBack}`;
      
      return `[x${item.quantity}] ${item.productName} (${details})\n   ${text} ($${item.price})`;
    }).join('\n\n');

    // Prepare row data
    // Columns: Timestamp, Order ID, Name, Phone, Email, Address, Total, Items Detail, Status
    const row = [
      timestamp,
      orderId,
      data.customer.name,
      "'"+data.customer.phone, // Force string for phone
      data.customer.email,
      data.customer.address,
      data.totalAmount,
      itemsSummary,
      'New'
    ];

    // Append to sheet
    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'orderId': orderId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Add headers if new
    sheet.appendRow(['Timestamp', 'Order ID', 'Name', 'Phone', 'Email', 'Address', 'Total Amount', 'Items Detail', 'Status']);
  }
  return sheet;
}

// GET method for browser verification
function doGet(e) {
  return ContentService.createTextOutput("Custom Order System Backend is Running!")
    .setMimeType(ContentService.MimeType.TEXT);
}

function generateOrderId() {
  return 'ORD-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
}

// OPTIONS method handling for CORS Pre-flight checks (though pure POST no-cors usually skips this, good to have)
// OPTIONS method handling (Google handles CORS mostly automatically, this is just a fallback)
function doOptions(e) {
  return ContentService.createTextOutput('');
}
