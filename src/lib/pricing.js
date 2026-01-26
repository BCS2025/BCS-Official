/**
 * Calculates price for Wooden Keychain
 * Retail: Single $99, Double $150
 * Bulk (>=50 identical): Single $50, Double $70
 */
export function calculateKeychainPrice(config, quantity) {
    const isDouble = config.siding === 'double';
    const qty = parseInt(quantity || 0, 10);

    if (qty <= 0) return 0;

    // Base Prices
    const retailPrice = isDouble ? 150 : 99;
    const bulkPrice = isDouble ? 70 : 50;

    // NOTE: Bulk discount applies if Quantity >= 50 AND Content is identical.
    // Since 'config' represents a single line item with specific text, 
    // the quantity here refers to "number of THIS configuration".
    // So we just check qty >= 50.

    const unitPrice = qty >= 50 ? bulkPrice : retailPrice;

    return unitPrice * qty;
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
    }).format(amount);
}
