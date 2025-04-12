document.addEventListener('DOMContentLoaded', async () => {
    const LOGIN_URL = "/Luma-Social-Media-Platform/Front-end/pages/login.html";
    const BASE_URL = "http://localhost:8080/api/v1";
    let authData = JSON.parse(sessionStorage.getItem('authData'));
    let postsAnalyticsChart;

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
            await loadPostStats();
            await loadPosts();
            await loadPostAnalytics();
            setupEventListeners();
        } catch (error) {
            Toast.fire({ icon: "error", title: error.message });
        }

        async function loadPostStats() {
            try {
                const response = await fetch(`${BASE_URL}/posts/stats`, {
                    headers: { 'Authorization': `Bearer ${authData.token}` }
                });
                const { code, data, message } = await response.json();

                if (code !== 200) throw new Error(message);
                updateStatsDisplay(data);
                updatePostsChart(data);
            } catch (error) {
                throw error;
            }
        }

        function updateStatsDisplay(stats) {
            // Update post type distribution
            const totalPosts = stats.totalPosts;
            const imagePercentage = (stats.imagePosts / totalPosts * 100).toFixed(0);
            const videoPercentage = (stats.videoPosts / totalPosts * 100).toFixed(0);
            const textPercentage = (100 - imagePercentage - videoPercentage).toFixed(0);

            document.querySelector('[data-stat="photos"]').textContent = `${imagePercentage}%`;
            document.querySelector('[data-stat="videos"]').textContent = `${videoPercentage}%`;
            // document.querySelector('[data-stat="text"]').textContent = `${textPercentage}%`;

            // Update progress bars
            document.querySelector('.progress-bar[data-type="photos"]').style.width = `${imagePercentage}%`;
            document.querySelector('.progress-bar[data-type="videos"]').style.width = `${videoPercentage}%`;
            // document.querySelector('.progress-bar[data-type="text"]').style.width = `${textPercentage}%`;
        }

        function updatePostsChart(analytics) {
            const ctx = document.getElementById('postsAnalyticsChart');

            if (!ctx) return;

            // Destroy existing chart if it exists
            if (window.postsChart) {
                window.postsChart.destroy();
            }

            window.postsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: analytics.labels,
                    datasets: [{
                        label: 'Posts',
                        data: analytics.data,
                        backgroundColor: '#600097',
                        borderColor: '#600097',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }

        async function loadPosts(status = null, type = null, search = null) {
            try {
                const params = new URLSearchParams();
                if (status) params.append('status', status);
                if (type) params.append('type', type);
                if (search) params.append('search', search);

                const response = await fetch(`${BASE_URL}/posts?${params}`, {
                    headers: { 'Authorization': `Bearer ${authData.token}` }
                });
                const { code, data: posts, message } = await response.json();

                if (code !== 200) throw new Error(message);
                displayPosts(posts);
            } catch (error) {
                throw new Error('Failed to load posts');
            }
        }

        function displayPosts(posts) {
            const tbody = document.querySelector('table tbody');
            tbody.innerHTML = posts.map(post => {
                const mediaPreview = post.media.length > 0
                    ? post.media[0].mediaType === 'IMAGE'
                        ? `<img src="${post.media[0].mediaUrl}" alt="Post media" 
             class="rounded me-2" width="40" height="40" 
             style="object-fit: cover;"
             onerror="this.src='../../assets/image/default-media.jpg'">`
                        : '<i class="bi bi-camera-video me-2 fs-1"></i>'
                    : '<i class="bi bi-file-text me-2 fs-1"></i>';

                return `
                    <tr data-post-id="${post.postId}">
                        <td>
                            <div class="d-flex align-items-center">
                                ${mediaPreview}
                                <div>
                                    <h6 class="mb-0 small">${truncateText(post.content, 50)}</h6>
                                    <small class="text-muted">${postTypeLabel(post)}</small>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="d-flex align-items-center">
                                <img src="${post.user.profilePictureUrl || '../../assets/image/Profile-picture.png'}" 
                                     alt="${post.user.firstName} ${post.user.lastName}" 
                                     class="rounded-circle me-2" width="30" height="30">
                                <span>${post.user.firstName} ${post.user.lastName}</span>
                            </div>
                        </td>
                        <td>
                            <span class="badge ${postTypeBadgeClass(post)}">
                                ${postTypeLabel(post)}
                            </span>
                        </td>
                        <td>
                            <div class="d-flex align-items-center">
                                <i class="bi bi-heart-fill text-danger me-1"></i> ${post.reactions.length}
                                <i class="bi bi-chat-fill text-primary ms-2 me-1"></i> ${post.comments.length}
                            </div>
                        </td>
                        <td>
                            <span class="badge status-badge ${post.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'} rounded-pill" style="min-width: 100px">
                                ${post.status}
                            </span>
                        </td>
                        <td>${formatDate(post.createdAt)}</td>
                        <td>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-light view-post" 
                                        data-post-id="${post.postId}"
                                        title="View Post">
                                    <i class="bi bi-eye"></i>
                                </button>
                                ${post.user.email !== authData.email ? `
                                <button class="btn btn-sm ${post.status === 'ACTIVE' ? 'btn-warning' : 'btn-secondary'} toggle-post-status" 
                                        data-post-id="${post.postId}"
                                        data-current-status="${post.status}"
                                        title="${post.status === 'ACTIVE' ? 'Deactivate Post' : 'Activate Post'}">
                                    <i class="bi bi-toggle-${post.status === 'ACTIVE' ? 'on' : 'off'}"></i>
                                </button>
                                <button class="btn btn-sm btn-danger delete-post" 
                                        data-post-id="${post.postId}"
                                        title="Delete Post">
                                    <i class="bi bi-trash"></i>
                                </button>` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Load post analytics
        async function loadPostAnalytics() {
            try {
                const response = await fetch(`${BASE_URL}/posts/analytics`, {
                    headers: { 'Authorization': `Bearer ${authData.token}` }
                });
                const data = await response.json();

                if (data.code === 200) {
                    updatePostsChart(data.data);
                }
            } catch (error) {
                throw error;
            }
        }

        function setupEventListeners() {
            // Search functionality
            let searchTimeout;
            document.querySelector('.table-search').addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    loadPosts(null, null, e.target.value);
                }, 300);
            });

            // Filter functionality
            document.querySelectorAll('.dropdown-item[data-filter]').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const filterType = e.currentTarget.getAttribute('data-filter');
                    const filterValue = e.currentTarget.getAttribute('data-value');
                    loadPosts(filterType === 'status' ? filterValue : null,
                        filterType === 'type' ? filterValue : null);
                });
            });

            // Post actions
            document.addEventListener('click', async (e) => {
                if (e.target.closest('.view-post')) {
                    const postId = e.target.closest('.view-post').dataset.postId;
                    viewPostDetails(postId);
                }
                else if (e.target.closest('.toggle-post-status')) {
                    const button = e.target.closest('.toggle-post-status');
                    const postId = button.dataset.postId;
                    const currentStatus = button.dataset.currentStatus;
                    await togglePostStatus(postId, currentStatus);
                }
                else if (e.target.closest('.delete-post')) {
                    const postId = e.target.closest('.delete-post').dataset.postId;
                    await deletePost(postId);
                }
            });

            // Sidebar toggle
            document.querySelector('.toggle-sidebar').addEventListener('click', () => {
                document.querySelector('.admin-sidebar').classList.toggle('show');
                document.querySelector('.admin-main').classList.toggle('sidebar-hidden');
            });
        }

        async function togglePostStatus(postId, currentStatus) {
            try {
                const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                const response = await fetch(`${BASE_URL}/posts/${postId}/status?status=${newStatus}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${authData.token}` }
                });
                const { code, message } = await response.json();

                if (code === 200) {
                    // Update UI immediately
                    const row = document.querySelector(`tr[data-post-id="${postId}"]`);
                    if (row) {
                        const badge = row.querySelector('.status-badge');
                        const button = row.querySelector('.toggle-post-status');

                        badge.className = newStatus === 'ACTIVE'
                            ? 'badge bg-success rounded-pill'
                            : 'badge bg-danger rounded-pill';
                        badge.textContent = newStatus;

                        button.dataset.currentStatus = newStatus;
                        button.innerHTML = `<i class="bi bi-toggle-${newStatus === 'ACTIVE' ? 'on' : 'off'}"></i>`;
                        button.className = `btn btn-sm ${newStatus === 'ACTIVE' ? 'btn-warning' : 'btn-secondary'} toggle-post-status`;
                        button.title = newStatus === 'ACTIVE' ? 'Deactivate Post' : 'Activate Post';
                    }
                    await loadPostStats();
                } else {
                    throw new Error(message);
                }
            } catch (error) {
                Toast.fire({ icon: "error", title: error.message });
            }
        }

        async function deletePost(postId) {
            try {
                const { isConfirmed } = await Swal.fire({
                    title: 'Delete Post?',
                    text: "You won't be able to revert this!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Yes, delete it!'
                });

                if (!isConfirmed) return;

                const response = await fetch(`${BASE_URL}/posts/${postId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${authData.token}` }
                });
                const { code, message } = await response.json();

                if (code === 200) {
                    await loadPosts();
                    await loadPostStats();
                } else {
                    throw new Error(message);
                }
            } catch (error) {
                Toast.fire({ icon: "error", title: error.message });
            }
        }

        async function viewPostDetails(postId) {
            try {
                const response = await fetch(`${BASE_URL}/profile/posts/${postId}`, {
                    headers: { 'Authorization': `Bearer ${authData.token}` }
                });
                const { code, data: post, message } = await response.json();

                if (code !== 200) throw new Error(message);

                // Populate modal
                const modal = new bootstrap.Modal(document.getElementById('postViewModal'));

                // Author Info
                document.getElementById('postAuthorImg').src = post.user.profilePictureUrl || '../../assets/image/Profile-picture.png';
                document.getElementById('postAuthorName').textContent =
                    `${post.user.firstName} ${post.user.lastName}`;
                document.getElementById('postDate').textContent = formatDate(post.createdAt);

                // Privacy
                const privacyIcon = document.getElementById('privacyIcon');
                const privacyText = document.getElementById('privacyText');
                const privacyConfig = {
                    PUBLIC: { icon: 'bi-globe', text: 'Public' },
                    FRIENDS: { icon: 'bi-people-fill', text: 'Friends' },
                    PRIVATE: { icon: 'bi-lock-fill', text: 'Only Me' }
                };
                const privacy = privacyConfig[post.privacy] || privacyConfig.PUBLIC;
                privacyIcon.className = privacy.icon;
                privacyText.textContent = privacy.text;

                // Content
                document.getElementById('postContent').textContent = post.content;

                // Media
                const mediaContainer = document.getElementById('postMedia');
                mediaContainer.innerHTML = post.media.map(media => {
                    if (media.mediaType === 'IMAGE') {
                        return `<img src="${media.mediaUrl}" class="img-fluid rounded mb-2" 
                          alt="Post media" style="max-height: 400px; object-fit: contain">`;
                    }
                    if (media.mediaType === 'VIDEO') {
                        return `<video controls class="w-100 rounded mb-2" style="max-height: 400px">
                          <source src="${media.mediaUrl}" type="video/mp4">
                        </video>`;
                    }
                    return '';
                }).join('');

                // Reactions
                const reactionsContainer = document.getElementById('postReactions');
                const groupedReactions = post.reactions.reduce((acc, reaction) => {
                    acc[reaction.type] = (acc[reaction.type] || 0) + 1;
                    return acc;
                }, {});

                reactionsContainer.innerHTML = Object.entries(groupedReactions)
                    .map(([type, count]) => `
                <span class="me-3">
                    <i class="bi ${REACTION_TYPES[type].fillIcon} ${REACTION_TYPES[type].color}"></i>
                    ${count}
                </span>
            `).join('');

                // Comments
                const commentsList = document.getElementById('commentsList');
                commentsList.innerHTML = post.comments.length > 0
                    ? post.comments.map(comment => `
                <div class="comment-item mb-3">
                    <div class="d-flex align-items-start">
                        <img src="${comment.user.profilePictureUrl || '../../assets/image/default-profile.jpg'}" 
                             class="rounded-circle me-2" width="30" height="30">
                        <div class="flex-grow-1">
                            <div class="comment-header">
                                <strong>${comment.user.firstName} ${comment.user.lastName}</strong>
                                <small class="text-muted ms-2">${formatDate(comment.createdAt)}</small>
                            </div>
                            <div class="comment-text">${comment.content}</div>
                        </div>
                    </div>
                </div>
            `).join('')
                    : '<div class="text-center text-muted">No comments yet</div>';

                document.getElementById('commentCount').innerHTML = `<i class="bi bi-chat-fill text-primary"></i> ${post.comments.length}`;
                modal.show();

            } catch (error) {
                Toast.fire({ icon: "error", title: error.message });
            }
        }

        const REACTION_TYPES = {
            LIKE: { fillIcon: 'bi-hand-thumbs-up-fill', color: 'text-primary' },
            LOVE: { fillIcon: 'bi-heart-fill', color: 'text-danger' },
            HAHA: { fillIcon: 'bi-emoji-laughing-fill', color: 'text-warning' },
            WOW: { fillIcon: 'bi-emoji-surprise-fill', color: 'text-info' },
            SAD: { fillIcon: 'bi-emoji-frown-fill', color: 'text-secondary' },
            ANGRY: { fillIcon: 'bi-emoji-angry-fill', color: 'text-danger' }
        };

        // Utility functions
        function truncateText(text, maxLength) {
            if (!text) return '';
            return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
        }

        function formatDate(dateString) {
            if (!dateString) return 'Unknown';
            const date = new Date(dateString);
            const options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            return date.toLocaleDateString('en-US', options);
        }

        function postTypeLabel(post) {
            if (post.media.length === 0) return 'Text Post';
            const type = post.media[0].mediaType;
            return type === 'IMAGE' ? 'Photo' :
                type === 'VIDEO' ? 'Video' :
                    type.charAt(0) + type.slice(1).toLowerCase();
        }

        function postTypeBadgeClass(post) {
            if (post.media.length === 0) return 'bg-info-light text-info';
            const type = post.media[0].mediaType;
            return type === 'IMAGE' ? 'bg-primary-light text-primary' :
                type === 'VIDEO' ? 'bg-warning-light text-warning' :
                    'bg-secondary-light text-secondary';
        }
    }
});