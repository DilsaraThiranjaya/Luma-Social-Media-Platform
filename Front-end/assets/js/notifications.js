document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

  // Get current user email from localStorage or session
  const currentUserEmail = localStorage.getItem('userEmail');

  // Load notifications
  loadNotifications();

  // Filter buttons functionality
  const filterButtons = document.querySelectorAll('.btn-filter');
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      loadNotifications(this.textContent.toLowerCase());
    });
  });

  // Load notifications function
  async function loadNotifications(filter = 'all') {
    try {
      let url = `/api/v1/notifications?userEmail=${currentUserEmail}`;
      if (filter === 'unread') {
        url = `/api/v1/notifications/unread?userEmail=${currentUserEmail}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data = await response.json();
      displayNotifications(data.data, filter);
      updateNotificationCount(data.data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error:', error);
      showToast('Error loading notifications', 'error');
    }
  }

  // Display notifications
  function displayNotifications(notifications, filter) {
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

    return `
            <div class="notification-item ${unreadClass}" data-id="${notification.notificationId}">
                <div class="notification-avatar">
                    <img src="${notification.sourceUser?.profilePictureUrl || '../assets/image/Test-profile-img.jpg'}" alt="User">
                </div>
                <div class="notification-content">
                    <p><strong>${notification.title}</strong></p>
                    <p>${notification.content}</p>
                    <small class="text-muted">${timeAgo}</small>
                </div>
                <div class="notification-actions">
                    <button class="btn btn-light btn-sm">
                        <i class="bi bi-three-dots"></i>
                    </button>
                </div>
            </div>
        `;
  }

  // Add notification handlers
  function addNotificationHandlers() {
    document.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', async function(e) {
        if (!e.target.closest('.notification-actions')) {
          const id = this.dataset.id;
          await markAsRead(id);

          // If there's an action URL, navigate to it
          const notification = notifications.find(n => n.notificationId === parseInt(id));
          if (notification?.actionUrl) {
            window.location.href = notification.actionUrl;
          }
        }
      });

      const actionButton = item.querySelector('.notification-actions .btn');
      if (actionButton) {
        actionButton.addEventListener('click', function(e) {
          e.stopPropagation();
          showNotificationMenu(this);
        });
      }
    });
  }

  // Mark notification as read
  async function markAsRead(notificationId) {
    try {
      const response = await fetch(`/api/v1/notifications/mark-read/${notificationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to mark notification as read');

      const item = document.querySelector(`[data-id="${notificationId}"]`);
      if (item) {
        item.classList.remove('unread');
        updateNotificationCount();
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error marking notification as read', 'error');
    }
  }

  // Mark all as read
  async function markAllAsRead() {
    try {
      const response = await fetch(`/api/v1/notifications/mark-all-read?userEmail=${currentUserEmail}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to mark all notifications as read');

      document.querySelectorAll('.notification-item.unread').forEach(item => {
        item.classList.remove('unread');
      });
      updateNotificationCount(0);
      showToast('All notifications marked as read');
    } catch (error) {
      console.error('Error:', error);
      showToast('Error marking all notifications as read', 'error');
    }
  }

  // Delete notification
  async function deleteNotification(notificationId) {
    try {
      const response = await fetch(`/api/v1/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete notification');

      const item = document.querySelector(`[data-id="${notificationId}"]`);
      if (item) {
        item.remove();
        updateNotificationCount();
        checkEmptyState();
      }
      showToast('Notification deleted');
    } catch (error) {
      console.error('Error:', error);
      showToast('Error deleting notification', 'error');
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
    const badge = document.querySelector('.nav-link[title="Notifications"] .badge');
    if (badge) {
      const unreadCount = count ?? document.querySelectorAll('.notification-item.unread').length;
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast position-fixed bottom-0 end-0 m-3';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
            <div class="toast-header ${type === 'error' ? 'bg-danger text-white' : ''}">
                <i class="bi bi-bell-fill me-2"></i>
                <strong class="me-auto">Notification</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;

    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, {
      autohide: true,
      delay: 3000
    });
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
  }

  // Initialize
  updateNotificationCount();
  if (filterButtons.length > 0) {
    filterButtons[0].classList.add('active');
  }
});