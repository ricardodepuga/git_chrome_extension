/**
 * Storage utilities for the Git Repos Browser extension.
 * Uses chrome.storage.local for the PAT and chrome.storage.sync for favorites.
 */

const Storage = {
  /**
   * Get all saved GitHub accounts.
   * @returns {Promise<Array<{login: string, name: string, avatarUrl: string, token: string}>>}
   */
  async getAccounts() {
    const result = await chrome.storage.local.get(['github_accounts', 'github_pat']);
    
    // Migration from old single-token system
    if (!result.github_accounts && result.github_pat) {
        // We return a mock array here, popup.js will hydrate the missing user info and re-save
        return [{ token: result.github_pat, isLegacy: true }];
    }
    
    return result.github_accounts || [];
  },

  /**
   * Get the active GitHub account login.
   * @returns {Promise<string|null>}
   */
  async getActiveAccountId() {
    const result = await chrome.storage.local.get('active_account');
    return result.active_account || null;
  },

  /**
   * Get the token for the currently active account.
   * @returns {Promise<string|null>}
   */
  async getToken() {
     const accounts = await this.getAccounts();
     if (accounts.length === 0) return null;
     
     const activeId = await this.getActiveAccountId();
     const activeAccount = accounts.find(a => a.login === activeId) || accounts[0];
     
     return activeAccount ? activeAccount.token : null;
  },

  /**
   * Save a GitHub account (add or update).
   * @param {Object} account - {login, name, avatarUrl, token}
   * @returns {Promise<void>}
   */
  async saveAccount(account) {
    const accounts = await this.getAccounts();
    // Remove legacy placeholder if present
    const validAccounts = accounts.filter(a => !a.isLegacy);
    
    const existingIndex = validAccounts.findIndex(a => a.login === account.login);
    if (existingIndex >= 0) {
        validAccounts[existingIndex] = account; // Update
    } else {
        validAccounts.push(account); // Add new
    }
    
    await chrome.storage.local.set({ 
        github_accounts: validAccounts,
        active_account: account.login 
    });
    
    // Clean up legacy
    await chrome.storage.local.remove('github_pat');
  },

  /**
   * Set the active account login.
   * @param {string} login
   */
  async setActiveAccount(login) {
      await chrome.storage.local.set({ active_account: login });
  },

  /**
   * Remove a specific GitHub account.
   * @param {string} login
   * @returns {Promise<void>}
   */
  async removeAccount(login) {
      let accounts = await this.getAccounts();
      accounts = accounts.filter(a => a.login !== login && !a.isLegacy);
      
      const updates = { github_accounts: accounts };
      
      const activeId = await this.getActiveAccountId();
      if (activeId === login) {
          updates.active_account = accounts.length > 0 ? accounts[0].login : null;
      }
      
      await chrome.storage.local.set(updates);
  },
  
  /**
   * Remove all tokens (legacy support).
   */
  async removeToken() {
    await chrome.storage.local.remove(['github_pat', 'github_accounts', 'active_account']);
  },

  /**
   * Get the sorting preference.
   * @returns {Promise<'updated'|'alpha'>}
   */
  async getSortPreference() {
    const result = await chrome.storage.local.get('sort_preference');
    return result.sort_preference || 'updated'; // Default is recently updated
  },

  /**
   * Save the sorting preference.
   * @param {'updated'|'alpha'} sortPref
   */
  async setSortPreference(sortPref) {
    await chrome.storage.local.set({ sort_preference: sortPref });
  },

  /**
   * Get the list of favorite repository IDs.
   * @returns {Promise<number[]>}
   */
  async getFavorites() {
    const result = await chrome.storage.sync.get('favorites');
    return result.favorites || [];
  },

  /**
   * Save the list of favorite repository IDs.
   * @param {number[]} ids
   * @returns {Promise<void>}
   */
  async setFavorites(ids) {
    await chrome.storage.sync.set({ favorites: ids });
  },

  /**
   * Toggle a repository as favorite.
   * @param {number} repoId
   * @returns {Promise<boolean>} true if added, false if removed
   */
  async toggleFavorite(repoId) {
    const favorites = await this.getFavorites();
    const index = favorites.indexOf(repoId);

    if (index === -1) {
      favorites.push(repoId);
    } else {
      favorites.splice(index, 1);
    }

    await this.setFavorites(favorites);
    return index === -1;
  },

  /**
   * Check if a repository is a favorite.
   * @param {number} repoId
   * @returns {Promise<boolean>}
   */
  async isFavorite(repoId) {
    const favorites = await this.getFavorites();
    return favorites.includes(repoId);
  },

  /**
   * Get pending OAuth Device Flow session.
   * @returns {Promise<Object|null>}
   */
  async getPendingOAuth() {
      const result = await chrome.storage.local.get('pending_oauth');
      return result.pending_oauth || null;
  },

  /**
   * Save a pending OAuth Device Flow session.
   * @param {Object} session - { deviceCode, userCode, verificationUri, expiresAt, interval }
   */
  async savePendingOAuth(session) {
      await chrome.storage.local.set({ pending_oauth: session });
  },

  /**
   * Clear any pending OAuth Device Flow session.
   */
  async clearPendingOAuth() {
      await chrome.storage.local.remove('pending_oauth');
  }
};

export default Storage;
