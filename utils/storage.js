/**
 * Storage utilities for the Git Repos Manager extension.
 * Uses chrome.storage.local for the PAT and chrome.storage.sync for favorites.
 */

const Storage = {
  /**
   * Get the GitHub Personal Access Token.
   * @returns {Promise<string|null>}
   */
  async getToken() {
    const result = await chrome.storage.local.get('github_pat');
    return result.github_pat || null;
  },

  /**
   * Save the GitHub Personal Access Token.
   * @param {string} token
   * @returns {Promise<void>}
   */
  async setToken(token) {
    await chrome.storage.local.set({ github_pat: token });
  },

  /**
   * Remove the GitHub Personal Access Token.
   * @returns {Promise<void>}
   */
  async removeToken() {
    await chrome.storage.local.remove('github_pat');
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
  }
};

export default Storage;
