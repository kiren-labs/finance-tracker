/**
 * Tab Management
 * Handle tab navigation and grouping controls
 */

import * as store from '../core/store.js';
import { updateGroupedView } from './renderer.js';

/**
 * Switch to a different tab
 * @param {string} tab - Tab name ('add', 'list', or 'groups')
 */
export function switchTab(tab) {
    store.set('currentTab', tab);

    // Update tab buttons
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
    });

    const activeButton = document.getElementById(`${tab}-tab`);
    if (activeButton) {
        activeButton.classList.add('active');
        activeButton.setAttribute('aria-selected', 'true');
    }

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const activeContent = document.getElementById(`${tab}Tab`);
    if (activeContent) {
        activeContent.classList.add('active');
    }
}

/**
 * Change grouping type in groups tab
 * @param {string} type - Grouping type ('month' or 'category')
 * @param {Event} event - Click event (optional)
 */
export function changeGrouping(type, event) {
    store.set('currentGrouping', type);

    // Update filter buttons
    document.querySelectorAll('#groupsTab .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    if (event && event.target) {
        event.target.classList.add('active');
    }

    updateGroupedView();
}
