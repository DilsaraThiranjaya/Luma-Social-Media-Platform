document.addEventListener('DOMContentLoaded', async () => {
    const LOGIN_URL = "/Luma-Social-Media-Platform/Front-end/pages/login.html";
    const BASE_URL = "http://localhost:8080/api/v1";

    const handleAuthError = async (message) => {
        await Swal.fire({
            title: "Access Denied!",
            text: message,
            icon: "error",
            draggable: false
        });
        sessionStorage.removeItem('authData');
        window.location.href = LOGIN_URL;
    };

    const authData = JSON.parse(sessionStorage.getItem('authData'));

    function isTokenExpired(token) {
        try {
            const {exp} = jwt_decode(token);
            return Date.now() >= exp * 1000; // Correct if `exp` is in seconds
        } catch (error) {
            return true; // Treat invalid tokens as expired
        }
    }

    function getRoleFromToken(token) {
        try {
            const decoded = jwt_decode(token);

            // Check different possible claim names for role
            return decoded.role ||
                decoded.roles?.[0] || // if it's an array
                decoded.authorities?.[0]?.replace('ROLE_', '') || // Spring format
                null;
        } catch (error) {
            throw error;
        }
    }

    if (authData?.token) {
        try {
            // Check token expiration first
            if (isTokenExpired(authData.token)) {
                await refreshAuthToken();
            }
            initializeUI();
            initializeRoleBasedAccess(getRoleFromToken(authData.token));
            initializeLogout();
        } catch (error) {
            await handleAuthError("Session expired. Please log in again.");
        }
    } else {
        await handleAuthError("You need to log in to access this page.");
    }

    async function refreshAuthToken() {
        try {
            const authData = JSON.parse(sessionStorage.getItem('authData'));

            // Send refreshToken in the request body
            const response = await fetch(`${BASE_URL}/auth/refreshToken`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // Required for JSON body
                },
                body: JSON.stringify({
                    refreshToken: authData.token // Use the token from storage
                })
            });

            if (!response.ok) throw new Error('Refresh failed');

            // Parse the response and extract the new access token from data
            const responseData = await response.json();
            const newAccessToken = responseData.data.token;

            // Update the stored access token
            const newAuthData = {...authData, token: newAccessToken};
            sessionStorage.setItem('authData', JSON.stringify(newAuthData));

            return newAccessToken;
        } catch (error) {
            throw error;
        }
    }

    function initializeRoleBasedAccess(roleFromToken) {
        if (roleFromToken !== 'ADMIN') {
            document.getElementById('adminButton').classList.add('d-none');
            document.getElementById('adminPushNotificationsTitle').classList.add('d-none');
            document.getElementById('adminPushNotificationsItem').classList.add('d-none');
        }
    }

    function initializeLogout() {
        const logoutButton = document.getElementById('logoutButton');
        logoutButton.addEventListener('click', async () => {
            try {
                sessionStorage.removeItem('authData');
                window.location.href = LOGIN_URL;
            } catch (error) {
                Toast.fire({
                    icon: "error",
                    title: "Logout Failed",
                    text: error.message
                });
            }
        });
    }
});