// Posts Management JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const BASE_URL = "http://localhost:8080/api/v1";
    const authData = JSON.parse(sessionStorage.getItem('authData'));

    // Initialize the page
    loadPostStats();
    loadPosts();

    // Setup event listeners
    setupSearchListener();
    setupFilterListeners();
    setupChartUpdates();

    // Load post statistics
    async function loadPostStats() {
        try {
            const response = await fetch(`${BASE_URL}/posts/stats`, {
                headers: {
                    'Authorization': `Bearer ${authData.token}`
                }
            });
            const data = await response.json();

            if (data.code === 'OK') {
                updateStatsDisplay(data.content);
                updatePostsChart(data.content);
            }
        } catch (error) {
            throw error;
            showToast('Error loading post statistics', 'error');
        }
    }

// Update statistics display
    function updateStatsDisplay(stats) {
        // Update post type distribution
        const totalPosts = stats.totalPosts;
        const imagePercentage = (stats.imagePosts / totalPosts * 100).toFixed(0);
        const videoPercentage = (stats.videoPosts / totalPosts * 100).toFixed(0);
        const textPercentage = (100 - imagePercentage - videoPercentage).toFixed(0);

        document.querySelector('[data-stat="photos"]').textContent = `${imagePercentage}%`;
        document.querySelector('[data-stat="videos"]').textContent = `${videoPercentage}%`;
        document.querySelector('[data-stat="text"]').textContent = `${textPercentage}%`;

        // Update progress bars
        document.querySelector('.progress-bar[data-type="photos"]').style.width = `${imagePercentage}%`;
        document.querySelector('.progress-bar[data-type="videos"]').style.width = `${videoPercentage}%`;
        document.querySelector('.progress-bar[data-type="text"]').style.width = `${textPercentage}%`;
    }

// Load posts with optional filters
    async function loadPosts(status = null, type = null, search = null) {
        try {
            let url = `${BASE_URL}/posts`;
            const params = new URLSearchParams();

            if (status) params.append('status', status);
            if (type) params.append('type', type);
            if (search) params.append('search', search);

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await fetch(url , {
                headers: {
                    'Authorization': `Bearer ${authData.token}`
                }
            });
            const data = await response.json();

            if (data.code === 'OK') {
                displayPosts(data.content);
            }
        } catch (error) {
            throw error;
            showToast('Error loading posts', 'error');
        }
    }

// Display posts in the table
    function displayPosts(posts) {
        const tbody = document.querySelector('table tbody');
        tbody.innerHTML = '';

        posts.forEach(post => {
            const row = document.createElement('tr');
            row.dataset.postId = post.postId;

            const mediaPreview = post.media.length > 0
                ? `<img src="${post.media[0].mediaUrl}" alt="Post" class="rounded me-2" width="40" height="40" style="object-fit: cover;">`
                : '<i class="bi bi-file-text me-2"></i>';

            row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    ${mediaPreview}
                    <div>
                        <h6 class="mb-0">${truncateText(post.content, 50)}</h6>
                        <small class="text-muted">${post.media.length > 0 ? post.media[0].mediaType : 'Text Post'}</small>
                    </div>
                </div>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${post.user.profilePictureUrl || '../../assets/image/default-profile.jpg'}" 
                         alt="User" class="rounded-circle me-2" width="30">
                    <span>${post.user.firstName} ${post.user.lastName}</span>
                </div>
            </td>
            <td><span class="badge bg-${post.media.length > 0 ? 'primary' : 'info'}">${post.media.length > 0 ? post.media[0].mediaType : 'TEXT'}</span></td>
            <td>
                <div class="d-flex align-items-center">
                    <i class="bi bi-heart-fill text-danger me-1"></i> ${post.reactions.length}
                    <i class="bi bi-chat-fill text-primary ms-2 me-1"></i> ${post.comments.length}
                </div>
            </td>
            <td><span class="badge bg-${post.status === 'ACTIVE' ? 'success' : 'danger'}">${post.status}</span></td>
            <td>${formatDate(post.createdAt)}</td>
            <td>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-light" onclick="viewPost(${post.postId})">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" 
                            onclick="togglePostStatus(${post.postId}, '${post.status}')"
                            data-status="${post.status}">
                        <i class="bi bi-toggle-${post.status === 'ACTIVE' ? 'on' : 'off'}"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deletePost(${post.postId})">
                        <i class="bi bi-trash"></i>
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
                loadPosts(null, null, this.value);
            }, 300);
        });
    }

// Setup filter functionality
    function setupFilterListeners() {
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const filterType = this.getAttribute('data-filter');
                const filterValue = this.getAttribute('data-value');
                loadPosts(filterType === 'status' ? filterValue : null,
                    filterType === 'type' ? filterValue : null);
            });
        });
    }

// Toggle post status
    async function togglePostStatus(postId, currentStatus) {
        try {
            const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

            const response = await fetch(`${BASE_URL}/posts/${postId}/status?status=${newStatus}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authData.token}`
                }
            });

            const data = await response.json();

            if (data.code === 'OK') {
                showToast('Post status updated successfully', 'success');
                loadPosts();
                loadPostStats();
            }
        } catch (error) {
            throw error;
            showToast('Error updating post status', 'error');
        }
    }

// Delete post
    async function deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await fetch(`${BASE_URL}/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authData.token}`
                }
            });

            const data = await response.json();

            if (data.code === 'OK') {
                showToast('Post deleted successfully', 'success');
                loadPosts();
                loadPostStats();
            }
        } catch (error) {
            throw error;
            showToast('Error deleting post', 'error');
        }
    }

// View post details
    function viewPost(postId) {
        const modal = new bootstrap.Modal(document.getElementById('postViewModal'));
        modal.show();
    }

// Setup chart updates
    function setupChartUpdates() {
        const postsAnalyticsChart = new Chart(
            document.getElementById('postsAnalyticsChart'),
            {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Posts',
                        data: [0, 0, 0, 0, 0, 0, 0],
                        backgroundColor: '#600097'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );

        // Update chart data periodically
        setInterval(() => {
            updatePostsChart(postsAnalyticsChart);
        }, 300000); // Update every 5 minutes
    }

// Update posts chart
    function updatePostsChart(chart) {
        // Simulate real data - in production, this would come from the backend
        const newData = Array(7).fill(0).map(() => Math.floor(Math.random() * 50) + 10);
        chart.data.datasets[0].data = newData;
        chart.update();
    }

// Utility functions
    function truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    function formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 3600000) { // Less than 1 hour
            return `${Math.floor(diff / 60000)} minutes ago`;
        } else if (diff < 86400000) { // Less than 24 hours
            return `${Math.floor(diff / 3600000)} hours ago`;
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