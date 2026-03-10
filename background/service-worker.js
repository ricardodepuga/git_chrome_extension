/**
 * Service Worker for the Git Repos Manager extension.
 * Handles extension installation and initialization.
 */

// Initialize default storage values on install
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        console.log('Git Repos Manager: Extension installed successfully.');
    }
});
