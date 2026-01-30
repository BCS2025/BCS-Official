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

/**
 * Calculates price based on Generic Variant Logic
 * @param {number} basePrice - The starting price of the product
 * @param {object} config - The form data (selected options)
 * @param {number} quantity - Number of items
 * @param {object} pricingLogic - The rules defined in DB (dbProduct.pricing_logic)
 */
export function calculateVariantPrice(basePrice, config, quantity, pricingLogic) {
    const qty = parseInt(quantity || 0, 10);
    if (qty <= 0) return 0;

    let unitPrice = basePrice;

    // logic: { modifiers: { size: { '14': 200 }, movement: { 'radio': 300 } } }
    const modifiers = pricingLogic?.modifiers || {};

    for (const [key, rules] of Object.entries(modifiers)) {
        const selectedValue = config[key];    // e.g. "14"
        const addOn = rules[selectedValue];   // e.g. 200

        if (typeof addOn === 'number') {
            unitPrice += addOn;
        }
    }

    return unitPrice * qty;
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
    }).format(amount);
}
