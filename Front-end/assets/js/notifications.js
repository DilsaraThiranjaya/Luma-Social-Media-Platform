document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

  // Filter buttons functionality
  const filterButtons = document.querySelectorAll('.btn-filter');
  const notificationItems = document.querySelectorAll('.notification-item');

  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');

      // Filter notifications
      const filter = this.textContent.toLowerCase();
      
      notificationItems.forEach(item => {
        if (filter === 'all') {
          item.style.display = 'flex';
        } else if (filter === 'unread') {
          item.style.display = item.classList.contains('unread') ? 'flex' : 'none';
        } else if (filter === 'mentions') {
          const hasMention = item.querySelector('.notification-content p').textContent.includes('mentioned');
          item.style.display = hasMention ? 'flex' : 'none';
        }

        // Add animation for visible items
        if (item.style.display === 'flex') {
          item.classList.add('notification-fade-in');
          setTimeout(() => {
            item.classList.remove('notification-fade-in');
          }, 300);
        }
      });
    });
  });

  // Mark notification as read on click
  notificationItems.forEach(item => {
    item.addEventListener('click', function(e) {
      // Don't trigger if clicking the three dots button
      if (!e.target.closest('.notification-actions')) {
        markAsRead(this);
      }
    });

    // Add dropdown menu functionality to three dots button
    const actionButton = item.querySelector('.notification-actions .btn');
    if (actionButton) {
      actionButton.addEventListener('click', function(e) {
        e.stopPropagation();
        showNotificationMenu(this);
      });
    }
  });

  // Mark notification as read
  function markAsRead(notification) {
    if (notification.classList.contains('unread')) {
      notification.classList.remove('unread');
      updateNotificationCount();
      
      // Add subtle animation
      notification.style.transition = 'background-color 0.3s ease';
      notification.style.backgroundColor = 'transparent';
    }
  }

  // Show notification menu
  function showNotificationMenu(button) {
    // Remove any existing dropdown menus
    document.querySelectorAll('.notification-dropdown').forEach(m => m.remove());
    
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu notification-dropdown show';
    menu.style.position = 'absolute';
    menu.style.top = '100%';
    menu.style.right = '0';
    menu.style.zIndex = '1000';
    
    menu.innerHTML = `
      <a class="dropdown-item" href="#" data-action="mark-read">
        <i class="bi bi-check-circle"></i> Mark as read
      </a>
      <a class="dropdown-item" href="#" data-action="mute">
        <i class="bi bi-bell-slash"></i> Mute notifications
      </a>
      <div class="dropdown-divider"></div>
      <a class="dropdown-item text-danger" href="#" data-action="remove">
        <i class="bi bi-trash"></i> Remove
      </a>
    `;

    button.parentNode.appendChild(menu);

    // Add click handlers for menu items
    menu.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        handleMenuAction(this.dataset.action, button.closest('.notification-item'));
        menu.remove();
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target) && !button.contains(e.target)) {
        menu.remove();
      }
    });
  }

  // Handle menu actions
  function handleMenuAction(action, notification) {
    switch (action) {
      case 'mark-read':
        markAsRead(notification);
        showToast('Notification marked as read');
        break;
      case 'mute':
        const userName = notification.querySelector('strong').textContent;
        showToast(`Notifications muted for ${userName}`);
        break;
      case 'remove':
        removeNotification(notification);
        break;
    }
  }

  // Remove notification with animation
  function removeNotification(notification) {
    notification.style.height = notification.offsetHeight + 'px';
    notification.style.transition = 'all 0.3s ease';
    
    requestAnimationFrame(() => {
      notification.style.height = '0';
      notification.style.opacity = '0';
      notification.style.padding = '0';
      
      setTimeout(() => {
        notification.remove();
        updateNotificationCount();
        checkEmptyState();
      }, 300);
    });

    showToast('Notification removed');
  }

  // Update notification badge count
  function updateNotificationCount() {
    const unreadCount = document.querySelectorAll('.notification-item.unread').length;
    const badge = document.querySelector('.nav-link[title="Notifications"] .badge');
    
    if (badge) {
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
  }

  // Check for empty state
  function checkEmptyState() {
    const notificationsContainer = document.querySelector('.card-body');
    const hasNotifications = document.querySelectorAll('.notification-item').length > 0;
    const existingEmptyState = document.querySelector('.empty-notifications');
    
    if (!hasNotifications && !existingEmptyState) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-notifications';
      emptyState.innerHTML = `
        <i class="bi bi-bell"></i>
        <h4>No notifications</h4>
        <p>You're all caught up! Check back later for new notifications.</p>
      `;
      
      notificationsContainer.appendChild(emptyState);
    } else if (hasNotifications && existingEmptyState) {
      existingEmptyState.remove();
    }
  }

  // Show toast notification
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast position-fixed bottom-0 end-0 m-3';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
      <div class="toast-header">
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

  // Initialize the page
  updateNotificationCount();
  checkEmptyState();

  // Mark first filter as active
  if (filterButtons.length > 0) {
    filterButtons[0].classList.add('active');
  }
});