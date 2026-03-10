/**
 * Git Repos Manager — Popup main logic
 * Handles UI interactions, repo loading, favorites, and search.
 */

import Storage from '../utils/storage.js';
import { GitHubAPI, GitHubAPIError } from '../utils/github-api.js';

// ===== Language Colors Map =====
const LANGUAGE_COLORS = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#3178c6',
    'Python': '#3572a5',
    'Java': '#b07219',
    'Ruby': '#701516',
    'Go': '#00add8',
    'Rust': '#dea584',
    'PHP': '#4f5d95',
    'C#': '#178600',
    'C++': '#f34b7d',
    'C': '#555555',
    'Swift': '#f05138',
    'Kotlin': '#a97bff',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Shell': '#89e051',
    'Dart': '#00b4ab',
    'Scala': '#c22d40',
    'Vue': '#41b883',
    'Svelte': '#ff3e00'
};

// ===== State =====
let state = {
    starredRepos: [],
    contextRepos: [],
    userOrgs: [],
    user: null,
    searchQuery: '',
    activeTab: 'starred',
    activeOrg: 'personal'
};

// ===== DOM Elements =====
const elements = {};

function cacheDOMElements() {
    // Screens
    elements.setupScreen = document.getElementById('setup-screen');
    elements.mainScreen = document.getElementById('main-screen');

    // Setup
    elements.patInput = document.getElementById('pat-input');
    elements.toggleVisibility = document.getElementById('toggle-visibility');
    elements.saveTokenBtn = document.getElementById('save-token-btn');
    elements.setupError = document.getElementById('setup-error');
    elements.tokenLink = document.getElementById('token-link');
    elements.tokenLinkTop = document.getElementById('token-link-top');

    // Header
    elements.userAvatar = document.getElementById('user-avatar');
    elements.userLogin = document.getElementById('user-login');
    elements.refreshBtn = document.getElementById('refresh-btn');
    elements.settingsBtn = document.getElementById('settings-btn');
    elements.orgSelect = document.getElementById('org-select');

    // Search
    elements.searchInput = document.getElementById('search-input');

    // Tabs
    elements.tabs = document.querySelectorAll('.tab');
    elements.tabContents = document.querySelectorAll('.tab-content');
    elements.starredTab = document.querySelector('[data-tab="starred"]');
    elements.allReposTab = document.querySelector('[data-tab="all"]');

    // Lists
    elements.starredList = document.getElementById('starred-list');
    elements.allReposList = document.getElementById('all-repos-list');
    elements.noStarred = document.getElementById('no-starred');

    // Loading & Errors
    elements.loadingOverlay = document.getElementById('loading-overlay');
    elements.mainError = document.getElementById('main-error');
    elements.mainErrorText = document.getElementById('main-error-text');
    elements.dismissError = document.getElementById('dismiss-error');

    // Settings Modal
    elements.settingsModal = document.getElementById('settings-modal');
    elements.closeSettings = document.getElementById('close-settings');
    elements.settingsAvatar = document.getElementById('settings-avatar');
    elements.settingsName = document.getElementById('settings-name');
    elements.settingsLogin = document.getElementById('settings-login');
    elements.disconnectBtn = document.getElementById('disconnect-btn');
}

// ===== Initialization =====
async function init() {
    cacheDOMElements();
    bindEvents();

    const token = await Storage.getToken();
    if (token) {
        await loadMainScreen(token);
    } else {
        showScreen('setup');
    }
}

// ===== Event Binding =====
function bindEvents() {
    // Setup events
    elements.patInput.addEventListener('input', onPATInput);
    elements.toggleVisibility.addEventListener('click', onToggleVisibility);
    elements.saveTokenBtn.addEventListener('click', onSaveToken);
    elements.tokenLink.addEventListener('click', onTokenLinkClick);
    if (elements.tokenLinkTop) {
        elements.tokenLinkTop.addEventListener('click', onTokenLinkClick);
    }

    // Header events
    elements.refreshBtn.addEventListener('click', onRefresh);
    elements.settingsBtn.addEventListener('click', () => toggleModal(true));

    // Search & Context
    elements.searchInput.addEventListener('input', onSearch);
    elements.orgSelect.addEventListener('change', onOrgChange);

    // Tabs
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Settings modal
    elements.closeSettings.addEventListener('click', () => toggleModal(false));
    document.querySelector('.modal-backdrop')?.addEventListener('click', () => toggleModal(false));
    elements.disconnectBtn.addEventListener('click', onDisconnect);

    // Error dismiss
    elements.dismissError.addEventListener('click', () => {
        elements.mainError.classList.add('hidden');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== elements.searchInput && document.activeElement !== elements.patInput) {
            e.preventDefault();
            elements.searchInput?.focus();
        }
        if (e.key === 'Escape') {
            toggleModal(false);
        }
    });
}

