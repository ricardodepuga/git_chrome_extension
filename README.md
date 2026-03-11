# Git Repos Manager

A Chrome extension that allows you to quickly browse your GitHub repositories (personal or from organizations) and manage your favorites in a fast and intuitive way.

## 🌟 Features

- **Quick access to repositories:** View your private and organization repositories.
- **Favorites Management (Starred):** Add or remove stars from repositories directly in the extension. Starred repositories are highlighted for easy access.
- **Integrated search:** Quickly find any repository using the search bar (shortcut: `/`).
- **Organization Filter:** Choose to view only your personal repositories or those of a specific organization through the context menu.
- **Modern interface:** Fluid organization via tabs (Starred / All Repos).

## 🚀 How to Install and Configure

For the extension to work properly, you need to authenticate with your GitHub account using a **Personal Access Token (PAT)**.

### 1. Create a Personal Access Token on GitHub

You can choose between a **Classic Token** or a **Fine-grained Token** (recommended for better security).

#### Option A: Fine-grained Token (Recommended)

1. Log in to your [GitHub](https://github.com/) account.
2. Go to **Settings** > **Developer settings** (located at the bottom of the left sidebar).
3. In the sidebar, click on **Personal access tokens** and then choose **Fine-grained tokens**.
4. Click on **Generate new token**.
5. Give the token a name (e.g., *Git Repos Manager*).
6. Provide an expiration date of your choice.
7. Under **Resource owner**, select the account or organization you want to grant access to.
8. Under **Repository access**, select **All repositories** (so the extension can list them).
9. Under **Permissions**, expand the **Repository permissions** section and grant the following access:
   - **Contents:** Read-only (required to list your repositories)
   - **Metadata:** Read-only (required to get repository details)
   - **Starring:** Read and Write (required to view your starred repos and toggle stars via the extension)
10. Scroll to the bottom and click **Generate token**.
11. **Copy the generated token** and save it in a secure location.

#### Option B: Classic Token

1. Log in to your [GitHub](https://github.com/) account.
2. Go to **Settings** > **Developer settings**.
3. In the sidebar, click on **Personal access tokens** and then choose **Tokens (classic)**.
4. Click on **Generate new token** > **Generate new token (classic)**.
5. Give the token a name (e.g., *Git Repos Manager Classic*).
6. Under **scopes (permissions)**, you must check the **`repo`** option (Full control of private repositories). This permission covers what is necessary to view your private and organization repositories, as well as allowing you to add and remove stars.
7. Scroll to the bottom and click **Generate token**.
8. **Copy the generated token** and save it in a secure location.

### Troubleshooting: SAML SSO Error
If you receive the error `"Resource protected by organization SAML enforcement. You must grant your Personal Access token access to this organization"` when switching organizations:
1. Go to your [GitHub Tokens settings](https://github.com/settings/tokens).
2. Find the token you are using for the extension.
3. Click the **Configure SSO** drop-down menu next to the token.
4. Click **Authorize** next to the organization you want to access.
*(Note: Fine-grained tokens handle this during creation when you select the Resource owner).*

### 2. Configure the Extension

1. Install the extension in Google Chrome.
2. Pin the extension and click its icon in the top right corner of the browser.
3. In the setup screen that appears, enter your **Personal Access Token** in the indicated field.
4. Click the **Connect** button.

Once the connection is successful, the extension will automatically start listing your repositories and organizations!

## 🛠️ Details and Technologies

- The extension was developed in HTML, pure CSS, and pure JavaScript (Vanilla).
- Communication with GitHub is handled entirely via the GitHub REST API (using the local `patch_github_api.js` library).
- It is built on Google Chrome's Manifest V3.
- All data (such as the Access Token) is stored securely locally in the user's browser (via `chrome.storage.local`).

### Privacy and Permissions

**Why do we need the `storage` permission?**
The `storage` permission is strictly required to securely save your GitHub Personal Access Token (PAT) locally within your browser. When you connect your account, your token is saved using the `chrome.storage.local` API. This allows the extension to remember your authentication state, ensuring you don't have to re-enter your private token every time you open the extension popup. This data never leaves your device and is only ever used to authenticate your requests directly with the official GitHub API.

**Host Permissions Justification (`https://api.github.com/*`)**
The extension requires access to the official GitHub API (`https://api.github.com/*`) to function properly. This host permission allows the extension to fetch your user profile, list your private and organization repositories, and manage your starred projects directly from GitHub's servers. All communication happens securely over HTTPS, and the extension *only* interacts with this specific GitHub API endpoint. No data is ever sent to third-party servers, analytics services, or any other external domains.
