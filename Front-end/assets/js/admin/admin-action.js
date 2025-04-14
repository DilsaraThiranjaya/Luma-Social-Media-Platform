document.addEventListener('DOMContentLoaded', async () => {
    const LOGIN_URL = "/Luma-Social-Media-Platform/Front-end/pages/login.html";
    const BASE_URL = "http://localhost:8080/api/v1";
    let authData = JSON.parse(sessionStorage.getItem('authData'));

    // Auth handling utilities
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

    function isTokenExpired(token) {
        try {
            const { exp } = jwt_decode(token);
            return Date.now() >= exp * 1000;
        } catch (error) {
            return true;
        }
    }

    async function refreshAuthToken() {
        try {
            const response = await fetch(`${BASE_URL}/auth/refreshToken`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: authData.token })
            });

            if (!response.ok) throw new Error('Refresh failed');
            const { data } = await response.json();

            authData.token = data.token;
            sessionStorage.setItem('authData', JSON.stringify(authData));
            return data.token;
        } catch (error) {
            throw error;
        }
    }

    // Main initialization
    if (authData?.token) {
        try {
            if (isTokenExpired(authData.token)) await refreshAuthToken();
            initializeUI();
        } catch (error) {
            await handleAuthError("Session expired. Please log in again.");
        }
    } else {
        await handleAuthError("You need to log in to access this page.");
    }

    async function initializeUI() {
        const Toast = Swal.mixin({
            toast: true,
            position: "bottom-end",
            iconColor: "white",
            customClass: { popup: "colored-toast" },
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
        });

        try {
            await loadAdminActions();
            setupEventListeners();
        } catch (error) {
            Toast.fire({ icon: "error", title: error.message });
        }

        async function loadAdminActions(search = null) {
            try {
                const params = new URLSearchParams();
                if (search) params.append('search', search);

                const response = await fetch(`${BASE_URL}/admin-actions?${params}`, {
                    headers: { 'Authorization': `Bearer ${authData.token}` }
                });

                const result = await response.json();
                console.log('API Response:', result); // Debug log

                if (result.code !== 200) {
                    throw new Error(result.message || 'Failed to load actions');
                }

                if (!Array.isArray(result.data)) {
                    throw new Error('Invalid data format received');
                }

                displayActions(result.data);
            } catch (error) {
                console.error('Load actions error:', error);
                throw new Error('Failed to load actions. ' + (error.message || ''));
            }
        }

        function displayActions(actions) {
            const tbody = document.getElementById('historyTableBody');
            if (!tbody) {
                throw new Error('Table body element not found');
            }

            tbody.innerHTML = actions.map(action => `
                <tr>
                    <td>
                        <span class="action-badge ${getActionClass(action)}">
                            ${formatActionType(action.actionType)}
                        </span>
                    </td>
                    <td>${action.description || 'No description'}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${action.admin?.profilePictureUrl || '../../assets/image/Profile-picture.png'}" 
                                 class="rounded-circle me-2" 
                                 width="30" 
                                 height="30"
                                 onerror="this.src='../../assets/image/Profile-picture.png'">
                            ${action.admin?.firstName || 'Unknown'} ${action.admin?.lastName || ''}
                        </div>
                    </td>
                    <td>${getTargetDetails(action)}</td>
                    <td>${formatDate(action.performedAt)}</td>
                </tr>
            `).join('');
        }

        function getActionClass(action) {
            if (action.actionType.includes('USER')) return 'bg-action-user';
            if (action.actionType.includes('POST')) return 'bg-action-post';
            if (action.actionType.includes('ITEM')) return 'bg-action-item';
            return 'bg-action-report';
        }

        function formatActionType(type) {
            if (!type) return 'Unknown Action';
            return type.toLowerCase().replace(/_/g, ' ');
        }

        function getTargetDetails(action) {
            // Handle cases where target might be in description
            if (action.description) {
                if (action.description.includes('User')) return action.description.split('User')[1];
                if (action.description.includes('Post')) return action.description.split('Post')[1];
                if (action.description.includes('Item')) return action.description.split('Item')[1];
            }
            return 'System Action';
        }

        function formatDate(dateString) {
            if (!dateString) return 'N/A';
            try {
                const date = new Date(dateString);
                return date.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                console.error('Date formatting error:', e);
                return dateString; // Return raw string if formatting fails
            }
        }

        function setupEventListeners() {
            let searchTimeout;
            document.querySelector('.table-search')?.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    loadAdminActions(e.target.value).catch(error => {
                        Toast.fire({ icon: "error", title: error.message });
                    });
                }, 300);
            });
        }
    }
});