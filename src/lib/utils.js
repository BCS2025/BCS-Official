export const calculateLeadDays = (quantity) => {
    const qty = quantity || 0;
    if (qty > 50) return 21;
    if (qty > 25) return 14;
    if (qty > 10) return 10;
    if (qty > 5) return 5;
    return 3;
};

export const getEstimatedShipDate = (leadDays) => {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + leadDays);
    return targetDate.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};
