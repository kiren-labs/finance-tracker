/**
 * Transaction Management
 * CRUD operations for transactions
 */

import { load, save } from './storage.js';
import * as store from '../core/store.js';

/**
 * Load transactions from storage
 * @returns {Array} Array of transactions
 */
export function loadTransactions() {
    const stored = load('transactions');
    if (stored && Array.isArray(stored)) {
        // Sort by date descending (newest first)
        stored.sort((a, b) => new Date(b.date) - new Date(a.date));
        store.set('transactions', stored);
        return stored;
    }
    return [];
}

/**
 * Save transactions to storage
 * @param {Array} transactions - Transactions array to save
 */
export function saveTransactions(transactions) {
    save('transactions', transactions);
    store.set('transactions', transactions);
}

/**
 * Add new transaction
 * @param {Object} transaction - Transaction object (without id)
 * @returns {Object} Created transaction with id
 */
export function addTransaction(transaction) {
    const transactions = store.get('transactions');
    const newTransaction = {
        ...transaction,
        id: Date.now(),
        createdAt: new Date().toISOString()
    };

    transactions.unshift(newTransaction);
    saveTransactions(transactions);

    return newTransaction;
}

/**
 * Update existing transaction
 * @param {number} id - Transaction id
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated transaction or null if not found
 */
export function updateTransaction(id, updates) {
    const transactions = store.get('transactions');
    const index = transactions.findIndex(t => t.id === id);

    if (index !== -1) {
        const existing = transactions[index];
        transactions[index] = {
            ...existing,
            ...updates,
            id: existing.id, // Preserve id
            createdAt: existing.createdAt // Preserve creation date
        };

        saveTransactions(transactions);
        return transactions[index];
    }

    return null;
}

/**
 * Delete transaction
 * @param {number} id - Transaction id to delete
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteTransaction(id) {
    const transactions = store.get('transactions');
    const filtered = transactions.filter(t => t.id !== id);

    if (filtered.length !== transactions.length) {
        saveTransactions(filtered);
        return true;
    }

    return false;
}

/**
 * Get transaction by id
 * @param {number} id - Transaction id
 * @returns {Object|null} Transaction or null if not found
 */
export function getTransaction(id) {
    const transactions = store.get('transactions');
    return transactions.find(t => t.id === id) || null;
}

/**
 * Filter transactions by month
 * @param {string} month - Month in YYYY-MM format or 'all'
 * @returns {Array} Filtered transactions
 */
export function filterByMonth(month) {
    const transactions = store.get('transactions');
    if (month === 'all') return transactions;
    return transactions.filter(t => t.date.startsWith(month));
}

/**
 * Filter transactions by category
 * @param {string} category - Category name or 'all'
 * @returns {Array} Filtered transactions
 */
export function filterByCategory(category) {
    const transactions = store.get('transactions');
    if (category === 'all') return transactions;
    return transactions.filter(t => t.category === category);
}

/**
 * Get summary for current month
 * @returns {Object} Summary with income, expense, net, and total entries
 */
export function getMonthSummary() {
    const transactions = store.get('transactions');
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTxs = transactions.filter(t => t.date.startsWith(currentMonth));

    const income = monthTxs
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthTxs
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    return {
        income,
        expense,
        net: income - expense,
        totalEntries: transactions.length
    };
}

/**
 * Get all unique months from transactions
 * @returns {Array} Sorted array of month strings (YYYY-MM)
 */
export function getMonths() {
    const transactions = store.get('transactions');
    const months = [...new Set(transactions.map(t => t.date.slice(0, 7)))];
    return months.sort().reverse();
}

/**
 * Get all unique categories from transactions
 * @returns {Array} Sorted array of category names
 */
export function getCategories() {
    const transactions = store.get('transactions');
    const categories = [...new Set(transactions.map(t => t.category))];
    return categories.sort();
}

/**
 * Group transactions by month
 * @returns {Object} Grouped data by month
 */
export function groupByMonth() {
    const transactions = store.get('transactions');
    const grouped = {};

    transactions.forEach(t => {
        const month = t.date.slice(0, 7);
        if (!grouped[month]) {
            grouped[month] = { income: 0, expense: 0, count: 0 };
        }
        grouped[month].count++;
        if (t.type === 'income') {
            grouped[month].income += t.amount;
        } else {
            grouped[month].expense += t.amount;
        }
    });

    return grouped;
}

/**
 * Group transactions by category
 * @returns {Object} Grouped data by category
 */
export function groupByCategory() {
    const transactions = store.get('transactions');
    const grouped = {};

    transactions.forEach(t => {
        if (!grouped[t.category]) {
            grouped[t.category] = { total: 0, count: 0, type: t.type };
        }
        grouped[t.category].total += t.amount;
        grouped[t.category].count++;
    });

    return grouped;
}