// ===== Screen Management =====
function showScreen(screen) {
    elements.setupScreen.classList.add('hidden');
    elements.mainScreen.classList.add('hidden');

    if (screen === 'setup') {
        elements.setupScreen.classList.remove('hidden');
        setTimeout(() => elements.patInput.focus(), 100);
    } else {
        elements.mainScreen.classList.remove('hidden');
    }
}

// ===== Setup Screen Logic =====
function onPATInput() {
    const value = elements.patInput.value.trim();
    elements.saveTokenBtn.disabled = value.length === 0;
    elements.setupError.classList.add('hidden');
}

function onToggleVisibility() {
    const input = elements.patInput;
    input.type = input.type === 'password' ? 'text' : 'password';
}

function onTokenLinkClick(e) {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/settings/tokens' });
}

async function onSaveToken() {
    const token = elements.patInput.value.trim();
    if (!token) return;

    const btn = elements.saveTokenBtn;
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');

    btn.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');

    try {
        // Validate the token
        const user = await GitHubAPI.validateToken(token);
        state.user = user;

        // Save the token
        await Storage.setToken(token);

        // Load the main screen
        await loadMainScreen(token);
    } catch (error) {
        elements.setupError.classList.remove('hidden');
        if (error instanceof GitHubAPIError && error.isUnauthorized) {
            elements.setupError.textContent = 'Invalid token. Please check your Personal Access Token.';
        } else {
            elements.setupError.textContent = `Connection failed: ${error.message}`;
        }
        btn.disabled = false;
    } finally {
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
    }
}

// ===== Main Screen Logic =====
async function loadMainScreen(token) {
    showScreen('main');
    elements.loadingOverlay.classList.remove('hidden');

    try {
        // Load user info if not cached
        if (!state.user) {
            state.user = await GitHubAPI.validateToken(token);
        }

        updateUserInfo();

        // Load orgs and initial repos
        const [orgs, starred, userRepos] = await Promise.all([
            GitHubAPI.fetchUserOrgs(token),
            GitHubAPI.fetchStarredRepos(token),
            GitHubAPI.fetchUserRepos(token)
        ]);

        state.userOrgs = orgs;
        state.starredRepos = starred;
        state.contextRepos = userRepos;

        populateOrgSelector();
        renderRepos();
        updateTabCounts();
    } catch (error) {
        if (error instanceof GitHubAPIError && error.isUnauthorized) {
            // Token is invalid, go back to setup
            await Storage.removeToken();
            state.user = null;
            showScreen('setup');
            elements.setupError.classList.remove('hidden');
            elements.setupError.textContent = 'Token expired or invalid. Please reconnect.';
        } else {
            showError(`Failed to load repositories: ${error.message}`);
        }
    } finally {
        elements.loadingOverlay.classList.add('hidden');
    }
}

function populateOrgSelector() {
    const select = elements.orgSelect;
    // Keep only the first option 'My Repositories'
    while (select.options.length > 1) {
        select.remove(1);
    }

    state.userOrgs.forEach(org => {
        const option = document.createElement('option');
        option.value = org.login;
        option.textContent = org.login;
        select.appendChild(option);
    });

    select.value = state.activeOrg;
}

async function onOrgChange() {
    state.activeOrg = elements.orgSelect.value;
    elements.loadingOverlay.classList.remove('hidden');

    try {
        const token = await Storage.getToken();
        if (state.activeOrg === 'personal') {
            state.contextRepos = await GitHubAPI.fetchUserRepos(token);
        } else {
            state.contextRepos = await GitHubAPI.fetchOrgRepos(token, state.activeOrg);
        }
        renderRepos();
        updateTabCounts();
    } catch (error) {
        showError(`Failed to load organization repositories: ${error.message}`);
    } finally {
        elements.loadingOverlay.classList.add('hidden');
    }
}

function updateUserInfo() {
    if (!state.user) return;

    elements.userAvatar.src = state.user.avatarUrl;
    elements.userLogin.textContent = `@${state.user.login}`;

    // Settings
    elements.settingsAvatar.src = state.user.avatarUrl;
    elements.settingsName.textContent = state.user.name || state.user.login;
    elements.settingsLogin.textContent = `@${state.user.login}`;
}

