/**
 * Application Constants
 * Centralized configuration and constant values
 */

// App version - update when releasing new features
export const APP_VERSION = '3.2.1';

// Storage keys
export const STORAGE_KEYS = {
    TRANSACTIONS: 'transactions',
    CURRENCY: 'currency',
    DARK_MODE: 'darkMode',
    APP_VERSION: 'app_version',
    INSTALL_PROMPT_HIDDEN: 'installPromptHidden'
};

// Category definitions
export const CATEGORIES = {
    income: [
        'Salary',
        'Freelance',
        'Business',
        'Investment',
        'Other Income'
    ],
    expense: [
        'Food',
        'Transport',
        'Shopping',
        'Bills',
        'Entertainment',
        'Health',
        'Education',
        'Other Expense'
    ]
};

// Currency definitions
export const CURRENCIES = {
    USD: { symbol: '$', name: 'US Dollar' },
    EUR: { symbol: '€', name: 'Euro' },
    GBP: { symbol: '£', name: 'British Pound' },
    INR: { symbol: '₹', name: 'Indian Rupee' },
    JPY: { symbol: '¥', name: 'Japanese Yen' },
    CNY: { symbol: '¥', name: 'Chinese Yuan' },
    AUD: { symbol: 'A$', name: 'Australian Dollar' },
    CAD: { symbol: 'C$', name: 'Canadian Dollar' },
    CHF: { symbol: 'Fr', name: 'Swiss Franc' },
    THB: { symbol: '฿', name: 'Thai Baht' },
    SGD: { symbol: 'S$', name: 'Singapore Dollar' },
    HKD: { symbol: 'HK$', name: 'Hong Kong Dollar' },
    NZD: { symbol: 'NZ$', name: 'New Zealand Dollar' },
    KRW: { symbol: '₩', name: 'South Korean Won' },
    MYR: { symbol: 'RM', name: 'Malaysian Ringgit' },
    PHP: { symbol: '₱', name: 'Philippine Peso' },
    IDR: { symbol: 'Rp', name: 'Indonesian Rupiah' },
    VND: { symbol: '₫', name: 'Vietnamese Dong' },
    AED: { symbol: 'د.إ', name: 'UAE Dirham' },
    SAR: { symbol: 'SR', name: 'Saudi Riyal' }
};

// Default currency
export const DEFAULT_CURRENCY = 'INR';
