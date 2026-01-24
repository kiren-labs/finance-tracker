/**
 * FinChronicle - Main Application Entry Point
 * Modular ES6 architecture
 */

// Core
import * as store from './core/store.js';
import { initEventDelegation, on } from './core/events.js';

// Data
import { CATEGORIES } from './data/constants.js';
import * as transaction from './data/transaction.js';

// UI
import { updateUI } from './ui/renderer.js';
import { switchTab, changeGrouping } from './ui/tabs.js';
import { showMessage } from './ui/components.js';

// Features
import { initCurrency, toggleCurrencySelector, closeCurrencySelector, selectCurrency, updateCurrencyDisplay } from './features/currency.js';
import { exportToCSV } from './features/export.js';
import { initDarkMode, toggleDarkMode } from './features/theme.js';
import { checkAppVersion, checkForUpdates, dismissUpdate, reloadApp, hideInstallPrompt, checkInstallPrompt } from './features/update.js';

/**
 * Initialize application
 */
function init() {
    console.log('🚀 Initializing FinChronicle...');

    // Initialize core systems
    initEventDelegation();
    initCurrency();
    initDarkMode();
    checkAppVersion();

    // Load data
    transaction.loadTransactions();

    // Initialize form
    initializeForm();

    // Register all event handlers
    registerEventHandlers();

    // Initial UI update
    updateUI();

    // Check install prompt (iOS)
    checkInstallPrompt();

    // Register service worker
    registerServiceWorker();

    console.log('✅ FinChronicle initialized');
}

/**
 * Initialize form with defaults
 */
function initializeForm() {
    // Set today's date as default
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    // Initialize categories for default type (expense)
    updateCategoryOptions('expense');

    // Set up form submission
    const form = document.getElementById('transactionForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

/**
 * Update category dropdown based on type
 * @param {string} type - Transaction type ('income' or 'expense')
 */
function updateCategoryOptions(type) {
    const categorySelect = document.getElementById('category');
    if (!categorySelect) return;

    const cats = CATEGORIES[type] || [];

    // Clear and repopulate
    categorySelect.innerHTML = cats.map(cat =>
        `<option value="${cat}">${cat}</option>`
    ).join('');

    // If editing, try to preserve selection if valid
    const editingId = store.get('editingId');
    if (editingId) {
        const currentCategory = categorySelect.dataset.editValue;
        if (currentCategory && cats.includes(currentCategory)) {
            categorySelect.value = currentCategory;
        }
    }
}

/**
 * Handle form submission
 * @param {Event} e - Submit event
 */
function handleFormSubmit(e) {
    e.preventDefault();

    const editingId = store.get('editingId');
    const transactionData = {
        type: document.getElementById('type').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        date: document.getElementById('date').value,
        notes: document.getElementById('notes').value
    };

    if (editingId) {
        // Update existing transaction
        transaction.updateTransaction(editingId, transactionData);
        showMessage('Transaction updated!');
    } else {
        // Add new transaction
        transaction.addTransaction(transactionData);
        showMessage('Transaction saved!');
    }

    // Clear form
    resetForm();
    updateUI();
}

/**
 * Reset form to initial state
 */
function resetForm() {
    const form = document.getElementById('transactionForm');
    if (form) form.reset();

    const dateInput = document.getElementById('date');
    if (dateInput) dateInput.valueAsDate = new Date();

    store.set('editingId', null);

    // Reset to expense type
    selectType('expense');

    document.getElementById('formTitle').textContent = 'Add Transaction';
    document.getElementById('submitBtn').textContent = 'Save Transaction';
    document.getElementById('cancelEditBtn').style.display = 'none';
}

/**
 * Select transaction type (toggle button)
 * @param {string} type - Type to select ('income' or 'expense')
 */
function selectType(type) {
    // Update hidden input
    document.getElementById('type').value = type;

    // Update toggle button states
    document.querySelectorAll('.type-option').forEach(btn => {
        const isActive = btn.dataset.type === type;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-checked', isActive);
    });

    // Update categories dropdown
    updateCategoryOptions(type);
}

/**
 * Register all event handlers
 */
function registerEventHandlers() {
    // Tab navigation
    on('switch-tab', ({ tab }) => switchTab(tab));

    // Grouping
    on('change-grouping', ({ type }, event) => changeGrouping(type, event));

    // Filters
    on('filter-month', ({ month }) => {
        store.set('selectedMonth', month);
        updateUI();
    });

    on('filter-category', ({ value }) => {
        store.set('selectedCategory', value);
        updateUI();
    });

    // Transaction type selector
    on('select-type', ({ type }) => selectType(type));

    // Transaction CRUD
    on('edit-transaction', ({ id }) => editTransaction(id));
    on('delete-transaction', ({ id }) => openDeleteModal(id));
    on('confirm-delete', () => confirmDelete());
    on('cancel-delete', () => closeDeleteModal());
    on('cancel-edit', () => resetForm());

    // Currency
    on('toggle-currency', () => toggleCurrencySelector());
    on('close-currency', () => closeCurrencySelector());
    on('select-currency', ({ code }) => selectCurrency(code));

    // Features
    on('export-csv', () => exportToCSV());
    on('toggle-dark-mode', () => toggleDarkMode());
    on('check-updates', () => checkForUpdates());
    on('dismiss-update', () => dismissUpdate());
    on('reload-app', () => reloadApp());
    on('hide-install-prompt', () => hideInstallPrompt());

    // Category filter dropdown
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            store.set('selectedCategory', categoryFilter.value);
            updateUI();
        });
    }
}

