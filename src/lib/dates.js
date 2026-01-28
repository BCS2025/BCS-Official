/**
 * Calculate expected processing working days based on quantity
 * @param {number} quantity - Total items count
 * @returns {number} - Number of working days
 */
export function getProcessingWorkingDays(quantity) {
    if (quantity < 25) {
        return 3;
    }
    const baseDays = 5;
    const additionalChunk = Math.floor((quantity - 25) / 25);
    return baseDays + (additionalChunk * 2);
}

/**
 * Add working days to a date, skipping weekends
 * @param {Date} startDate 
 * @param {number} days 
 * @returns {Date}
 */
export function addWorkingDays(startDate, days) {
    let result = new Date(startDate);
    let count = 0;

    while (count < days) {
        result.setDate(result.getDate() + 1);
        const dayOfWeek = result.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
    }
    return result;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
