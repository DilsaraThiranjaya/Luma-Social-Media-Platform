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
      initializeNavbarUserInfo();
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
          title: error.message || "Logout Failed",
          text: error.message
        });
      }
    });
  }

  async function initializeNavbarUserInfo() {
    try {
      const response = await fetch(`${BASE_URL}/profile/profileInfo`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      const responseData = await response.json();

      if (responseData.code === 200 || responseData.code === 201) {
        const user = responseData.data;

        // Update Profile Name in Navigation
        document.getElementById('navProfileName').textContent = `${user.firstName} ${user.lastName}`;

        // Set Navbar Profile Picture
        if (user.profilePictureUrl) {
          document.getElementById('navProfileImg').src = user.profilePictureUrl;
          document.getElementById('navBarProfileImg').src = user.profilePictureUrl;
        }
      } else {
        await Toast.fire({
          icon: "error",
          title: responseData.message
        });
        return;
      }
    } catch (error) {
      await Toast.fire({
        icon: "error",
        title: error.message || "Failed to load user data"
      });
    }
  }

  function initializeUI() {
    //Toast Configs
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

    // Initialize
    loadNotifications();


    let notificationCount = 0;

    // Initialize tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    // Filter buttons functionality
    const filterButtons = document.querySelectorAll('.btn-filter');
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        loadNotifications(this.textContent.toLowerCase());
      });
    });

    if (filterButtons.length > 0) {
      filterButtons[0].classList.add('active');
    }

    // Load notifications function
    async function loadNotifications(filter = 'all') {
      try {
        let url = `${BASE_URL}/notifications`;
        if (filter === 'unread') {
          url = `${BASE_URL}/notifications/unread`;
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch notifications');

        const data = await response.json();

        // Ensure we're working with an array of notifications
        const notifications = Array.isArray(data.data) ? data.data :
            (Array.isArray(data) ? data : []);

        notificationCount = notifications.filter(n => !n.isRead).length;

        displayNotifications(notifications);
        updateNotificationCount(notificationCount);
      } catch (error) {
        Toast.fire({
          icon: "error",
          title: error.message || "Failed to load notifications"
        })
      }
    }

    // Display notifications
    function displayNotifications(notifications) {
      const container = document.querySelector('.card-body');
      container.innerHTML = '';

      if (!notifications.length) {
        displayEmptyState(container);
        return;
      }

      // Group notifications by date
      const grouped = groupByDate(notifications);

      Object.entries(grouped).forEach(([date, items]) => {
        const section = document.createElement('div');
        section.className = 'notification-section';

        section.innerHTML = `
                <div class="notification-date">${date}</div>
                ${items.map(notification => createNotificationHTML(notification)).join('')}
            `;

        container.appendChild(section);
      });

      // Add click handlers
      addNotificationHandlers();
    }

    // Create notification HTML
    function createNotificationHTML(notification) {
      const timeAgo = formatTimeAgo(new Date(notification.createdAt));
      const unreadClass = notification.isRead ? '' : 'unread';
      const readButtonStyle = notification.isRead ? 'display: none;' : '';

      let actionUrl = null;

      switch (notification.actionUrl) {
        case '/post-like':
          actionUrl = `http://localhost:63342/Luma-Social-Media-Platform/Front-end/pages/timeline.html#post-${notification.post?.postId}`;
          break;
        case '/post-comment':
          // actionUrl = `http://localhost:63342/Luma-Social-Media-Platform/Front-end/pages/timeline.html#post-${notification.post?.postId}_comment-${notification.comment?.commentId}`;
          actionUrl = `http://localhost:63342/Luma-Social-Media-Platform/Front-end/pages/timeline.html#post-${notification.post?.postId}`;
          break;
        case '/report-post':
          actionUrl = `http://localhost:63342/Luma-Social-Media-Platform/Front-end/pages/timeline.html#post-${notification.report?.reportedPost.postId}`;
          break;
        case '/report-user':
          actionUrl = `http://localhost:63342/Luma-Social-Media-Platform/Front-end/pages/profile-view.html?id=${notification.report?.reportedUser.userId}`;
          break;
        case '/friend-request':
          actionUrl = `http://localhost:63342/Luma-Social-Media-Platform/Front-end/pages/profile-view.html?id=${notification.sourceUser?.userId}`;
          break;
        default:
          actionUrl = null;
          break;
      }

      return `
    <div class="notification-item ${unreadClass}" data-id="${notification.notificationId}" data-url="${actionUrl}">
      <div class="notification-avatar">
        <img src="${notification.sourceUser?.profilePictureUrl || '../assets/image/Test-profile-img.jpg'}" alt="User">
      </div>
      <div class="notification-content">
        <p><strong>${notification.title}</strong></p>
        <p>${notification.content}</p>
        <small class="text-muted">${timeAgo}</small>
      </div>
      <div class="notification-actions">
        <button class="btn btn-sm btn-mark-read" style="${readButtonStyle}" title="Mark as read">
          <i class="bi bi-check-circle"></i>
        </button>
        <button class="btn btn-sm btn-delete" title="Delete">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  `;
    }

    // Add notification handlers
    function addNotificationHandlers() {
      document.querySelectorAll('.notification-item').forEach(item => {
        const notificationId = item.dataset.id;
        const notificationUrl = item.dataset.url;

        // Handle click on notification content (excluding action buttons)
        item.addEventListener('click', async function(e) {
          if (!e.target.closest('.notification-actions')) {
            await markAsRead(notificationId);

            // If there's an action URL, navigate to it
            if (notificationUrl) {
              window.location.href = notificationUrl;
            }
          }
        });

        // Mark as read button
        const markReadButton = item.querySelector('.btn-mark-read');
        if (markReadButton) {
          markReadButton.addEventListener('click', async function(e) {
            e.stopPropagation();
            await markAsRead(notificationId);
            this.style.display = 'none'; // Hide the button after marking as read
          });
        }

        // Delete button
        const deleteButton = item.querySelector('.btn-delete');
        if (deleteButton) {
          deleteButton.addEventListener('click', async function(e) {
            e.stopPropagation();
            await deleteNotification(notificationId);
          });
        }
      });
    }

    // Mark notification as read
    async function markAsRead(notificationId) {
      try {
        const response = await fetch(`${BASE_URL}/notifications/mark-read/${notificationId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });

        if (!response.ok) throw new Error('Failed to mark notification as read');

        const item = document.querySelector(`[data-id="${notificationId}"]`);
        if (item) {
          item.classList.remove('unread');
          updateNotificationCount(notificationCount - 1);
        }
      } catch (error) {
        Toast.fire({
          icon: "error",
          title: error.message || "Failed to mark notification as read"
        })
      }
    }

    document.getElementById('markAllAsRead').addEventListener('click', markAllAsRead);

    // Mark all as read
    async function markAllAsRead() {
      try {
        const response = await fetch(`${BASE_URL}/notifications/mark-all-read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });

        if (!response.ok) throw new Error('Failed to mark all notifications as read');

        const unreadItems = document.querySelectorAll('.notification-item.unread');

        unreadItems.forEach(item => {
          item.classList.remove('unread');
          const markReadBtn = item.querySelector('.btn-mark-read');
          if (markReadBtn) markReadBtn.style.display = 'none';
        });

        updateNotificationCount(0);
      } catch (error) {
        Toast.fire({
          icon: "error",
          title: error.message || "Failed to mark all notifications as read"
        })
      }
    }

    // Delete notification
    async function deleteNotification(notificationId) {
      try {
        const response = await fetch(`${BASE_URL}/notifications/${notificationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });

        if (!response.ok) throw new Error('Failed to delete notification');

        const item = document.querySelector(`[data-id="${notificationId}"]`);
        if (item) {
          if (item.classList.contains('unread')) {
            updateNotificationCount(notificationCount - 1);
          }
          item.remove();
        }
      } catch (error) {
        Toast.fire({
          icon: "error",
          title: error.message || "Failed to delete notification"
        })
      }
    }

    // Helper functions
    function groupByDate(notifications) {
      const groups = {};
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      notifications.forEach(notification => {
        const date = new Date(notification.createdAt).toDateString();
        let groupName = date;

        if (date === today) {
          groupName = 'Today';
        } else if (date === yesterday) {
          groupName = 'Yesterday';
        } else {
          groupName = 'Earlier';
        }

        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(notification);
      });

      return groups;
    }

    function formatTimeAgo(date) {
      const seconds = Math.floor((new Date() - date) / 1000);

      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + ' years ago';

      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + ' months ago';

      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + ' days ago';

      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + ' hours ago';

      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + ' minutes ago';

      return Math.floor(seconds) + ' seconds ago';
    }

    function displayEmptyState(container) {
      container.innerHTML = `
            <div class="empty-notifications">
                <i class="bi bi-bell"></i>
                <h4>No notifications</h4>
                <p>You're all caught up! Check back later for new notifications.</p>
            </div>
        `;
    }

    function updateNotificationCount(count) {
      const badge = document.getElementById('notificationBadge')
      if (badge) {
        const unreadCount = count;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
      }
    }

    // function showToast(message, type = 'success') {
    //   const toast = document.createElement('div');
    //   toast.className = 'toast position-fixed bottom-0 end-0 m-3';
    //   toast.setAttribute('role', 'alert');
    //   toast.setAttribute('aria-live', 'assertive');
    //   toast.setAttribute('aria-atomic', 'true');
    //
    //   toast.innerHTML = `
    //         <div class="toast-header ${type === 'error' ? 'bg-danger text-white' : ''}">
    //             <i class="bi bi-bell-fill me-2"></i>
    //             <strong class="me-auto">Notification</strong>
    //             <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
    //         </div>
    //         <div class="toast-body">
    //             ${message}
    //         </div>
    //     `;
    //
    //   document.body.appendChild(toast);
    //   const bsToast = new bootstrap.Toast(toast, {
    //     autohide: true,
    //     delay: 3000
    //   });
    //   bsToast.show();
    //
    //   toast.addEventListener('hidden.bs.toast', () => {
    //     toast.remove();
    //   });
    // }
  }
});