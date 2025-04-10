document.addEventListener('DOMContentLoaded', function() {
    const BASE_URL = "http://localhost:8080/api/v1";
    const authData = JSON.parse(sessionStorage.getItem('authData'));

    // Initialize the page
    loadUserStats();
    loadUsers();

    // Setup event listeners
    setupSearchListener();
    setupFilterListeners();
    setupStatusToggleListeners();

    // Load user statistics
    async function loadUserStats() {
        try {
            const response = await fetch(`${BASE_URL}/users/stats`, {
                headers: {
                    'Authorization': `Bearer ${authData.token}`
                }
            });
            const data = await response.json();

            if (data.code === 'OK') {
                updateStatsDisplay(data.content);
            }
        } catch (error) {
            throw error;
            showToast('Error loading user statistics', 'error');
        }
    }

// Update statistics display
    function updateStatsDisplay(stats) {
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('activeUsers').textContent = stats.activeUsers;
        document.getElementById('suspendedUsers').textContent = stats.suspendedUsers;
        document.getElementById('recentUsers').textContent = stats.recentUsers;
        document.getElementById('onlineUsers').textContent = stats.onlineUsers;
    }

// Load users with optional filters
    async function loadUsers(status = null, search = null) {
        try {
            let url = `${BASE_URL}/users`;
            const params = new URLSearchParams();

            if (status) params.append('status', status);
            if (search) params.append('search', search);

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${authData.token}`
                }
            });
            const data = await response.json();

            if (data.code === 'OK') {
                displayUsers(data.content);
            }
        } catch (error) {
            throw error;
            showToast('Error loading users', 'error');
        }
    }

// Display users in the table
    function displayUsers(users) {
        const tbody = document.querySelector('table tbody');
        tbody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.dataset.userId = user.userId;

            row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <img src="${user.profilePictureUrl || '../../assets/image/default-profile.jpg'}" 
                         alt="User" class="rounded-circle me-2" width="40">
                    <div>
                        <h6 class="mb-0">${user.firstName} ${user.lastName}</h6>
                        <small class="text-muted">@${user.email.split('@')[0]}</small>
                    </div>
                </div>
            </td>
            <td>${user.email}</td>
            <td><span class="badge ${user.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}">${user.status}</span></td>
            <td>${formatDate(user.createdAt)}</td>
            <td>${formatDate(user.lastLogin)}</td>
            <td>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-light" onclick="viewUserProfile(${user.userId})">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" 
                            onclick="toggleUserStatus(${user.userId}, '${user.status}')"
                            data-status="${user.status}">
                        <i class="bi bi-toggle-${user.status === 'ACTIVE' ? 'on' : 'off'}"></i>
                    </button>
                </div>
            </td>
        `;

            tbody.appendChild(row);
        });
    }

// Setup search functionality
    function setupSearchListener() {
        const searchInput = document.querySelector('.table-search');
        let debounceTimer;

        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                loadUsers(null, this.value);
            }, 300);
        });
    }

// Setup filter functionality
    function setupFilterListeners() {
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const status = this.textContent.trim() === 'All Users' ? null : this.textContent.trim().toUpperCase();
                loadUsers(status);
            });
        });
    }

    // Setup status toggle listeners
    function setupStatusToggleListeners() {
        document.addEventListener('click', async function(e) {
            if (e.target.closest('.status-toggle')) {
                const button = e.target.closest('.status-toggle');
                const userId = button.dataset.userId;
                const currentStatus = button.dataset.currentStatus;

                try {
                    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                    const response = await fetch(`${BASE_URL}/users/${userId}/status?status=${newStatus}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${authData.token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    const data = await response.json();

                    if (data.code === 'OK') {
                        showToast('User status updated successfully', 'success');
                        // Reload users and stats to reflect changes
                        loadUsers();
                        loadUserStats();
                    } else {
                        throw new Error(data.message || 'Failed to update user status');
                    }
                } catch (error) {
                    console.error('Error updating user status:', error);
                    showToast('Error updating user status', 'error');
                }
            }
        });
    }

// Toggle user status
    async function toggleUserStatus(userId, currentStatus) {
        try {
            const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

            const response = await fetch(`${BASE_URL}/users/${userId}/status?status=${newStatus}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authData.token}`
                }
            });

            const data = await response.json();

            if (data.code === 'OK') {
                showToast('User status updated successfully', 'success');
                loadUsers(); // Reload the users list
            }
        } catch (error) {
            throw error;
            showToast('Error updating user status', 'error');
        }
    }

// View user profile
    function viewUserProfile(userId) {
        // Implementation for viewing user profile in modal
        const modal = new bootstrap.Modal(document.getElementById('userProfileModal'));
        modal.show();
    }

// Utility functions
    function formatDate(dateString) {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 86400000) { // Less than 24 hours
            return `${Math.round(diff / 3600000)} hours ago`;
        } else if (diff < 2592000000) { // Less than 30 days
            return `${Math.round(diff / 86400000)} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    function showToast(message, type = 'success') {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';

        toastContainer.innerHTML = `
        <div class="toast" role="alert">
            <div class="toast-body bg-${type} text-white">
                ${message}
            </div>
        </div>
    `;

        document.body.appendChild(toastContainer);
        const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'));
        toast.show();

        toastContainer.addEventListener('hidden.bs.toast', () => {
            toastContainer.remove();
        });
    }
});
