/**
 * Currency Feature
 * Currency selection and formatting
 */

import { CURRENCIES, DEFAULT_CURRENCY } from '../data/constants.js';
import { loadString, saveString } from '../data/storage.js';
import * as store from '../core/store.js';
import { updateUI } from '../ui/renderer.js';
import { showMessage, currencyOption } from '../ui/components.js';
import { getCurrency } from '../utils/formatters.js';

/**
 * Initialize currency on app load
 */
export function initCurrency() {
    const savedCurrency = loadString('currency');
    const currency = savedCurrency && CURRENCIES[savedCurrency] ? savedCurrency : DEFAULT_CURRENCY;
    store.set('currency', currency);
    updateCurrencyDisplay();
}

/**
 * Update currency display in UI
 */
export function updateCurrencyDisplay() {
    const code = getCurrency();
    const currency = CURRENCIES[code];

    const symbolEl = document.getElementById('currencySymbol');
    const codeEl = document.getElementById('currencyCode');
    const labelEl = document.querySelector('label[for="amount"]');

    if (symbolEl) symbolEl.textContent = currency.symbol;
    if (codeEl) codeEl.textContent = code;
    if (labelEl) labelEl.textContent = `Amount (${currency.symbol})`;
}

/**
 * Toggle currency selector modal
 */
export function toggleCurrencySelector() {
    const modal = document.getElementById('currencyModal');
    const list = document.getElementById('currencyList');
    const currentCode = getCurrency();

    if (!modal || !list) return;

    // Populate currency list
    list.innerHTML = Object.entries(CURRENCIES)
        .map(([code, curr]) => currencyOption(code, curr, code === currentCode))
        .join('');

    modal.style.display = 'flex';
}

/**
 * Close currency selector modal
 */
export function closeCurrencySelector() {
    const modal = document.getElementById('currencyModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Select a currency
 * @param {string} code - Currency code (e.g., 'USD', 'INR')
 */
export function selectCurrency(code) {
    if (!CURRENCIES[code]) {
        console.error(`Invalid currency code: ${code}`);
        return;
    }

    saveString('currency', code);
    store.set('currency', code);
    updateCurrencyDisplay();
    updateUI();
    closeCurrencySelector();
    showMessage(`Currency changed to ${CURRENCIES[code].name}`);
}
