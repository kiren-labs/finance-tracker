/**
 * Validation Utilities
 * Functions for input validation
 */

/**
 * Validate transaction amount
 * @param {number} amount - Amount to validate
 * @returns {boolean} True if valid
 */
export function isValidAmount(amount) {
    return typeof amount === 'number' && amount > 0 && isFinite(amount);
}

/**
 * Validate date string
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {boolean} True if valid
 */
export function isValidDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
}

/**
 * Validate category
 * @param {string} category - Category to validate
 * @param {Array<string>} validCategories - List of valid categories
 * @returns {boolean} True if valid
 */
export function isValidCategory(category, validCategories) {
    return validCategories.includes(category);
}

/**
 * Validate transaction type
 * @param {string} type - Type to validate ('income' or 'expense')
 * @returns {boolean} True if valid
 */
export function isValidType(type) {
    return type === 'income' || type === 'expense';
}
