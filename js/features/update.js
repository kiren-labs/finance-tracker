/**
 * Update Feature
 * Version checking and PWA update management
 */

import { APP_VERSION } from '../data/constants.js';
import { loadString, saveString } from '../data/storage.js';
import * as store from '../core/store.js';
import { showMessage } from '../ui/components.js';

/**
 * Check app version on load
 */
export function checkAppVersion() {
    const storedVersion = loadString('app_version');

    if (!storedVersion) {
        // First time install
        saveString('app_version', APP_VERSION);
        console.log(`✨ FinChronicle ${APP_VERSION} installed!`);
    } else if (storedVersion !== APP_VERSION) {
        // Version has changed - show update notification
        console.log(`🎉 Updated from ${storedVersion} to ${APP_VERSION}`);
        showUpdateNotification(storedVersion, APP_VERSION);
        saveString('app_version', APP_VERSION);
    } else {
        // Same version, check if service worker has updates
        checkServiceWorkerUpdate();
    }

    // Update version display in UI
    const versionEl = document.getElementById('appVersion');
    if (versionEl) {
        versionEl.textContent = `v${APP_VERSION}`;
    }
}

/**
 * Show update notification
 * @param {string} oldVersion - Previous version
 * @param {string} newVersion - New version
 */
export function showUpdateNotification(oldVersion, newVersion) {
    const prompt = document.getElementById('updatePrompt');
    if (!prompt) return;

    const message = prompt.querySelector('p');
    if (message) {
        message.textContent = `Updated from v${oldVersion} to v${newVersion}! Check out the new features.`;
    }

    prompt.classList.add('show');

    // Auto-hide after 10 seconds
    setTimeout(() => {
        dismissUpdate();
    }, 10000);
}

/**
 * Check for service worker updates
 */
export function checkServiceWorkerUpdate() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            store.set('updateAvailable', true);
                            showUpdatePrompt();
                        }
                    });
                });
                // Check for updates now
                registration.update();
            }
        });
    }
}

/**
 * Show update prompt
 */
export function showUpdatePrompt() {
    const prompt = document.getElementById('updatePrompt');
    if (prompt) {
        prompt.classList.add('show');
    }
}

/**
 * Dismiss update notification
 */
export function dismissUpdate() {
    const prompt = document.getElementById('updatePrompt');
    if (prompt) {
        prompt.classList.remove('show');
    }
}

/**
 * Reload app to activate new service worker
 */
export function reloadApp() {
    // Tell service worker to skip waiting and activate immediately
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.getRegistration().then(reg => {
            if (reg && reg.waiting) {
                // Tell the waiting service worker to activate
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } else {
                // No waiting worker, just reload
                window.location.reload(true);
            }
        });
    } else {
        // Force hard reload
        window.location.reload(true);
    }
}

/**
 * Manual update check
 */
export function checkForUpdates() {
    const btn = document.getElementById('updateCheckBtn');
    const icon = btn?.querySelector('i');

    // Show spinning animation
    if (icon) {
        icon.style.animation = 'spin 1s linear infinite';
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
                console.log('🔍 Checking for updates...');
                showMessage('Checking for updates...');

                registration.update().then(() => {
                    setTimeout(() => {
                        if (icon) icon.style.animation = '';

                        // Check if update is available
                        if (registration.waiting || registration.installing) {
                            showMessage('Update found! Preparing...');
                            showUpdatePrompt();
                        } else {
                            showMessage("You're on the latest version!");
                        }
                    }, 1000);
                });
            } else {
                if (icon) icon.style.animation = '';
                showMessage('No service worker registered');
            }
        });
    } else {
        if (icon) icon.style.animation = '';
        showMessage('Service Worker not supported');
    }
}

/**
 * Hide install prompt (for iOS)
 */
export function hideInstallPrompt() {
    const prompt = document.getElementById('installPrompt');
    if (prompt) {
        prompt.style.display = 'none';
    }
    saveString('installPromptHidden', 'true');
}

/**
 * Check if install prompt should be shown (iOS)
 */
export function checkInstallPrompt() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true;
    const promptHidden = loadString('installPromptHidden');

    if (isIOS && !isStandalone && !promptHidden) {
        const prompt = document.getElementById('installPrompt');
        if (prompt) {
            prompt.style.display = 'block';
        }
    }
}
