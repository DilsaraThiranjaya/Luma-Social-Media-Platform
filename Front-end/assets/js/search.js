document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const searchIcon = document.querySelector('.search-icon');
    const searchOverlay = document.querySelector('.search-overlay');
    const closeBtn = document.querySelector('.btn-close-search');
    const fullSearchInput = document.getElementById('fullSearchInput');
    const resultsContainer = document.querySelector('.search-results-full');
    const mainSearchInput = document.getElementById('mainSearchInput');

    // Config
    const BASE_URL = "http://localhost:8080/api/v1";
    let searchTimeout;
    let currentSearchController;

    // State
    let isLoading = false;
    let lastQuery = '';

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Toggle search overlay with animation
    const toggleSearch = (show) => {
        if (show) {
            searchOverlay.style.display = 'block';
            requestAnimationFrame(() => {
                searchOverlay.classList.add('active');
                document.body.classList.add('search-active');
                fullSearchInput.focus();

                // Sync search input if there was a previous search
                if (mainSearchInput.value) {
                    fullSearchInput.value = mainSearchInput.value;
                    performSearch(mainSearchInput.value);
                }
            });
        } else {
            searchOverlay.classList.remove('active');
            document.body.classList.remove('search-active');
            setTimeout(() => {
                searchOverlay.style.display = 'none';
                resultsContainer.innerHTML = '';
                fullSearchInput.value = '';
            }, 300);
        }
    };

    // Event Listeners
    searchIcon.addEventListener('click', () => toggleSearch(true));
    closeBtn.addEventListener('click', () => toggleSearch(false));
    mainSearchInput.addEventListener('click', () => toggleSearch(true));

    // Handle ESC key and click outside
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') toggleSearch(false);
    });

    searchOverlay.addEventListener('click', (e) => {
        if (e.target === searchOverlay) toggleSearch(false);
    });

    // Modern search function with AbortController
    const performSearch = async (query) => {
        query = query.trim();

        // Don't search if query is too short or same as last query
        if (query.length < 2 || query === lastQuery) {
            return;
        }

        lastQuery = query;
        isLoading = true;
        showLoadingState();

        // Cancel previous request if exists
        if (currentSearchController) {
            currentSearchController.abort();
        }

        // Create new AbortController for this request
        currentSearchController = new AbortController();

        try {
            const authData = JSON.parse(sessionStorage.getItem('authData'));
            if (!authData?.token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${authData.token}`,
                    'Accept': 'application/json'
                },
                signal: currentSearchController.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const { data } = await response.json();
            renderResults(data, query);
        } catch (error) {
            if (error.name === 'AbortError') {
                return; // Request was cancelled, do nothing
            }
            showError(error);
        } finally {
            isLoading = false;
            hideLoadingState();
        }
    };

    // Debounced input handler
    fullSearchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value);
        }, 300);
    });

    document.querySelector('.search-results-full').addEventListener('click', (e) => {
        const postLink = e.target.closest('a[href^="timeline.html#post-"]');
        if (postLink) {
            toggleSearch(false);

            // For single-page applications, add:
            // e.preventDefault();
            // const href = postLink.getAttribute('href');
            // setTimeout(() => { window.location.href = href; }, 300);
        }
    });

    // Modern result rendering with animations
    const renderResults = (data, query) => {
        const { users = [], posts = [] } = data;

        const content = `
            <div class="row g-4 fade-in">
                ${users.length ? `
                    <div class="col-md-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="text-muted fs-5 mb-0" style="color: #8b0c7d !important">People</h5>
                            <span class="badge bg-primary rounded-pill">${users.length}</span>
                        </div>
                        <div class="list-group">
                            ${users.map(user => `
                                <a href="http://localhost:63342/Luma-Social-Media-Platform/Front-end/pages/profile-view.html?id=${user.userId}" 
                                   class="list-group-item list-group-item-action d-flex align-items-center gap-3">
                                    <img src="${user.profilePictureUrl || '../assets/image/Profile-picture.png'}" 
                                         class="rounded-circle" width="48" height="48"
                                         alt="${user.firstName}">
                                    <div class="flex-grow-1 min-w-0">
                                        <h6 class="mb-0 text-truncate">${highlightMatch(user.firstName + ' ' + user.lastName, query)}</h6>
                                        ${user.location ?
            `<small class="text-muted text-truncate d-block">${highlightMatch(user.location, query)}</small>`
            : ''}
                                    </div>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
${posts.length ? `
<div class="col-12">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="text-muted fs-5 mb-0" style="color: #8b0c7d !important">Posts</h5>
        <span class="badge bg-primary rounded-pill">${posts.length}</span>
    </div>
    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        ${posts.map(post => `
            <div class="col">
                <a href="timeline.html#post-${post.postId}" 
                   class="card hover-shadow text-decoration-none h-100">
                    <div class="card-body">
                        <!-- Header Section -->
                        <div class="d-flex align-items-center mb-3">
                            <img src="${post.user.profilePictureUrl || '../assets/image/Profile-picture.png'}" 
                                 class="rounded-circle me-2" 
                                 width="40" 
                                 height="40"
                                 alt="${post.user.firstName}">
                            <div>
                                <h6 class="mb-0">${post.user.firstName} ${post.user.lastName}</h6>
                                <small class="text-muted">
                                    ${formatRelativeTime(post.createdAt)} • 
                                    <i class="bi ${getPrivacyIcon(post.privacy)}"></i>
                                    ${post.privacy === 'PRIVATE' ? 'Only Me' : post.privacy.charAt(0) + post.privacy.slice(1).toLowerCase()}
                                </small>
                            </div>
                        </div>

                        <!-- Content & Media -->
                        <p class="mb-3 text-truncate-2">${highlightMatch(post.content, query)}</p>
                        ${post.media?.length ? `
                            <div class="post-media mb-3 ratio ratio-1x1">
                                ${post.media.map(media => `
                                    ${media.mediaType === 'IMAGE' ? `
                                        <img src="${media.mediaUrl}" 
                                             class="img-fluid rounded mb-2 object-fit-cover" 
                                             alt="Post image">
                                    ` : ''}
                                    ${media.mediaType === 'VIDEO' ? `
                                        <video class="w-100 rounded mb-2 object-fit-cover">
                                            <source src="${media.mediaUrl}" 
                                                    type="video/mp4">
                                        </video>
                                    ` : ''}
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </a>
            </div>
        `).join('')}
    </div>
</div>
` : ''}
                
                ${!users.length && !posts.length ? `
                    <div class="col-12 text-center py-5">
                        <div class="display-1 mb-2">
                            <i class="bi bi-search fs-3 fw-bold" style="color: #8b0c7d !important"></i>
                        </div>
                        <h4 class="text-muted fs-4">No results found</h4>
                        <p class="text-muted mb-0 fs-5">
                            We couldn't find anything matching "${escapeHtml(query)}"
                        </p>
                    </div>
                ` : ''}
            </div>
        `;

        resultsContainer.innerHTML = content;

        // Animate new results
        const elements = resultsContainer.getElementsByClassName('fade-in');
        Array.from(elements).forEach(el => {
            el.style.opacity = '0';
            requestAnimationFrame(() => {
                el.style.transition = 'opacity 0.3s ease';
                el.style.opacity = '1';
            });
        });
    };

    // Utility Functions
    const showLoadingState = () => {
        resultsContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="text-muted mt-3 mb-0">Searching...</p>
            </div>
        `;
    };

    const hideLoadingState = () => {
        // Handled by renderResults
    };

    const showError = (error) => {
        resultsContainer.innerHTML = `
            <div class="alert alert-danger m-3" role="alert">
                <h4 class="alert-heading">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Search Error
                </h4>
                <p class="mb-0">${error.message}</p>
            </div>
        `;
    };

    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 7) {
            return date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
            });
        } else if (days > 0) {
            return `${days}d ago`;
        } else if (hours > 0) {
            return `${hours}h ago`;
        } else if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return 'Just now';
        }
    };

    const highlightMatch = (text, query) => {
        if (!query) return escapeHtml(text);
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        return escapeHtml(text).replace(regex, '<mark>$1</mark>');
    };

    const escapeHtml = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    const escapeRegExp = (str) => {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const getPrivacyIcon = (privacy) => {
        const icons = {
            PUBLIC: 'bi-globe',
            FRIENDS: 'bi-people-fill',
            PRIVATE: 'bi-lock-fill'
        };
        return icons[privacy] || 'bi-globe';
    };
});