// ===== Rendering =====
function renderRepos() {
    const query = state.searchQuery.toLowerCase();

    // 1. Prepare Starred List
    let filteredStarred = state.starredRepos;
    if (query) {
        filteredStarred = filteredStarred.filter(repo =>
            repo.name.toLowerCase().includes(query) ||
            repo.fullName.toLowerCase().includes(query) ||
            (repo.description && repo.description.toLowerCase().includes(query))
        );
    }

    // 2. Prepare Context (All Repos) List
    let contextList = [];
    if (state.activeOrg === 'personal') {
        // Merge Starred followed by other repos
        const starredIds = new Set(state.starredRepos.map(r => r.id));
        const unstarredRepos = state.contextRepos.filter(r => !starredIds.has(r.id));
        contextList = [...state.starredRepos, ...unstarredRepos];
    } else {
        // Just org repos, but put starred ones at the top if any
        contextList = [...state.contextRepos].sort((a, b) => {
            const aStar = state.starredRepos.some(r => r.id === a.id);
            const bStar = state.starredRepos.some(r => r.id === b.id);
            if (aStar && !bStar) return -1;
            if (!aStar && bStar) return 1;
            return 0;
        });

        // Ensure all public/private organization repos are shown even if they are not starred. 
        // Note: The contextRepos parameter already fetches ALL organization repos via the API since we pass type: 'all'
    }

    let filteredContext = contextList;
    if (query) {
        filteredContext = filteredContext.filter(repo =>
            repo.name.toLowerCase().includes(query) ||
            repo.fullName.toLowerCase().includes(query) ||
            (repo.description && repo.description.toLowerCase().includes(query))
        );
    }

    // Render lists
    renderRepoList(elements.starredList, filteredStarred, 'starred');
    renderRepoList(elements.allReposList, filteredContext, 'all');

    // Show/hide empty states for Starred tab
    if (filteredStarred.length === 0 && !query) {
        elements.noStarred.classList.remove('hidden');
    } else {
        elements.noStarred.classList.add('hidden');
        if (filteredStarred.length === 0 && query) {
            showNoResults(elements.starredList, query);
        }
    }

    // Show/hide empty state for All Repos tab
    if (filteredContext.length === 0 && query) {
        showNoResults(elements.allReposList, query);
    }
}

function renderRepoList(container, repos, listType) {
    // Remove existing repo items (keep empty state)
    const existingItems = container.querySelectorAll('.repo-item, .no-results');
    existingItems.forEach(item => item.remove());

    repos.forEach(repo => {
        const item = createRepoItem(repo);
        container.appendChild(item);
    });
}

function createRepoItem(repo) {
    const isStarred = state.starredRepos.some(r => r.id === repo.id);
    const item = document.createElement('div');
    item.className = 'repo-item';
    item.dataset.repoId = repo.id;

    const langColor = LANGUAGE_COLORS[repo.language] || '#8b949e';
    const timeAgo = formatTimeAgo(repo.updatedAt);

    item.innerHTML = `
    <svg class="repo-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
    <div class="repo-info">
      <div class="repo-name">
        <span class="repo-owner">${escapeHTML(repo.owner)} / </span>${escapeHTML(repo.name)}
      </div>
      ${repo.description ? `<div class="repo-description">${escapeHTML(repo.description)}</div>` : ''}
      <div class="repo-meta">
        ${repo.language ? `
          <span class="repo-language">
            <span class="language-dot" style="background-color: ${langColor}"></span>
            ${escapeHTML(repo.language)}
          </span>
        ` : ''}
        <span class="repo-updated">Updated ${timeAgo}</span>
      </div>
    </div>
    <button class="star-btn ${isStarred ? 'active' : ''}" title="${isStarred ? 'Unstar' : 'Star'}" data-repo-id="${repo.id}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="${isStarred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </button>
  `;

    // Click on repo opens in new tab
    item.addEventListener('click', (e) => {
        if (e.target.closest('.star-btn')) return;
        chrome.tabs.create({ url: repo.url });
    });

    // Star button
    const starBtn = item.querySelector('.star-btn');
    starBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await toggleStar(repo, starBtn);
    });

    return item;
}

function showNoResults(container, query) {
    const existing = container.querySelector('.no-results');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = 'no-results';
    div.innerHTML = `
    <p>No results for "${escapeHTML(query)}"</p>
    <span>Try a different search term</span>
  `;
    container.appendChild(div);
}