/**
 * Edit transaction
 * @param {number} id - Transaction ID
 */
function editTransaction(id) {
    const trans = transaction.getTransaction(id);
    if (!trans) return;

    store.set('editingId', id);

    // Set type and update toggle button
    selectType(trans.type);

    // Store category for after type change
    const categorySelect = document.getElementById('category');
    categorySelect.dataset.editValue = trans.category;

    // Update form values
    document.getElementById('amount').value = trans.amount;
    document.getElementById('date').value = trans.date;
    document.getElementById('notes').value = trans.notes;

    // Update categories and set selected category
    updateCategoryOptions(trans.type);
    document.getElementById('category').value = trans.category;

    document.getElementById('formTitle').textContent = 'Edit Transaction';
    document.getElementById('submitBtn').textContent = 'Update Transaction';
    document.getElementById('cancelEditBtn').style.display = 'block';

    switchTab('add');
    window.scrollTo(0, 0);
}

/**
 * Open delete modal
 * @param {number} id - Transaction ID to delete
 */
function openDeleteModal(id) {
    store.set('deleteId', id);
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.add('show');
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('show');
    store.set('deleteId', null);
}

/**
 * Confirm delete transaction
 */
function confirmDelete() {
    const deleteId = store.get('deleteId');
    if (deleteId) {
        transaction.deleteTransaction(deleteId);
        updateUI();
        showMessage('Transaction deleted!');
        store.set('deleteId', null);
    }
    closeDeleteModal();
}

/**
 * Register service worker for offline support
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
        let refreshing = false;

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data.type === 'SW_UPDATED') {
                console.log('✅ Service Worker updated:', event.data.version);
                // Show update notification
                if (!refreshing) {
                    const prompt = document.getElementById('updatePrompt');
                    if (prompt) prompt.classList.add('show');
                }
            }
        });

        // Detect when new service worker is controlling the page
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            console.log('🔄 New service worker taking control - reloading page...');
            refreshing = true;
            window.location.reload();
        });

        // Register service worker
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('✅ Service Worker registered - App works offline!');

                // Check for updates every time the app is opened
                registration.update();

                // Check for updates periodically (every 60 seconds)
                setInterval(() => {
                    registration.update();
                }, 60000);

                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🆕 New service worker found - installing...');

                    newWorker.addEventListener('statechange', () => {
                        console.log('Service Worker state:', newWorker.state);

                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available!
                            console.log('🎉 New version ready to activate!');
                            const prompt = document.getElementById('updatePrompt');
                            if (prompt) prompt.classList.add('show');
                        }
                    });
                });
            })
            .catch(err => console.error('❌ Service Worker registration failed:', err));
    } else if (window.location.protocol === 'file:') {
        console.log('ℹ️ Service Worker requires HTTP/HTTPS. Run a local server to enable offline mode.');
        console.log('Quick start: python3 -m http.server 8000');
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
