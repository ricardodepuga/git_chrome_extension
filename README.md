# Git Repos Browser

A Chrome extension that allows you to quickly browse your GitHub repositories (personal or from organizations) and manage your favorites in a fast and intuitive way.

## 🌟 Features

- **Quick access to repositories:** View your private and organization repositories.
- **Favorites Management (Starred):** Add or remove stars from repositories directly in the extension. Starred repositories are highlighted for easy access.
- **Integrated search:** Quickly find any repository using the search bar (shortcut: `/`).
- **Organization Filter:** Choose to view only your personal repositories or those of a specific organization through the context menu.
- **Modern interface:** Fluid organization via tabs (Starred / All Repos).

## 🚀 How to Install and Configure

For the extension to work properly, you need to authenticate with your GitHub account. We support two methods: **Login with GitHub (Device Flow)** as the primary, and **Personal Access Token (PAT)** as a fallback.

### Option A: Login with GitHub (Recommended)

This is the easiest and most secure method, utilizing GitHub's **Device Flow** to skip the manual creation of tokens.

1. Keep the extension's setup window open.
2. Click **"Log in with GitHub"**. 
3. The extension will generate and show you an 8-character **User Code**.
4. Click the button to copy the code and open GitHub's authorization page in a new tab.
5. Paste the code, approve the extension in GitHub's window, and return! The extension will automatically detect that you have logged in.
*(Note: Since you must configure your OAuth Client ID within the codebase before running `utils/config.js`, this functionality requires the extension owner to set up the `OAUTH_CLIENT_ID` before distributing).*

### Option B: Personal Access Token (Advanced)

If you prefer more granular control or are experiencing issues with the Oauth login, you can provide a PAT.

1. Log in to your [GitHub](https://github.com/) account.
2. Go to **Settings** > **Developer settings** > **Personal access tokens** (either Fine-grained or Classic).
3. If Classic, check the **`repo`** scope. If Fine-grained, ensure **Contents**, **Metadata**, and **Starring** (Read & Write) access.
4. Open the extension, click **"Advanced: Use Personal Access Token"**.
5. Paste the token and click **Connect**.

### Troubleshooting: SAML SSO Error
If you receive the error `"Resource protected by organization SAML enforcement"` when switching organizations using a PAT:
1. Go to your [GitHub Tokens settings](https://github.com/settings/tokens).
2. Click the **Configure SSO** drop-down menu next to the token and click **Authorize**.

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
