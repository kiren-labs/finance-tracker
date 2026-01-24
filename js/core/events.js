/**
 * Event Delegation System
 * Centralized event handling to replace inline onclick handlers
 */

// Event handlers registry
const handlers = new Map();

/**
 * Register an event handler for an action
 * @param {string} action - Action name (e.g., 'export-csv', 'switch-tab')
 * @param {Function} handler - Handler function (receives params, event)
 */
export function on(action, handler) {
    handlers.set(action, handler);
}

/**
 * Unregister an event handler
 * @param {string} action - Action name to unregister
 */
export function off(action) {
    handlers.delete(action);
}

/**
 * Handle delegated click events
 * @param {Event} event - Click event
 */
function handleClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const handler = handlers.get(action);

    if (handler) {
        event.preventDefault();

        // Parse params if provided
        let params = {};
        if (target.dataset.params) {
            try {
                params = JSON.parse(target.dataset.params);
            } catch (error) {
                console.error('Error parsing params:', error);
            }
        }

        // Call handler with params and event
        handler(params, event);
    } else {
        console.warn(`No handler registered for action: ${action}`);
    }
}

/**
 * Handle delegated change events
 * @param {Event} event - Change event
 */
function handleChange(event) {
    const target = event.target.closest('[data-change]');
    if (!target) return;

    const action = target.dataset.change;
    const handler = handlers.get(action);

    if (handler) {
        // Parse params if provided
        let params = { value: target.value };
        if (target.dataset.params) {
            try {
                params = { ...params, ...JSON.parse(target.dataset.params) };
            } catch (error) {
                console.error('Error parsing params:', error);
            }
        }

        // Call handler with params and event
        handler(params, event);
    } else {
        console.warn(`No handler registered for change action: ${action}`);
    }
}

/**
 * Handle delegated submit events
 * @param {Event} event - Submit event
 */
function handleSubmit(event) {
    const target = event.target.closest('[data-submit]');
    if (!target) return;

    event.preventDefault();

    const action = target.dataset.submit;
    const handler = handlers.get(action);

    if (handler) {
        // Get form data
        const formData = new FormData(target);
        const params = Object.fromEntries(formData.entries());

        // Call handler with form data and event
        handler(params, event);
    } else {
        console.warn(`No handler registered for submit action: ${action}`);
    }
}

/**
 * Initialize event delegation system
 * Sets up global event listeners on document
 */
export function initEventDelegation() {
    // Use capture phase to ensure we catch events early
    document.addEventListener('click', handleClick, true);
    document.addEventListener('change', handleChange, true);
    document.addEventListener('submit', handleSubmit, true);

    console.log('✅ Event delegation initialized');
}

/**
 * Remove event delegation listeners
 */
export function destroyEventDelegation() {
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('change', handleChange, true);
    document.removeEventListener('submit', handleSubmit, true);
    handlers.clear();
}
