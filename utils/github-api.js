/**
 * GitHub API wrapper for the Git Repos Manager extension.
 * Handles fetching private repositories with pagination.
 */

const GitHubAPI = {
    BASE_URL: 'https://api.github.com',

    /**
     * Make an authenticated request to the GitHub API.
     * @param {string} token - GitHub PAT
     * @param {string} endpoint - API endpoint (e.g., '/user/repos')
     * @param {object} [params] - Query parameters
     * @returns {Promise<{data: any, nextUrl: string|null}>}
     */
    async request(token, endpoint, params = {}) {
        const url = new URL(`${this.BASE_URL}${endpoint}`);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });

        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new GitHubAPIError(
                response.status,
                error.message || `HTTP ${response.status}`
            );
        }

        // Parse Link header for pagination
        const linkHeader = response.headers.get('Link');
        let nextUrl = null;
        if (linkHeader) {
            const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
            if (nextMatch) {
                nextUrl = nextMatch[1];
            }
        }

        const data = await response.json();
        return { data, nextUrl };
    },

    /**
     * Fetch a page from a full URL (used for pagination).
     * @param {string} token
     * @param {string} fullUrl
     * @returns {Promise<{data: any, nextUrl: string|null}>}
     */
    async requestFullUrl(token, fullUrl) {
        const response = await fetch(fullUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new GitHubAPIError(
                response.status,
                error.message || `HTTP ${response.status}`
            );
        }

        const linkHeader = response.headers.get('Link');
        let nextUrl = null;
        if (linkHeader) {
            const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
            if (nextMatch) {
                nextUrl = nextMatch[1];
            }
        }

        const data = await response.json();
        return { data, nextUrl };
    },

    /**
     * Fetch all repositories for the authenticated user.
     * Handles pagination automatically.
     * @param {string} token - GitHub PAT
     * @returns {Promise<Array<{id: number, name: string, fullName: string, url: string, language: string|null, updatedAt: string, isPrivate: boolean, description: string|null, owner: string, ownerAvatar: string}>>}
     */
    async fetchUserRepos(token) {
        const allRepos = [];
        let page = 1;
        let savedNextUrl = null;

        while (hasMore) {
            let data, nextUrl;
            if (page === 1) {
                const response = await this.request(token, '/user/repos', {
                    type: 'all',
                    per_page: '100',
                    sort: 'updated',
                    direction: 'desc',
                    page: page.toString()
                });
                data = response.data;
                nextUrl = response.nextUrl;
            } else {
                const response = await this.requestFullUrl(token, savedNextUrl);
                data = response.data;
                nextUrl = response.nextUrl;
            }
            savedNextUrl = nextUrl;

            const repos = data.map(repo => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                url: repo.html_url,
                language: repo.language,
                updatedAt: repo.updated_at,
                isPrivate: repo.private,
                description: repo.description,
                owner: repo.owner.login,
                ownerAvatar: repo.owner.avatar_url
            }));

            allRepos.push(...repos);

            if (savedNextUrl && data && data.length === 100) {
                page++;
            } else {
                hasMore = false;
            }
        }

        return allRepos;
    },

    /**
     * Fetch starred repositories for the authenticated user.
     * @param {string} token - GitHub PAT
     * @returns {Promise<Array<any>>}
     */
    async fetchStarredRepos(token) {
        const allRepos = [];
        let page = 1;
        let savedNextUrl = null;

        let hasMore = true;

        while (hasMore) {
            let data, nextUrl;
            if (page === 1) {
                const response = await this.request(token, '/user/starred', {
                    per_page: '100',
                    page: page.toString()
                });
                data = response.data;
                nextUrl = response.nextUrl;
            } else {
                const response = await this.requestFullUrl(token, savedNextUrl);
                data = response.data;
                nextUrl = response.nextUrl;
            }
            savedNextUrl = nextUrl;

            const repos = data.map(repo => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                url: repo.html_url,
                language: repo.language,
                updatedAt: repo.updated_at,
                isPrivate: repo.private,
                description: repo.description,
                owner: repo.owner.login,
                ownerAvatar: repo.owner.avatar_url
            }));

            allRepos.push(...repos);

            if (savedNextUrl && data && data.length === 100) {
                page++;
            } else {
                hasMore = false;
            }
        }

        return allRepos;
    },

    /**
     * Fetch organizations for the authenticated user.
     * @param {string} token
     * @returns {Promise<Array<{id: number, login: string, avatarUrl: string}>>}
     */
    async fetchUserOrgs(token) {
        const { data } = await this.request(token, '/user/orgs', { per_page: '100' });
        return data.map(org => ({
            id: org.id,
            login: org.login,
            avatarUrl: org.avatar_url
        }));
    },

    /**
     * Fetch repositories for a specific organization.
     */
    async fetchOrgRepos(token, orgLogin) {
        const allRepos = [];
        let page = 1;
        let savedNextUrl = null;

        let hasMore = true;

        while (hasMore) {
            let data, nextUrl;
            if (page === 1) {
                const response = await this.request(token, `/orgs/${orgLogin}/repos`, {
                    per_page: '100',
                    type: 'all',
                    sort: 'updated',
                    direction: 'desc',
                    page: page.toString()
                });
                data = response.data;
                nextUrl = response.nextUrl;
            } else {
                const response = await this.requestFullUrl(token, savedNextUrl);
                data = response.data;
                nextUrl = response.nextUrl;
            }
            savedNextUrl = nextUrl;

            const repos = data.map(repo => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                url: repo.html_url,
                language: repo.language,
                updatedAt: repo.updated_at,
                isPrivate: repo.private,
                description: repo.description,
                owner: repo.owner.login,
                ownerAvatar: repo.owner.avatar_url
            }));

            allRepos.push(...repos);

            if (savedNextUrl && data && data.length === 100) {
                page++;
            } else {
                hasMore = false;
            }
        }

        return allRepos;
    },

    /**
     * Toggles a star on a repository.
     */
    async toggleStar(token, fullName, isStarred) {
        const method = isStarred ? 'DELETE' : 'PUT';
        const response = await fetch(`${this.BASE_URL}/user/starred/${fullName}`, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!response.ok && response.status !== 204) {
            throw new Error(`Failed to toggle star: HTTP ${response.status}`);
        }
    },

    /**
     * Validate a GitHub PAT by fetching the authenticated user.
     * @param {string} token
     * @returns {Promise<{login: string, avatarUrl: string, name: string|null}>}
     */
    async validateToken(token) {
        const { data } = await this.request(token, '/user');
        return {
            login: data.login,
            avatarUrl: data.avatar_url,
            name: data.name
        };
    }
};

/**
 * Custom error class for GitHub API errors.
 */
class GitHubAPIError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'GitHubAPIError';
        this.status = status;
    }

    get isUnauthorized() {
        return this.status === 401;
    }

    get isForbidden() {
        return this.status === 403;
    }

    get isRateLimited() {
        return this.status === 403 && this.message.includes('rate limit');
    }

    get isNotFound() {
        return this.status === 404;
    }
}

export { GitHubAPI, GitHubAPIError };
