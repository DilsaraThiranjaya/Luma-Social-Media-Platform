// Constants
const BASE_URL = "http://localhost:8080/api/v1";
const authData = JSON.parse(sessionStorage.getItem('authData')) || {};

// Toast configuration
const Toast = Swal.mixin({
  toast: true,
  position: "bottom-end",
  iconColor: "white",
  customClass: {
    popup: "colored-toast",
  },
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
});

document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

  // Load initial data
  loadFriendRequests();
  loadAllFriends();
  loadFriendSuggestions();
  updateCounters();

  // Friend Requests
  async function loadFriendRequests() {
    try {
      const response = await fetch(`${BASE_URL}/friendship/requests`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      const data = await response.json();

      if (data.code === 200) {
        const requestsContainer = document.querySelector('#friend-requests .row');
        requestsContainer.innerHTML = data.data.map(request => `
          <div class="col-md-6 col-lg-4">
            <div class="friend-request-card" data-request-id="${request.user1Id}">
              <img src="${request.user1.profileImage || '../assets/image/Test-profile-img.jpg'}" alt="Profile" class="friend-profile-img">
              <div class="friend-info">
                <h6>${request.user1.firstName} ${request.user1.lastName}</h6>
                <p class="text-muted mb-2">${request.mutualFriends} mutual friends</p>
                <div class="d-flex gap-2">
                  <button class="btn btn-primary btn-sm flex-grow-1 accept-request">Accept</button>
                  <button class="btn btn-light btn-sm flex-grow-1 decline-request">Decline</button>
                </div>
              </div>
            </div>
          </div>
        `).join('');

        attachFriendRequestHandlers();
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
      await Toast.fire({
        icon: "error",
        title: "Failed to load friend requests"
      });
    }
  }

  // All Friends
  async function loadAllFriends() {
    try {
      const response = await fetch(`${BASE_URL}/friendship/friends`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      const data = await response.json();

      if (data.code === 200) {
        const friendsContainer = document.querySelector('#all-friends .row');
        friendsContainer.innerHTML = data.data.map(friend => `
          <div class="col-md-6 col-lg-4">
            <div class="friend-card" data-friend-id="${friend.user2Id}">
              <img src="${friend.user2.profileImage || '../assets/image/Test-profile-img.jpg'}" alt="Profile" class="friend-profile-img">
              <div class="friend-info">
                <h6>${friend.user2.firstName} ${friend.user2.lastName}</h6>
                <p class="text-muted mb-2">${friend.user2.occupation || 'No occupation listed'}</p>
                <div class="d-flex gap-2">
                  <button class="btn btn-light btn-sm flex-grow-1 message-friend">
                    <i class="bi bi-chat-dots-fill me-2"></i>Message
                  </button>
                  <button class="btn btn-light btn-sm flex-grow-1 friend-options">
                    <i class="bi bi-three-dots"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `).join('');

        attachFriendOptionsHandlers();
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      await Toast.fire({
        icon: "error",
        title: "Failed to load friends"
      });
    }
  }

  // Friend Suggestions
  async function loadFriendSuggestions() {
    try {
      const response = await fetch(`${BASE_URL}/friendship/suggestions`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      const data = await response.json();

      if (data.code === 200) {
        const suggestionsContainer = document.querySelector('#suggestions .row');
        suggestionsContainer.innerHTML = data.data.map(suggestion => `
          <div class="col-md-6 col-lg-4">
            <div class="friend-suggestion-card">
              <img src="${suggestion.profileImage || '../assets/image/Test-profile-img.jpg'}" alt="Profile" class="friend-profile-img">
              <div class="friend-info">
                <h6>${suggestion.firstName} ${suggestion.lastName}</h6>
                <p class="text-muted mb-2">${suggestion.occupation || 'No occupation listed'}</p>
                <button class="btn btn-primary btn-sm w-100 send-request" data-user-id="${suggestion.userId}">
                  <i class="bi bi-person-plus-fill me-2"></i>Add Friend
                </button>
              </div>
            </div>
          </div>
        `).join('');

        attachSuggestionHandlers();
      }
    } catch (error) {
      console.error('Error loading friend suggestions:', error);
      await Toast.fire({
        icon: "error",
        title: "Failed to load friend suggestions"
      });
    }
  }

  // Event Handlers
  function attachFriendRequestHandlers() {
    // Accept request
    document.querySelectorAll('.accept-request').forEach(button => {
      button.addEventListener('click', async function() {
        const card = this.closest('.friend-request-card');
        const userId = card.dataset.requestId;

        try {
          const response = await fetch(`${BASE_URL}/friendship/${userId}/accept`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authData.token}`
            }
          });

          if (response.ok) {
            card.remove();
            await Toast.fire({
              icon: "success",
              title: "Friend request accepted"
            });
            updateCounters();
            loadAllFriends();
          }
        } catch (error) {
          console.error('Error accepting friend request:', error);
          await Toast.fire({
            icon: "error",
            title: "Failed to accept friend request"
          });
        }
      });
    });

    // Decline request
    document.querySelectorAll('.decline-request').forEach(button => {
      button.addEventListener('click', async function() {
        const card = this.closest('.friend-request-card');
        const userId = card.dataset.requestId;

        try {
          const response = await fetch(`${BASE_URL}/friendship/${userId}/decline`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authData.token}`
            }
          });

          if (response.ok) {
            card.remove();
            await Toast.fire({
              icon: "success",
              title: "Friend request declined"
            });
            updateCounters();
          }
        } catch (error) {
          console.error('Error declining friend request:', error);
          await Toast.fire({
            icon: "error",
            title: "Failed to decline friend request"
          });
        }
      });
    });
  }

  function attachFriendOptionsHandlers() {
    document.querySelectorAll('.friend-options').forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const card = this.closest('.friend-card');
        const userId = card.dataset.friendId;
        const name = card.querySelector('h6').textContent;

        const menu = document.createElement('div');
        menu.className = 'dropdown-menu show';
        menu.style.position = 'absolute';
        menu.style.transform = 'translate3d(0px, 40px, 0px)';
        menu.innerHTML = `
          <a class="dropdown-item view-profile" href="#"><i class="bi bi-person-badge me-2"></i>View Profile</a>
          <a class="dropdown-item unfriend" href="#"><i class="bi bi-person-x me-2"></i>Unfriend</a>
          <a class="dropdown-item block" href="#"><i class="bi bi-exclamation-triangle me-2"></i>Block</a>
        `;

        // Position menu
        const rect = button.getBoundingClientRect();
        menu.style.top = `${rect.top + window.scrollY}px`;
        menu.style.left = `${rect.left}px`;

        // Handle unfriend
        menu.querySelector('.unfriend').addEventListener('click', async function(e) {
          e.preventDefault();
          if (confirm(`Are you sure you want to unfriend ${name}?`)) {
            try {
              const response = await fetch(`${BASE_URL}/friendship/${userId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${authData.token}`
                }
              });

              if (response.ok) {
                card.remove();
                await Toast.fire({
                  icon: "success",
                  title: `Unfriended ${name}`
                });
                updateCounters();
              }
            } catch (error) {
              console.error('Error unfriending:', error);
              await Toast.fire({
                icon: "error",
                title: "Failed to unfriend"
              });
            }
          }
          menu.remove();
        });

        // Handle block
        menu.querySelector('.block').addEventListener('click', async function(e) {
          e.preventDefault();
          if (confirm(`Are you sure you want to block ${name}? This will also unfriend them.`)) {
            try {
              const response = await fetch(`${BASE_URL}/friendship/${userId}/block`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${authData.token}`
                }
              });

              if (response.ok) {
                card.remove();
                await Toast.fire({
                  icon: "success",
                  title: `Blocked ${name}`
                });
                updateCounters();
              }
            } catch (error) {
              console.error('Error blocking user:', error);
              await Toast.fire({
                icon: "error",
                title: "Failed to block user"
              });
            }
          }
          menu.remove();
        });

        // View profile
        menu.querySelector('.view-profile').addEventListener('click', function(e) {
          e.preventDefault();
          window.location.href = `/profile.html?id=${userId}`;
        });

        document.body.appendChild(menu);

        // Remove menu when clicking outside
        document.addEventListener('click', function removeMenu(e) {
          if (!menu.contains(e.target) && !button.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', removeMenu);
          }
        });
      });
    });

    // Message button handler
    document.querySelectorAll('.message-friend').forEach(button => {
      button.addEventListener('click', function() {
        const userId = this.closest('.friend-card').dataset.friendId;
        window.location.href = `/messages.html?userId=${userId}`;
      });
    });
  }

  function attachSuggestionHandlers() {
    document.querySelectorAll('.send-request').forEach(button => {
      button.addEventListener('click', async function() {
        const userId = this.dataset.userId;

        try {
          const response = await fetch(`${BASE_URL}/friendship/${userId}/request`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authData.token}`
            }
          });

          if (response.ok) {
            this.disabled = true;
            this.innerHTML = '<i class="bi bi-check-lg me-2"></i>Request Sent';
            this.classList.remove('btn-primary');
            this.classList.add('btn-secondary');

            await Toast.fire({
              icon: "success",
              title: "Friend request sent"
            });
          }
        } catch (error) {
          console.error('Error sending friend request:', error);
          await Toast.fire({
            icon: "error",
            title: "Failed to send friend request"
          });
        }
      });
    });
  }

  // Update counters
  async function updateCounters() {
    try {
      const response = await fetch(`${BASE_URL}/friendship/counts`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      const data = await response.json();

      if (data.code === 200) {
        document.querySelector('[href="#all-friends"] .badge').textContent = data.data.friendsCount;
        document.querySelector('[href="#friend-requests"] .badge').textContent = data.data.requestsCount;
        document.querySelector('[href="#suggestions"] .badge').textContent = data.data.suggestionsCount;
      }
    } catch (error) {
      console.error('Error updating counters:', error);
    }
  }

  // Search functionality
  const searchInput = document.querySelector('.search-input');
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    document.querySelectorAll('.friend-card, .friend-request-card, .friend-suggestion-card').forEach(card => {
      const name = card.querySelector('h6').textContent.toLowerCase();
      const info = card.querySelector('p').textContent.toLowerCase();

      if (name.includes(searchTerm) || info.includes(searchTerm)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });

  // Grid/List View Toggle
  document.querySelectorAll('.btn-group[role="group"]').forEach(btnGroup => {
    const gridBtn = btnGroup.querySelector('.bi-grid-3x3-gap').parentElement;
    const listBtn = btnGroup.querySelector('.bi-list').parentElement;

    gridBtn.addEventListener('click', function() {
      const containers = document.querySelectorAll('.tab-pane.active .row.g-3');
      containers.forEach(container => {
        container.classList.remove('list-view');
      });
      gridBtn.classList.add('active');
      listBtn.classList.remove('active');
    });

    listBtn.addEventListener('click', function() {
      const containers = document.querySelectorAll('.tab-pane.active .row.g-3');
      containers.forEach(container => {
        container.classList.add('list-view');
      });
      listBtn.classList.add('active');
      gridBtn.classList.remove('active');
    });
  });

  // Sort functionality
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        const sortType = this.textContent.trim();
        const container = this.closest('.tab-pane').querySelector('.row');
        const cards = Array.from(container.children);

        cards.sort((a, b) => {
          const nameA = a.querySelector('h6').textContent;
          const nameB = b.querySelector('h6').textContent;

          switch (sortType) {
            case 'Name (A-Z)':
              return nameA.localeCompare(nameB);
            case 'Name (Z-A)':
              return nameB.localeCompare(nameA);
            case 'Recently Added':
              return 0; // Would use timestamps in a real implementation
            default:
              return 0;
          }
        });

        cards.forEach(card => container.appendChild(card));
      });
    });
  });
});