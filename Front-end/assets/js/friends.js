document.addEventListener('DOMContentLoaded', function () {
  const BASE_URL = "http://localhost:8080/api/v1/friends";
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

// Load initial data
  async function loadFriendRequests() {
    try {
      const response = await fetch(`${BASE_URL}/requests`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      const data = await response.json();

      if (data.code === 200) {
        const requestsContainer = document.querySelector('#friend-requests .row');
        requestsContainer.innerHTML = data.data.map(request => `
          <div class="col-md-6 col-lg-4">
            <div class="friend-request-card" data-request-id="${request.friendshipId}">
              <img src="../assets/image/Test-profile-img.jpg" alt="Profile" class="friend-profile-img">
              <div class="friend-info">
                <h6>${request.user1Email}</h6>
                <p class="text-muted mb-2">12 mutual friends</p>
                <div class="d-flex gap-2">
                  <button class="btn btn-primary btn-sm flex-grow-1 accept-request">Accept</button>
                  <button class="btn btn-light btn-sm flex-grow-1 reject-request">Decline</button>
                </div>
              </div>
            </div>
          </div>
        `).join('');

        // Attach event listeners to new buttons
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

  async function loadAllFriends() {
    try {
      const response = await fetch(`${BASE_URL}/all`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      const data = await response.json();

      if (data.code === 200) {
        const friendsContainer = document.querySelector('#all-friends .row');
        friendsContainer.innerHTML = data.data.map(friend => `
          <div class="col-md-6 col-lg-4">
            <div class="friend-card" data-friend-id="${friend.friendshipId}">
              <img src="../assets/image/Test-profile-img.jpg" alt="Profile" class="friend-profile-img">
              <div class="friend-info">
                <h6>${friend.user2Email}</h6>
                <p class="text-muted mb-2">Software Engineer at Facebook</p>
                <div class="d-flex gap-2">
                  <button class="btn btn-light btn-sm flex-grow-1">
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

        // Attach event listeners to new buttons
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

  async function loadFriendSuggestions() {
    try {
      const response = await fetch(`${BASE_URL}/suggestions`, {
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
              <img src="../assets/image/Test-profile-img.jpg" alt="Profile" class="friend-profile-img">
              <div class="friend-info">
                <h6>${suggestion.user2Email}</h6>
                <p class="text-muted mb-2">Works at Google</p>
                <button class="btn btn-primary btn-sm w-100 send-request" data-email="${suggestion.user2Email}">
                  <i class="bi bi-person-plus-fill me-2"></i>Add Friend
                </button>
              </div>
            </div>
          </div>
        `).join('');

        // Attach event listeners to new buttons
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

  // Event handlers
  function attachFriendRequestHandlers() {
    document.querySelectorAll('.accept-request').forEach(button => {
      button.addEventListener('click', async function() {
        const card = this.closest('.friend-request-card');
        const requestId = card.dataset.requestId;

        try {
          const response = await fetch(`${BASE_URL}/accept/${requestId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${authData.token}`
            }
          });

          const data = await response.json();
          if (data.code === 200) {
            card.remove();
            await Toast.fire({
              icon: "success",
              title: "Friend request accepted"
            });
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

    document.querySelectorAll('.reject-request').forEach(button => {
      button.addEventListener('click', async function() {
        const card = this.closest('.friend-request-card');
        const requestId = card.dataset.requestId;

        try {
          const response = await fetch(`${BASE_URL}/reject/${requestId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authData.token}`
            }
          });

          const data = await response.json();
          if (data.code === 200) {
            card.remove();
            await Toast.fire({
              icon: "success",
              title: "Friend request rejected"
            });
          }
        } catch (error) {
          console.error('Error rejecting friend request:', error);
          await Toast.fire({
            icon: "error",
            title: "Failed to reject friend request"
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
        const friendId = card.dataset.friendId;
        const name = card.querySelector('h6').textContent;

        const menu = document.createElement('div');
        menu.className = 'dropdown-menu show';
        menu.style.position = 'absolute';
        menu.style.transform = 'translate3d(0px, 40px, 0px)';
        menu.innerHTML = `
          <a class="dropdown-item" href="#"><i class="bi bi-person-badge me-2"></i>View Profile</a>
          <a class="dropdown-item" href="#"><i class="bi bi-star me-2"></i>Add to Favorites</a>
          <a class="dropdown-item unfriend" href="#"><i class="bi bi-person-x me-2"></i>Unfriend</a>
          <a class="dropdown-item block" href="#"><i class="bi bi-exclamation-triangle me-2"></i>Block</a>
        `;

        // Position the menu
        const rect = button.getBoundingClientRect();
        menu.style.top = `${rect.top + window.scrollY}px`;
        menu.style.left = `${rect.left}px`;

        // Add click handlers
        menu.querySelector('.unfriend').addEventListener('click', async function(e) {
          e.preventDefault();
          if (confirm(`Are you sure you want to unfriend ${name}?`)) {
            try {
              const response = await fetch(`${BASE_URL}/unfriend/${friendId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${authData.token}`
                }
              });

              const data = await response.json();
              if (data.code === 200) {
                card.remove();
                await Toast.fire({
                  icon: "success",
                  title: `Unfriended ${name}`
                });
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

        menu.querySelector('.block').addEventListener('click', async function(e) {
          e.preventDefault();
          if (confirm(`Are you sure you want to block ${name}? This will also unfriend them.`)) {
            try {
              const response = await fetch(`${BASE_URL}/block/${friendId}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${authData.token}`
                }
              });

              const data = await response.json();
              if (data.code === 200) {
                card.remove();
                await Toast.fire({
                  icon: "success",
                  title: `Blocked ${name}`
                });
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
  }

  function attachSuggestionHandlers() {
    document.querySelectorAll('.send-request').forEach(button => {
      button.addEventListener('click', async function() {
        const email = this.dataset.email;

        try {
          const response = await fetch(`${BASE_URL}/request`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authData.token}`
            },
            body: JSON.stringify({
              user2Email: email
            })
          });

          const data = await response.json();
          if (data.code === 200) {
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

  // Initialize page
  loadFriendRequests();
  loadAllFriends();
  loadFriendSuggestions();

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
              return 0; // Would normally use timestamps
            default:
              return 0;
          }
        });

        cards.forEach(card => container.appendChild(card));
      });
    });
  });

  // Initialize tooltips
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

  // Friend Request Handlers
  document.querySelectorAll('.friend-request-card .btn-primary').forEach(button => {
    button.addEventListener('click', function () {
      const card = this.closest('.friend-request-card');
      const name = card.querySelector('h6').textContent;

      // Show acceptance animation
      card.style.transform = 'scale(0.95)';
      card.style.opacity = '0.5';

      setTimeout(() => {
        // Remove the card with animation
        card.style.transform = 'scale(0)';
        setTimeout(() => {
          card.remove();
          showToast(`You are now friends with ${name}!`, 'success');
        }, 300);
      }, 300);
    });
  });

  document.querySelectorAll('.friend-request-card .btn-light').forEach(button => {
    button.addEventListener('click', function () {
      const card = this.closest('.friend-request-card');

      // Show decline animation
      card.style.transform = 'scale(0.95)';
      card.style.opacity = '0.5';

      setTimeout(() => {
        // Remove the card with animation
        card.style.transform = 'scale(0)';
        setTimeout(() => {
          card.remove();
        }, 300);
      }, 300);
    });
  });

  // Add Friend Handlers
  document.querySelectorAll('.friend-suggestion-card .btn-primary').forEach(button => {
    button.addEventListener('click', function () {
      const wasClicked = this.classList.contains('clicked');

      if (!wasClicked) {
        this.classList.add('clicked');
        this.innerHTML = '<i class="bi bi-check-lg me-2"></i>Request Sent';
        this.classList.remove('btn-primary');
        this.classList.add('btn-secondary');
      }
    });
  });

  // Message Button Handlers
  document.querySelectorAll('.friend-card .btn-light').forEach(button => {
    if (button.textContent.includes('Message')) {
      button.addEventListener('click', function () {
        const name = this.closest('.friend-card').querySelector('h6').textContent;
        openChatModal(name);
      });
    }
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

  // Toast Notification Function
  function showToast(message, type = 'info') {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '1070';

    const toast = document.createElement('div');
    toast.className = `toast show bg-${type} text-white`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
  <div class="toast-header bg-${type} text-white">
    <strong class="me-auto">Notification</strong>
    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
  </div>
  <div class="toast-body">
    ${message}
  </div>
`;

    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toastContainer.remove();
      }, 300);
    }, 3000);
  }

  // Friend Options Dropdown
  document.querySelectorAll('.friend-card .bi-three-dots').forEach(icon => {
    const button = icon.parentElement;
    button.addEventListener('click', function (e) {
      e.preventDefault();

      const card = this.closest('.friend-card');
      const name = card.querySelector('h6').textContent;

      // Create and show dropdown menu
      const menu = document.createElement('div');
      menu.className = 'dropdown-menu show';
      menu.style.position = 'absolute';
      menu.style.transform = 'translate3d(0px, 40px, 0px)';
      menu.innerHTML = `
    <a class="dropdown-item" href="#"><i class="bi bi-person-badge me-2"></i>View Profile</a>
    <a class="dropdown-item" href="#"><i class="bi bi-star me-2"></i>Add to Favorites</a>
    <a class="dropdown-item" href="#"><i class="bi bi-person-x me-2"></i>Unfriend</a>
    <a class="dropdown-item" href="#"><i class="bi bi-exclamation-triangle me-2"></i>Block</a>
  `;

      // Position the menu
      const rect = button.getBoundingClientRect();
      menu.style.top = `${rect.top + window.scrollY}px`;
      menu.style.left = `${rect.left}px`;

      // Add click handlers
      menu.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function (e) {
          e.preventDefault();
          const action = this.textContent.trim();

          switch (action) {
            case 'Unfriend':
              if (confirm(`Are you sure you want to unfriend ${name}?`)) {
                card.style.transform = 'scale(0.95)';
                card.style.opacity = '0.5';
                setTimeout(() => {
                  card.style.transform = 'scale(0)';
                  setTimeout(() => {
                    card.remove();
                    showToast(`You have unfriended ${name}`, 'danger');
                  }, 300);
                }, 300);
              }
              break;
            case 'Block':
              if (confirm(`Are you sure you want to block ${name}? This will also unfriend them.`)) {
                card.style.transform = 'scale(0.95)';
                card.style.opacity = '0.5';
                setTimeout(() => {
                  card.style.transform = 'scale(0)';
                  setTimeout(() => {
                    card.remove();
                    showToast(`You have blocked ${name}`, 'danger');
                  }, 300);
                }, 300);
              }
              break;
            default:
              showToast(`${action} clicked for ${name}`, 'info');
          }

          menu.remove();
        });
      });

      // Add the menu to the document
      document.body.appendChild(menu);

      // Remove menu when clicking outside
      document.addEventListener('click', function removeMenu(e) {
        if (!menu.contains(e.target) && !button.contains(e.target)) {
          menu.remove(); document.removeEventListener('click', removeMenu);
        }
      });
    });
  });

  // Sort Functionality
  const sortDropdown = document.querySelector('.dropdown-menu');
  if (sortDropdown) {
    sortDropdown.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        const sortType = this.textContent.trim();
        const container = document.querySelector('.friend-card').parentElement;
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
              // This would normally use a timestamp
              return Math.random() - 0.5;
            default:
              return 0;
          }
        });

        cards.forEach(card => container.appendChild(card));
      });
    });
  }

  // Filter Functionality
  document.querySelectorAll('.friend-filters .list-group-item').forEach(filter => {
    filter.addEventListener('click', function (e) {
      e.preventDefault();

      // Update active state
      document.querySelectorAll('.friend-filters .list-group-item').forEach(item => {
        item.classList.remove('active');
      });
      this.classList.add('active');

      // Get filter type
      const filterType = this.textContent.trim().split(' ')[0];

      // Filter cards
      document.querySelectorAll('.friend-card').forEach(card => {
        const info = card.querySelector('p').textContent.toLowerCase();

        switch (filterType) {
          case 'Work':
            card.style.display = info.includes('works at') ? '' : 'none';
            break;
          case 'Current':
            card.style.display = info.includes('lives in') ? '' : 'none';
            break;
          case 'Recently':
            // This would normally use a timestamp
            card.style.display = Math.random() > 0.5 ? '' : 'none';
            break;
          case 'All':
            card.style.display = '';
            break;
        }
      });
    });
  });

  // Mutual Friends Tooltip
  const mutualFriends = document.querySelectorAll('.text-muted');
  mutualFriends.forEach(element => {
    if (element.textContent.includes('mutual friends')) {
      new bootstrap.Tooltip(element, {
        title: 'Click to see mutual friends',
        placement: 'top'
      });

      element.style.cursor = 'pointer';
      element.addEventListener('click', function () {
        // This would normally open a modal showing mutual friends
        showToast('Mutual friends feature coming soon!', 'info');
      });
    }
  });

  // Add hover effects for interactive elements
  document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-1px)';
    });

    button.addEventListener('mouseleave', function () {
      this.style.transform = '';
    });
  });
});