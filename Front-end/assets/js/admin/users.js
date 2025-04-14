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
            const {exp} = jwt_decode(token);
            return Date.now() >= exp * 1000;
        } catch (error) {
            return true;
        }
    }

    async function refreshAuthToken() {
        try {
            const response = await fetch(`${BASE_URL}/auth/refreshToken`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({refreshToken: authData.token})
            });

            if (!response.ok) throw new Error('Refresh failed');
            const {data} = await response.json();

            authData.token = data.token;
            sessionStorage.setItem('authData', JSON.stringify(authData));
            return data.token;
        } catch (error) {

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
            customClass: {popup: "colored-toast"},
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
        });

        try {
            await loadUserStats();
            await loadUsers();
            setupEventListeners();
        } catch (error) {
            Toast.fire({icon: "error", title: error.message});
        }

        async function loadUserStats() {
            try {
                const response = await fetch(`${BASE_URL}/users/stats`, {
                    headers: {'Authorization': `Bearer ${authData.token}`}
                });
                const {code, data, message} = await response.json();

                if (code !== 200) throw new Error(message);
                updateStatsDisplay(data);
            } catch (error) {
                throw error;
            }
        }

        function updateStatsDisplay(stats) {
            document.getElementById('totalUsers').textContent = stats.totalUsers;
            document.getElementById('activeUsers').textContent = stats.activeUsers;
            document.getElementById('suspendedUsers').textContent = stats.suspendedUsers;
            document.getElementById('recentUsers').textContent = stats.recentUsers;
            // document.getElementById('onlineUsers').textContent = stats.onlineUsers;
        }

        async function loadUsers(status = null, search = null) {
            try {
                const params = new URLSearchParams();
                if (status) params.append('status', status);
                if (search) params.append('search', search);

                const response = await fetch(`${BASE_URL}/users?${params}`, {
                    headers: {'Authorization': `Bearer ${authData.token}`}
                });
                const {code, data: users, message} = await response.json();

                if (code !== 200) throw new Error(message);
                displayUsers(users);
            } catch (error) {
                throw error;
            }
        }

        function displayUsers(users) {
            const tbody = document.querySelector('table tbody');
            tbody.innerHTML = users.map(user => {
                // Format dates
                const joinDate = formatDate(user.createdAt);
                const lastActive = user.lastLogin ? formatDate(user.lastLogin) : 'Never';

                // Determine if current user is viewing their own row
                const isCurrentUser = user.email === authData.email;

                // Status badge with better visual hierarchy
                const statusBadgeClass = user.status === 'ACTIVE'
                    ? 'bg-success'
                    : 'bg-danger';

                return `
        <tr data-user-id="${user.userId}" class="${isCurrentUser ? 'current-user' : ''}">
            <td>
                <div class="d-flex align-items-center">
                    <img src="${user.profilePictureUrl || '../../assets/image/Profile-picture.png'}" 
                         alt="${user.firstName} ${user.lastName}" 
                         class="rounded-circle me-2" 
                         width="40"
                         height="40"
                         onerror="this.src='../../assets/image/Profile-picture.png'">
                    <div>
                        <h6 class="mb-0">${user.firstName} ${user.lastName}</h6>
                        <small class="text-muted">@${user.username || user.email.split('@')[0]}</small>
                    </div>
                </div>
            </td>
            <td class="text-truncate" style="max-width: 200px;" title="${user.email}">
                ${user.email}
            </td>
            <td>
                <span class="badge ${statusBadgeClass} rounded-pill" style="min-width: 100px;">
                    ${user.status}
                </span>
            </td>
            <td>
                <div class="d-flex flex-column">
                    <span>${joinDate}</span>
                </div>
            </td>
            <td>
                <div class="d-flex flex-column">
                    <span>${lastActive.date || lastActive}</span>
                    ${lastActive.time ? `<small class="text-muted">${lastActive.time}</small>` : ''}
                </div>
            </td>
            <td>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-light view-profile" 
                            data-user-id="${user.userId}"
                            data-user-email="${user.email}"
                            title="View Profile">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${!isCurrentUser ? `
                    <button class="btn btn-sm ${user.status === 'ACTIVE' ? 'btn-warning' : 'btn-secondary'} status-toggle" 
                            data-user-id="${user.userId}"
                            data-current-status="${user.status}"
                            title="${user.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}">
                        <i class="bi bi-toggle-${user.status === 'ACTIVE' ? 'on' : 'off'}"></i>
                    </button>` : ''}
                </div>
            </td>
        </tr>
    `;
            }).join('');

            // Add event listeners after rendering
            document.querySelectorAll('.view-profile').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const userId = e.currentTarget.dataset.userId;
                    const email = e.currentTarget.dataset.userEmail;
                    viewUserProfile(userId, email);
                });
            });
        }

        function setupEventListeners() {
            // Search functionality
            let searchTimeout;
            document.querySelector('.table-search').addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    loadUsers(null, e.target.value);
                }, 300);
            });

            // Filter functionality
            document.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const status = e.target.textContent === 'All Users'
                        ? null
                        : e.target.textContent.toUpperCase().replace(' ', '_');
                    loadUsers(status);
                });
            });

            // Status toggle
            document.addEventListener('click', async (e) => {
                if (e.target.closest('.status-toggle')) {
                    const button = e.target.closest('.status-toggle');
                    const userId = button.dataset.userId;
                    const currentStatus = button.dataset.currentStatus;
                    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

                    try {
                        const response = await fetch(`${BASE_URL}/users/${userId}/status?status=${newStatus}`, {
                            method: 'PUT',
                            headers: {'Authorization': `Bearer ${authData.token}`}
                        });
                        const {code, message} = await response.json();

                        if (code === 200) {
                            button.dataset.currentStatus = newStatus;
                            button.innerHTML = `
        <i class="bi bi-toggle-${newStatus === 'ACTIVE' ? 'on' : 'off'}"></i>
    `;
                            button.className = `btn btn-sm ${newStatus === 'ACTIVE' ? 'btn-warning' : 'btn-secondary'} status-toggle`;
                            button.title = newStatus === 'ACTIVE' ? 'Suspend User' : 'Activate User';

                            // Update status badge with new styling
                            const badge = button.closest('tr').querySelector('.badge');
                            badge.className = `badge ${newStatus === 'ACTIVE' ? 'bg-success' : 'bg-danger'} rounded-pill`;
                            badge.innerHTML = `
        ${newStatus}
    `;
                            await loadUserStats();
                        } else {
                            throw new Error(message);
                        }
                    } catch (error) {
                        throw error;
                    }
                }
            });

            // Sidebar toggle
            document.querySelector('.toggle-sidebar').addEventListener('click', () => {
                document.querySelector('.admin-sidebar').classList.toggle('show');
                document.querySelector('.admin-main').classList.toggle('sidebar-hidden');
            });
        }

        // Utility functions
        function formatDate(dateString) {
            if (!dateString) return 'Never';
            const date = new Date(dateString);
            const options = {year: 'numeric', month: 'short', day: 'numeric'};
            return date.toLocaleDateString('en-US', options);
        }

        window.viewUserProfile = (userId, email) => {
            if (email === authData.email) {
                window.location.href = '../profile.html';
            }
            window.location.href = `../profile-view.html?id=${userId}`;
        };
    }
});