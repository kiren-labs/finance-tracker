/**
 * Export Feature
 * CSV export functionality
 */

import * as store from '../core/store.js';
import { showMessage } from '../ui/components.js';
import { getCurrency } from '../utils/formatters.js';

/**
 * Export transactions to CSV
 */
export function exportToCSV() {
    const transactions = store.get('transactions');

    if (transactions.length === 0) {
        showMessage('No transactions to export!');
        return;
    }

    const currencyCode = getCurrency();
    const headers = ['Date', 'Type', 'Category', `Amount (${currencyCode})`, 'Notes'];
    const rows = transactions.map(t => [
        t.date,
        t.type,
        t.category,
        t.amount,
        t.notes || ''
    ]);

    // Build CSV content
    let csv = headers.join(',') + '\n';
    csv += rows.map(row => row.map(cell =>
        `"${String(cell).replace(/"/g, '""')}"`
    ).join(',')).join('\n');

    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finchronicle-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showMessage('Export successful!');
}
