export const OAuthDeviceFlow = {
    /**
     * Step 1: Request Device and User codes from GitHub.
     * @param {string} clientId The OAuth App Client ID
     * @returns {Promise<Object>} { device_code, user_code, verification_uri, expires_in, interval }
     */
    async requestDeviceCode(clientId) {
        const response = await fetch('https://github.com/login/device/code', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                scope: 'repo'
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to request device code HTTP ${response.status}`);
        }

        return await response.json();
    },

    /**
     * Step 2: Poll for the Access Token (this should be called repeatedly based on the interval).
     * @param {string} clientId - The OAuth App Client ID
     * @param {string} deviceCode - The device_code received from requestDeviceCode
     * @returns {Promise<Object>} { isPending: boolean, token: string|null, error: string|null }
     */
    async pollAccessToken(clientId, deviceCode) {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                device_code: deviceCode,
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to poll access token HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // This GitHub endpoint returns 200 OK even for pending states, but includes an 'error' field.
        if (data.error) {
            if (data.error === 'authorization_pending' || data.error === 'slow_down') {
                return { isPending: true, data };
            }
            throw new Error(data.error_description || data.error);
        }

        return { isPending: false, token: data.access_token };
    }
};
