/**
 * UI Renderer
 * Main UI rendering logic for all views
 */

import * as store from '../core/store.js';
import * as transaction from '../data/transaction.js';
import { formatCurrency } from '../utils/formatters.js';
import * as components from './components.js';

/**
 * Update all UI components
 */
export function updateUI() {
    updateSummary();
    updateTransactionsList();
    updateMonthFilters();
    updateCategoryFilter();
    updateGroupedView();
}

/**
 * Update summary cards
 */
export function updateSummary() {
    const summary = transaction.getMonthSummary();

    const monthNetEl = document.getElementById('monthNet');
    const totalEntriesEl = document.getElementById('totalEntries');
    const monthIncomeEl = document.getElementById('monthIncome');
    const monthExpenseEl = document.getElementById('monthExpense');

    if (monthNetEl) {
        monthNetEl.textContent = formatCurrency(summary.net);
        monthNetEl.className = 'summary-value ' + (summary.net >= 0 ? 'positive' : 'negative');
    }

    if (totalEntriesEl) {
        totalEntriesEl.textContent = summary.totalEntries;
    }

    if (monthIncomeEl) {
        monthIncomeEl.textContent = formatCurrency(summary.income);
    }

    if (monthExpenseEl) {
        monthExpenseEl.textContent = formatCurrency(summary.expense);
    }
}

/**
 * Update transactions list
 */
export function updateTransactionsList() {
    const list = document.getElementById('transactionsList');
    if (!list) return;

    const transactions = store.get('transactions');
    const selectedMonth = store.get('selectedMonth');
    const selectedCategory = store.get('selectedCategory');

    let filtered = transactions;

    if (selectedMonth !== 'all') {
        filtered = filtered.filter(t => t.date.startsWith(selectedMonth));
    }

    if (selectedCategory !== 'all') {
        filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (filtered.length === 0) {
        list.innerHTML = components.emptyState('ri-file-list-3-line', 'No transactions yet');
        return;
    }

    list.innerHTML = filtered.map(t => components.transactionItem(t)).join('');
}

/**
 * Update month filters
 */
export function updateMonthFilters() {
    const filters = document.getElementById('monthFilters');
    if (!filters) return;

    const months = transaction.getMonths();
    const selectedMonth = store.get('selectedMonth');

    filters.innerHTML = `
        ${components.filterButton('All', 'all', selectedMonth === 'all', 'filter-month')}
        ${months.map(month => components.monthFilterButton(month, selectedMonth === month)).join('')}
    `;
}

/**
 * Update category filter dropdown
 */
export function updateCategoryFilter() {
    const filter = document.getElementById('categoryFilter');
    if (!filter) return;

    const categories = transaction.getCategories();
    const selectedCategory = store.get('selectedCategory');

    filter.innerHTML = `
        <option value="all">All Categories</option>
        ${categories.map(cat => components.categoryOption(cat, selectedCategory === cat)).join('')}
    `;
}

/**
 * Update grouped view (by month or category)
 */
export function updateGroupedView() {
    const content = document.getElementById('groupedContent');
    if (!content) return;

    const transactions = store.get('transactions');

    if (transactions.length === 0) {
        content.innerHTML = `
            <div class="card">
                ${components.emptyState('ri-bar-chart-box-line', 'No data to group yet')}
            </div>
        `;
        return;
    }

    const currentGrouping = store.get('currentGrouping');

    if (currentGrouping === 'month') {
        content.innerHTML = renderMonthGroups();
    } else {
        content.innerHTML = renderCategoryGroups();
    }
}

/**
 * Render month groups
 * @returns {string} HTML for month groups
 */
function renderMonthGroups() {
    const grouped = transaction.groupByMonth();
    const months = Object.keys(grouped).sort().reverse();

    return months.map(month => {
        return components.monthGroupCard(month, grouped[month]);
    }).join('');
}

/**
 * Render category groups
 * @returns {string} HTML for category groups
 */
function renderCategoryGroups() {
    const grouped = transaction.groupByCategory();
    const categories = Object.keys(grouped).sort((a, b) =>
        grouped[b].total - grouped[a].total
    );

    return categories.map(category => {
        return components.categoryGroupCard(category, grouped[category]);
    }).join('');
}