// ===== Star Logic =====
async function toggleStar(repo, btnElement) {
    const token = await Storage.getToken();
    if (!token) return;

    const isCurrentlyStarred = state.starredRepos.some(r => r.id === repo.id);

    // Optimistic UI update
    if (isCurrentlyStarred) {
        state.starredRepos = state.starredRepos.filter(r => r.id !== repo.id);
        btnElement.classList.remove('active');
        btnElement.title = 'Star';
        btnElement.querySelector('svg').setAttribute('fill', 'none');
    } else {
        state.starredRepos.unshift(repo);
        btnElement.classList.add('active');
        btnElement.title = 'Unstar';
        btnElement.querySelector('svg').setAttribute('fill', 'currentColor');
    }

    btnElement.classList.add('pop');
    setTimeout(() => btnElement.classList.remove('pop'), 300);

    renderRepos();
    updateTabCounts();

    try {
        await GitHubAPI.toggleStar(token, repo.fullName, isCurrentlyStarred);
    } catch (error) {
        // Revert optimistic update only on error
        showError(`Failed to update star: ${error.message}`);

        if (isCurrentlyStarred) {
            state.starredRepos.unshift(repo);
            btnElement.classList.add('active');
            btnElement.title = 'Unstar';
            btnElement.querySelector('svg').setAttribute('fill', 'currentColor');
        } else {
            state.starredRepos = state.starredRepos.filter(r => r.id !== repo.id);
            btnElement.classList.remove('active');
            btnElement.title = 'Star';
            btnElement.querySelector('svg').setAttribute('fill', 'none');
        }

        renderRepos();
        updateTabCounts();
    }
}

// ===== Tabs =====
function switchTab(tabName) {
    state.activeTab = tabName;

    elements.tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    elements.tabContents.forEach(content => {
        content.classList.remove('active');
    });

    if (tabName === 'starred') {
        elements.starredList.classList.add('active');
    } else {
        elements.allReposList.classList.add('active');
    }
}

function updateTabCounts() {
    const starredCount = state.starredRepos.length;

    // Calculate context count based on what's displayed in the 'All' tab
    let contextCount = 0;
    if (state.activeOrg === 'personal') {
        const starredIds = new Set(state.starredRepos.map(r => r.id));
        const unstarredRepos = state.contextRepos.filter(r => !starredIds.has(r.id));
        contextCount = state.starredRepos.length + unstarredRepos.length;
    } else {
        contextCount = state.contextRepos.length;
    }

    // Update or create count badges
    updateTabBadge(elements.starredTab, starredCount);
    updateTabBadge(elements.allReposTab, contextCount);
}

function updateTabBadge(tabElement, count) {
    let badge = tabElement.querySelector('.repo-count');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'repo-count';
        tabElement.appendChild(badge);
    }
    badge.textContent = count;
}

// ===== Search =====
function onSearch() {
    state.searchQuery = elements.searchInput.value.trim();
    renderRepos();
}

// ===== Refresh =====
async function onRefresh() {
    const btn = elements.refreshBtn;
    if (btn.classList.contains('refreshing')) return;

    btn.classList.add('refreshing');

    try {
        const token = await Storage.getToken();
        if (!token) return;

        const [starred, orgs, context] = await Promise.all([
            GitHubAPI.fetchStarredRepos(token),
            GitHubAPI.fetchUserOrgs(token),
            state.activeOrg === 'personal'
                ? GitHubAPI.fetchUserRepos(token)
                : GitHubAPI.fetchOrgRepos(token, state.activeOrg)
        ]);

        state.starredRepos = starred;
        state.userOrgs = orgs;
        state.contextRepos = context;

        populateOrgSelector();
        renderRepos();
        updateTabCounts();
    } catch (error) {
        showError(`Refresh failed: ${error.message}`);
    } finally {
        btn.classList.remove('refreshing');
    }
}

// ===== Settings =====
function toggleModal(show) {
    elements.settingsModal.classList.toggle('hidden', !show);
}

async function onDisconnect() {
    await Storage.removeToken();
    state = { starredRepos: [], contextRepos: [], userOrgs: [], user: null, searchQuery: '', activeTab: 'starred', activeOrg: 'personal' };
    toggleModal(false);
    showScreen('setup');
    elements.patInput.value = '';
    elements.setupError.classList.add('hidden');
}

// ===== Error Handling =====
function showError(message) {
    elements.mainErrorText.textContent = message;
    elements.mainError.classList.remove('hidden');
    setTimeout(() => {
        elements.mainError.classList.add('hidden');
    }, 5000);
}

// ===== Utilities =====
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = [
        { label: 'y', seconds: 31536000 },
        { label: 'mo', seconds: 2592000 },
        { label: 'd', seconds: 86400 },
        { label: 'h', seconds: 3600 },
        { label: 'm', seconds: 60 }
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count}${interval.label} ago`;
        }
    }

    return 'just now';
}

// ===== Start =====
document.addEventListener('DOMContentLoaded', init);
