/**
 * Centralized State Management
 * Single source of truth with pub/sub pattern for reactive updates
 */

// Global application state
const state = {
    transactions: [],
    currentTab: 'add',
    currentGrouping: 'month',
    selectedMonth: 'all',
    selectedCategory: 'all',
    editingId: null,
    deleteId: null,
    updateAvailable: false,
    darkMode: false,
    currency: 'INR'
};

// Subscribers for state changes
const subscribers = new Set();

/**
 * Get current state
 * @returns {Object} Current application state
 */
export function getState() {
    return { ...state };
}

/**
 * Get specific state value
 * @param {string} key - State key to retrieve
 * @returns {any} State value
 */
export function get(key) {
    return state[key];
}

/**
 * Set state values and notify subscribers
 * @param {Object} updates - Object with state updates
 */
export function setState(updates) {
    const changed = {};

    for (const [key, value] of Object.entries(updates)) {
        if (state[key] !== value) {
            state[key] = value;
            changed[key] = value;
        }
    }

    // Notify subscribers only if something changed
    if (Object.keys(changed).length > 0) {
        notifySubscribers(changed);
    }
}

/**
 * Set specific state value
 * @param {string} key - State key to update
 * @param {any} value - New value
 */
export function set(key, value) {
    setState({ [key]: value });
}

/**
 * Subscribe to state changes
 * @param {Function} callback - Function to call when state changes (receives changed values)
 * @returns {Function} Unsubscribe function
 */
export function subscribe(callback) {
    subscribers.add(callback);

    // Return unsubscribe function
    return () => {
        subscribers.delete(callback);
    };
}

/**
 * Notify all subscribers of state changes
 * @param {Object} changed - Object with changed state values
 */
function notifySubscribers(changed) {
    subscribers.forEach(callback => {
        try {
            callback(changed, state);
        } catch (error) {
            console.error('Error in state subscriber:', error);
        }
    });
}

/**
 * Reset state to initial values
 */
export function resetState() {
    setState({
        transactions: [],
        currentTab: 'add',
        currentGrouping: 'month',
        selectedMonth: 'all',
        selectedCategory: 'all',
        editingId: null,
        deleteId: null,
        updateAvailable: false,
        darkMode: false,
        currency: 'INR'
    });
}
