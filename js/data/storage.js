/**
 * Storage Layer
 * Wrapper for localStorage operations
 */

import { STORAGE_KEYS } from './constants.js';

/**
 * Load data from localStorage
 * @param {string} key - Storage key (use STORAGE_KEYS constants)
 * @returns {any} Parsed data or null if not found
 */
export function load(key) {
    const storageKey = STORAGE_KEYS[key.toUpperCase()] || key;
    try {
        const data = localStorage.getItem(storageKey);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Error loading ${key}:`, error);
        return null;
    }
}

/**
 * Save data to localStorage
 * @param {string} key - Storage key (use STORAGE_KEYS constants)
 * @param {any} value - Data to save (will be JSON stringified)
 */
export function save(key, value) {
    const storageKey = STORAGE_KEYS[key.toUpperCase()] || key;
    try {
        localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving ${key}:`, error);
    }
}

/**
 * Load string from localStorage (without JSON parsing)
 * @param {string} key - Storage key
 * @returns {string|null} String data or null if not found
 */
export function loadString(key) {
    const storageKey = STORAGE_KEYS[key.toUpperCase()] || key;
    try {
        return localStorage.getItem(storageKey);
    } catch (error) {
        console.error(`Error loading ${key}:`, error);
        return null;
    }
}

/**
 * Save string to localStorage (without JSON stringification)
 * @param {string} key - Storage key
 * @param {string} value - String data to save
 */
export function saveString(key, value) {
    const storageKey = STORAGE_KEYS[key.toUpperCase()] || key;
    try {
        localStorage.setItem(storageKey, value);
    } catch (error) {
        console.error(`Error saving ${key}:`, error);
    }
}

/**
 * Remove data from localStorage
 * @param {string} key - Storage key to remove
 */
export function remove(key) {
    const storageKey = STORAGE_KEYS[key.toUpperCase()] || key;
    try {
        localStorage.removeItem(storageKey);
    } catch (error) {
        console.error(`Error removing ${key}:`, error);
    }
}

/**
 * Clear all data from localStorage
 */
export function clear() {
    try {
        localStorage.clear();
    } catch (error) {
        console.error('Error clearing storage:', error);
    }
}
