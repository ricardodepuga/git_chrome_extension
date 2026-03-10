export async function fetchStarredRepos(token) {
    const allRepos = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const { data, nextUrl } = page === 1
            ? await this.request(token, '/user/starred', {
                per_page: '100',
                page: page.toString()
            })
            : await this.requestFullUrl(token, nextUrl);

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

        if (nextUrl && data.length === 100) {
            page++;
        } else {
            hasMore = false;
        }
    }

    return allRepos;
}

export async function fetchUserOrgs(token) {
    const { data } = await this.request(token, '/user/orgs', { per_page: '100' });
    return data.map(org => ({
        id: org.id,
        login: org.login,
        avatarUrl: org.avatar_url
    }));
}

export async function fetchOrgRepos(token, orgLogin) {
    const allRepos = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const { data, nextUrl } = page === 1
            ? await this.request(token, `/orgs/${orgLogin}/repos`, {
                per_page: '100',
                type: 'all',
                sort: 'updated',
                direction: 'desc',
                page: page.toString()
            })
            : await this.requestFullUrl(token, nextUrl);

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

        if (nextUrl && data.length === 100) {
            page++;
        } else {
            hasMore = false;
        }
    }

    return allRepos;
}

export async function toggleStar(token, fullName, isStarred) {
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
}
