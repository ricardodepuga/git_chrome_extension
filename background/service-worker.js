/**
 * Service Worker for the Git Repos Browser extension.
 * Handles extension installation and initialization.
 */

// Initialize default storage values on install
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        console.log('Git Repos Browser: Extension installed successfully.');
    }
});
