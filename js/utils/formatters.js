/**
 * Formatting Utilities
 * Functions for formatting currencies, dates, and numbers
 */

import { CURRENCIES, DEFAULT_CURRENCY } from '../data/constants.js';
import { loadString } from '../data/storage.js';

/**
 * Get current currency code
 * @returns {string} Currency code (e.g., 'INR', 'USD')
 */
export function getCurrency() {
    const saved = loadString('currency');
    return saved && CURRENCIES[saved] ? saved : DEFAULT_CURRENCY;
}

/**
 * Get currency symbol for current currency
 * @returns {string} Currency symbol (e.g., '₹', '$')
 */
export function getCurrencySymbol() {
    const code = getCurrency();
    return CURRENCIES[code].symbol;
}

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @returns {string} Formatted number (e.g., '1,000')
 */
export function formatNumber(num) {
    return Math.abs(num).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format amount as currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency (e.g., '₹1,000')
 */
export function formatCurrency(amount) {
    return `${getCurrencySymbol()}${formatNumber(amount)}`;
}

/**
 * Format date string to readable format
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date (e.g., '1 Jan 2024')
 */
export function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Format month string to readable format
 * @param {string} monthStr - Month string in YYYY-MM format
 * @returns {string} Formatted month (e.g., 'January 2024')
 */
export function formatMonth(monthStr) {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric'
    });
}
