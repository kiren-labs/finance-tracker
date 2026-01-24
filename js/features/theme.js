/**
 * Theme Feature
 * Dark mode management
 */

import { loadString, saveString } from '../data/storage.js';
import * as store from '../core/store.js';

/**
 * Initialize dark mode on app load
 */
export function initDarkMode() {
    const darkMode = loadString('darkMode');

    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
        store.set('darkMode', true);
        updateDarkModeUI(true);
    } else {
        store.set('darkMode', false);
        updateDarkModeUI(false);
    }
}

/**
 * Toggle dark mode
 */
export function toggleDarkMode() {
    const currentMode = store.get('darkMode');
    const newMode = !currentMode;

    document.body.classList.toggle('dark-mode');
    store.set('darkMode', newMode);
    updateDarkModeUI(newMode);

    saveString('darkMode', newMode ? 'enabled' : 'disabled');
}

/**
 * Update dark mode UI elements
 * @param {boolean} isDark - Whether dark mode is enabled
 */
function updateDarkModeUI(isDark) {
    const icon = document.getElementById('darkModeIcon');
    const btn = document.getElementById('darkModeBtn');

    if (icon) {
        icon.className = isDark ? 'ri-sun-line' : 'ri-moon-line';
    }

    if (btn) {
        btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
}
