/**
 * UI Component Generators
 * Reusable functions for generating HTML components
 */

import { formatCurrency, formatDate, formatMonth } from '../utils/formatters.js';
import { CURRENCIES } from '../data/constants.js';

/**
 * Generate transaction item HTML
 * @param {Object} transaction - Transaction object
 * @returns {string} HTML string for transaction item
 */
export function transactionItem(transaction) {
    const isIncome = transaction.type === 'income';
    const icon = isIncome ? '<i class="ri-arrow-up-circle-fill"></i>' : '<i class="ri-arrow-down-circle-fill"></i>';
    const amountClass = isIncome ? 'positive' : 'negative';
    const sign = isIncome ? '+' : '-';

    return `
        <div class="transaction-item">
            <div class="transaction-icon ${transaction.type}">
                ${icon}
            </div>
            <div class="transaction-details">
                <div class="transaction-category">${transaction.category}</div>
                ${transaction.notes ? `<div class="transaction-note">${transaction.notes}</div>` : ''}
                <div class="transaction-date">${formatDate(transaction.date)}</div>
            </div>
            <div class="transaction-amount ${amountClass}">
                ${sign}${formatCurrency(transaction.amount)}
            </div>
            <div class="transaction-actions">
                <button class="action-btn edit-btn" data-action="edit-transaction" data-params='{"id":${transaction.id}}'><i class="ri-edit-line"></i></button>
                <button class="action-btn delete-btn" data-action="delete-transaction" data-params='{"id":${transaction.id}}'><i class="ri-delete-bin-line"></i></button>
            </div>
        </div>
    `;
}

/**
 * Generate empty state HTML
 * @param {string} icon - Remix icon class name
 * @param {string} message - Message to display
 * @returns {string} HTML string for empty state
 */
export function emptyState(icon, message) {
    return `
        <div class="empty-state">
            <div class="empty-state-icon"><i class="${icon}"></i></div>
            <div>${message}</div>
        </div>
    `;
}

/**
 * Generate filter button HTML
 * @param {string} label - Button label
 * @param {string} value - Button value
 * @param {boolean} active - Whether button is active
 * @param {string} action - Data action attribute
 * @returns {string} HTML string for filter button
 */
export function filterButton(label, value, active, action) {
    return `
        <button class="filter-btn ${active ? 'active' : ''}"
                data-action="${action}"
                data-params='{"value":"${value}"}'>${label}</button>
    `;
}

/**
 * Generate month filter button HTML
 * @param {string} month - Month in YYYY-MM format
 * @param {boolean} active - Whether button is active
 * @returns {string} HTML string for month filter button
 */
export function monthFilterButton(month, active) {
    return `
        <button class="filter-btn ${active ? 'active' : ''}"
                data-action="filter-month"
                data-params='{"month":"${month}"}'>${formatMonth(month)}</button>
    `;
}

/**
 * Generate currency option HTML
 * @param {string} code - Currency code (e.g., 'USD')
 * @param {Object} currency - Currency object with symbol and name
 * @param {boolean} active - Whether this currency is selected
 * @returns {string} HTML string for currency option
 */
export function currencyOption(code, currency, active) {
    return `
        <div class="currency-item ${active ? 'active' : ''}" data-action="select-currency" data-params='{"code":"${code}"}'>
            <div class="currency-info">
                <div class="currency-symbol">${currency.symbol}</div>
                <div class="currency-details">
                    <div class="currency-code">${code}</div>
                    <div class="currency-name">${currency.name}</div>
                </div>
            </div>
            <div class="currency-check"><i class="ri-check-line"></i></div>
        </div>
    `;
}

/**
 * Generate month group card HTML
 * @param {string} month - Month in YYYY-MM format
 * @param {Object} data - Group data with income, expense, count
 * @returns {string} HTML string for month group card
 */
export function monthGroupCard(month, data) {
    const net = data.income - data.expense;
    const netClass = net >= 0 ? 'positive' : 'negative';

    return `
        <div class="card">
            <div class="group-header">
                ${formatMonth(month)}
                <span class="group-total">${data.count} entries</span>
            </div>
            <div style="padding: 12px 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6e6e73;">Income</span>
                    <span class="positive">${formatCurrency(data.income)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6e6e73;">Expenses</span>
                    <span class="negative">${formatCurrency(data.expense)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #f5f5f7;">
                    <span style="font-weight: 600;">Net</span>
                    <span class="${netClass}" style="font-weight: 600;">${formatCurrency(net)}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate category group card HTML
 * @param {string} category - Category name
 * @param {Object} data - Group data with total, count, type
 * @returns {string} HTML string for category group card
 */
export function categoryGroupCard(category, data) {
    const colorClass = data.type === 'income' ? 'positive' : 'negative';

    return `
        <div class="card">
            <div class="group-header">
                ${category}
                <span class="group-total">${data.count} entries</span>
            </div>
            <div style="padding: 12px 16px;">
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6e6e73;">Total</span>
                    <span class="${colorClass}" style="font-weight: 600; font-size: 20px;">
                        ${formatCurrency(data.total)}
                    </span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate category option HTML
 * @param {string} category - Category name
 * @param {boolean} selected - Whether this category is selected
 * @returns {string} HTML string for category option
 */
export function categoryOption(category, selected = false) {
    return `<option value="${category}" ${selected ? 'selected' : ''}>${category}</option>`;
}

/**
 * Show a temporary message to the user
 * @param {string} text - Message text to display
 */
export function showMessage(text) {
    const msg = document.getElementById('successMessage');
    if (msg) {
        msg.textContent = text;
        msg.classList.add('show');
        setTimeout(() => msg.classList.remove('show'), 2000);
    }
}
