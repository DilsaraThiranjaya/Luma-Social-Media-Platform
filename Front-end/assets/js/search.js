document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = "http://localhost:8080/api/v1";
    const authData = JSON.parse(sessionStorage.getItem('authData'));

    const searchInput = document.querySelector('.search-input');
    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    let searchTimeout;

    // Insert search results container after search input
    searchInput.parentNode.insertBefore(searchResults, searchInput.nextSibling);

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(searchTimeout);

        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        // Add loading state
        searchInput.classList.add('loading');

        // Debounce search requests
        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`, {
                    headers: {
                        'Authorization': `Bearer ${authData.token}`
                    }
                });

                if (!response.ok) throw new Error('Search failed');

                const data = await response.json();

                if (data.code === 200) {
                    renderSearchResults(data.data);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                searchInput.classList.remove('loading');
            }
        }, 300);
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults.style.display = 'none';
        }
    });

    function renderSearchResults(data) {
        const { users, posts } = data;

        searchResults.innerHTML = `
      <div class="search-section">
        <h6 class="search-section-title">People</h6>
        ${users.length ? users.map(user => `
          <a href="/profile-view.html?id=${user.userId}" class="search-result-item">
            <img src="${user.profilePictureUrl || '../assets/image/Profile-picture.png'}" 
                 alt="${user.firstName}" class="search-result-img">
            <div class="search-result-info">
              <div class="search-result-name">${user.firstName} ${user.lastName}</div>
              <div class="search-result-meta">${user.location || ''}</div>
            </div>
          </a>
        `).join('') : '<div class="no-results">No users found</div>'}
      </div>
      <div class="search-section">
        <h6 class="search-section-title">Posts</h6>
        ${posts.length ? posts.map(post => `
          <a href="http://localhost:63342/Luma-Social-Media-Platform/Front-end/pages/timeline.html#post-${post.postId}" class="search-result-item">
            <div class="search-result-post">
              <div class="search-result-content">${post.content.substring(0, 100)}...</div>
              <div class="search-result-meta">
                by ${post.user.firstName} ${post.user.lastName} • ${formatDate(post.createdAt)}
              </div>
            </div>
          </a>
        `).join('') : '<div class="no-results">No posts found</div>'}
      </div>
    `;

        searchResults.style.display = 'block';
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
});