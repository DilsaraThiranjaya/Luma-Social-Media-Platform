document.addEventListener("DOMContentLoaded", function () {
  // Initialize tooltips
  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]'
  );
  const tooltipList = [...tooltipTriggerList].map(
    (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
  );

  // Grid/List View Toggle
  const gridBtn = document.querySelector(".bi-grid-3x3-gap").parentElement;
  const listBtn = document.querySelector(".bi-list").parentElement;
  const marketContainer = document.querySelector(".row.g-4");

  if (gridBtn && listBtn && marketContainer) {
    gridBtn.addEventListener("click", function () {
      marketContainer.classList.remove("list-view");
      gridBtn.classList.add("active");
      listBtn.classList.remove("active");
    });

    listBtn.addEventListener("click", function () {
      marketContainer.classList.add("list-view");
      listBtn.classList.add("active");
      gridBtn.classList.remove("active");
    });
  }

  // Search Functionality
  const searchInput = document.querySelector(".search-input");
  const marketItems = document.querySelectorAll(".market-item");

  if (searchInput && marketItems.length > 0) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase();

      marketItems.forEach((item) => {
        const title = item.querySelector(".card-title").textContent.toLowerCase();
        const price = item.querySelector(".price").textContent.toLowerCase();
        const location = item
          .querySelector(".location")
          .textContent.toLowerCase();

        if (
          title.includes(searchTerm) ||
          price.includes(searchTerm) ||
          location.includes(searchTerm)
        ) {
          item.parentElement.style.display = "";
        } else {
          item.parentElement.style.display = "none";
        }
      });
    });
  }

  // Price Range Filter
  const minPrice = document.querySelector('input[placeholder="Min"]');
  const maxPrice = document.querySelector('input[placeholder="Max"]');
  const applyFiltersBtn = document.querySelector(".btn-primary.w-100");

  if (minPrice && maxPrice && applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", function () {
      const min = parseFloat(minPrice.value) || 0;
      const max = parseFloat(maxPrice.value) || Infinity;

      marketItems.forEach((item) => {
        const price = parseFloat(
          item.querySelector(".price").textContent.replace("$", "")
        );
        if (price >= min && price <= max) {
          item.parentElement.style.display = "";
        } else {
          item.parentElement.style.display = "none";
        }
      });
    });
  }

  // Category Filter
  const categorySelect = document.querySelector(".form-select");
  if (categorySelect) {
    categorySelect.addEventListener("change", function () {
      const selectedCategory = this.value;
      if (selectedCategory === "All Categories") {
        marketItems.forEach((item) => (item.parentElement.style.display = ""));
        return;
      }

      // Add category filtering logic
      marketItems.forEach((item) => {
        // For demo purposes, we'll assign random categories
        const categories = ["Vehicles", "Property", "Electronics", "Clothing", "Furniture", "Books"];
        const itemCategory = categories[Math.floor(Math.random() * categories.length)];
        
        // Store category in data attribute for future filtering
        item.dataset.category = itemCategory;
        
        item.parentElement.style.display = (itemCategory === selectedCategory || selectedCategory === "All Categories") ? "" : "none";
      });
    });
  }

  // Condition filter
  const conditionCheckboxes = document.querySelectorAll('.form-check-input');
  if (conditionCheckboxes.length > 0) {
    // Assign condition data attributes to items for demo
    marketItems.forEach(item => {
      const conditions = ["New", "Used - Like New", "Used - Good"];
      const badgeEl = item.querySelector('.badge');
      if (badgeEl) {
        const condition = badgeEl.textContent;
        item.dataset.condition = condition;
      }
    });
    
    // Add event listeners to condition checkboxes
    conditionCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const checkedConditions = [];
        conditionCheckboxes.forEach(cb => {
          if (cb.checked) {
            const label = cb.nextElementSibling.textContent;
            checkedConditions.push(label);
          }
        });
        
        // If no checkboxes are checked, show all items
        if (checkedConditions.length === 0) {
          marketItems.forEach(item => {
            item.parentElement.style.display = "";
          });
          return;
        }
        
        // Filter items by condition
        marketItems.forEach(item => {
          const condition = item.dataset.condition;
          item.parentElement.style.display = checkedConditions.includes(condition) ? "" : "none";
        });
      });
    });
  }

  // Image Upload Preview
  const fileInput = document.querySelector(".file-input");
  const previewContainer = document.querySelector(".image-preview-container");
  const uploadBox = document.querySelector(".image-upload-box");

  if (uploadBox && fileInput && previewContainer) {
    uploadBox.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", function () {
      Array.from(this.files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const preview = document.createElement("div");
            preview.className = "col-4";
            preview.innerHTML = `
              <div class="image-preview">
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="btn btn-sm btn-light remove-image">
                  <i class="bi bi-x"></i>
                </button>
              </div>
            `;

            preview
              .querySelector(".remove-image")
              .addEventListener("click", function () {
                preview.remove();
              });

            previewContainer.appendChild(preview);
          };
          reader.readAsDataURL(file);
        }
      });
    });
  }

  // View Details Modal
  const viewDetailsButtons = document.querySelectorAll(".btn-primary.btn-sm");
  if (viewDetailsButtons.length > 0) {
    viewDetailsButtons.forEach((button) => {
      button.addEventListener("click", function () {
        // Get product details from the card
        const card = this.closest('.card');
        const title = card.querySelector('.card-title').textContent;
        const price = card.querySelector('.price').textContent;
        const location = card.querySelector('.location').textContent;
        const condition = card.querySelector('.badge').textContent;
        const image = card.querySelector('img').src;
        
        // Update modal with product details
        const modal = document.getElementById('productDetailsModal');
        if (modal) {
          modal.querySelector('h4.mb-3').textContent = title;
          modal.querySelector('h3.text-primary').textContent = price;
          modal.querySelector('.carousel-item.active img').src = image;
          modal.querySelector('span.badge').textContent = condition;
          modal.querySelector('span.badge').className = card.querySelector('.badge').className;
          modal.querySelector('p i.bi-geo-alt').parentElement.textContent = location;
        }
        
        // Show the modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
      });
    });
  }

  // Create Listing Form Submission
  const listingForm = document.getElementById("listingForm");
  if (listingForm) {
    listingForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Show success message
      showToast("Your listing has been created successfully!", "success");

      // Create a new listing in the selling tab
      const title = this.querySelector('input[type="text"]').value;
      const price = this.querySelector('.input-group input[type="number"]').value;
      const category = this.querySelector('select[required]').value;
      const condition = this.querySelectorAll('select[required]')[1].value;
      const description = this.querySelector('textarea').value;
      const location = this.querySelectorAll('input[type="text"]')[1].value;
      
      // Add the new listing to the selling tab
      const sellingItemsContainer = document.querySelector('#selling .row.g-3');
      if (sellingItemsContainer) {
        const newItem = document.createElement('div');
        newItem.className = 'col-md-6';
        newItem.innerHTML = `
          <div class="selling-item">
            <img src="/api/placeholder/150/150" alt="Product">
            <div class="selling-info">
              <h6>${title}</h6>
              <p class="text-muted">Status: <span class="text-success">Active</span></p>
              <div class="d-flex gap-2">
                <button class="btn btn-primary btn-sm">Edit Listing</button>
                <button class="btn btn-danger btn-sm">Delete</button>
              </div>
            </div>
          </div>
        `;
        
        // Add event listeners to the new buttons
        const deleteBtn = newItem.querySelector('.btn-danger');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', function() {
            if (confirm("Are you sure you want to delete this listing?")) {
              newItem.style.transform = "scale(0.95)";
              setTimeout(() => {
                newItem.remove();
                showToast("Listing deleted successfully", "success");
              }, 300);
            }
          });
        }
        
        sellingItemsContainer.appendChild(newItem);
      }

      // Close modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("createListingModal")
      );
      modal.hide();
      
      // Reset form
      listingForm.reset();
      const previewImages = document.querySelectorAll('.image-preview-container .col-4');
      previewImages.forEach(preview => preview.remove());
    });
  }

  // Market tabs functionality
  const marketTabs = document.querySelectorAll('.market-tabs .list-group-item');
  if (marketTabs.length > 0) {
    marketTabs.forEach(tab => {
      tab.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        // Remove active class from all tabs
        marketTabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Hide all tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
          pane.classList.remove('show', 'active');
        });
        
        // Show the target tab pane
        if (target) {
          target.classList.add('show', 'active');
        }
        
        // Initialize message list if inbox tab is shown
        if (this.getAttribute('href') === '#inbox') {
          initMessageList();
        }
      });
    });
  }

  // Message Seller Functionality
  const messageSellerBtns = document.querySelectorAll('.btn-primary:contains("Message Seller")');
  if (messageSellerBtns.length === 0) {
    // For the product details modal
    const productModal = document.getElementById('productDetailsModal');
    if (productModal) {
      const messageBtn = productModal.querySelector('.btn-primary');
      if (messageBtn) {
        messageBtn.addEventListener('click', function() {
          const sellerName = productModal.querySelector('.d-flex.align-items-center h6').textContent;
          
          // Create and show message modal
          openChatModal(sellerName, productModal.querySelector('h4.mb-3').textContent);
        });
      }
    }
  }

  // Function to open chat modal
  function openChatModal(sellerName, productTitle) {
    // Check if modal already exists, if not create it
    let chatModal = document.getElementById('chatModal');
    if (!chatModal) {
      const modalHTML = `
        <div class="modal fade" id="chatModal" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header gradient-bg">
                <h5 class="modal-title text-white">Message to ${sellerName}</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <p>Regarding: ${productTitle || 'Your listing'}</p>
                <div class="mb-3">
                  <label class="form-label">Your Message</label>
                  <textarea class="form-control" rows="4" placeholder="Type your message here..."></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary send-message">Send Message</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = modalHTML;
      document.body.appendChild(modalContainer);
      
      chatModal = document.getElementById('chatModal');
      
      // Add event listener to send button
      chatModal.querySelector('.send-message').addEventListener('click', function() {
        const messageText = chatModal.querySelector('textarea').value;
        if (messageText.trim() !== '') {
          // Add message to inbox
          addMessageToInbox(sellerName, messageText, productTitle);
          
          // Close modal and show success toast
          const modal = bootstrap.Modal.getInstance(chatModal);
          modal.hide();
          
          showToast('Message sent successfully!', 'success');
        }
      });
    } else {
      // Update existing modal with new details
      chatModal.querySelector('.modal-title').textContent = `Message to ${sellerName}`;
      chatModal.querySelector('.modal-body p').textContent = `Regarding: ${productTitle || 'Your listing'}`;
      chatModal.querySelector('textarea').value = '';
    }
    
    // Show the modal
    const modal = new bootstrap.Modal(chatModal);
    modal.show();
  }

  // Function to add message to inbox
  function addMessageToInbox(sender, message, regarding) {
    const inboxList = document.querySelector('.message-list');
    if (inboxList) {
      const now = new Date();
      const timeString = 'Just now';
      
      const messageItem = document.createElement('div');
      messageItem.className = 'message-item unread';
      messageItem.innerHTML = `
        <img src="/assets/image/Test-profile-img.jpg" alt="User" class="message-sender">
        <div class="message-content">
          <h6>${sender} <span class="text-muted">- Regarding "${regarding || 'Listing'}"</span></h6>
          <p class="message-preview">${message.substring(0, 50)}${message.length > 50 ? '...' : ''}</p>
          <small class="text-muted">${timeString}</small>
        </div>
        <div class="message-actions">
          <button class="btn btn-link"><i class="bi bi-reply"></i></button>
          <button class="btn btn-link"><i class="bi bi-trash"></i></button>
        </div>
      `;
      
      // Add click event to the message item
      messageItem.addEventListener('click', function(e) {
        if (!e.target.closest('.message-actions')) {
          showMessageDetail(this);
        }
      });
      
      // Add reply and delete functionality
      const replyBtn = messageItem.querySelector('.bi-reply').parentElement;
      const deleteBtn = messageItem.querySelector('.bi-trash').parentElement;
      
      replyBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        openChatModal(sender, regarding);
      });
      
      deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this message?')) {
          messageItem.style.transform = 'scale(0.95)';
          setTimeout(() => {
            messageItem.remove();
            showToast('Message deleted', 'info');
          }, 300);
        }
      });
      
      // Add to the inbox
      inboxList.prepend(messageItem);
      
      // Update badge count
      const inboxBadge = document.querySelector('a[href="#inbox"] .badge');
      if (inboxBadge) {
        inboxBadge.textContent = parseInt(inboxBadge.textContent) + 1;
      }
    }
  }

  // Message List Functionality
  function initMessageList() {
    const messageItems = document.querySelectorAll(".message-item");
    if (messageItems.length > 0) {
      messageItems.forEach((item) => {
        item.addEventListener("click", function (e) {
          if (!e.target.closest(".message-actions")) {
            showMessageDetail(this);
          }
        });
        
        // Add functionality to reply and delete buttons
        const replyBtn = item.querySelector('.bi-reply').parentElement;
        const deleteBtn = item.querySelector('.bi-trash').parentElement;
        
        replyBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          const sender = item.querySelector('h6').childNodes[0].textContent.trim();
          const regarding = item.querySelector('span.text-muted').textContent.replace('- Regarding ', '');
          openChatModal(sender, regarding);
        });
        
        deleteBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (confirm('Are you sure you want to delete this message?')) {
            item.style.transform = 'scale(0.95)';
            setTimeout(() => {
              item.remove();
              showToast('Message deleted', 'info');
              
              // Update badge count
              const inboxBadge = document.querySelector('a[href="#inbox"] .badge');
              if (inboxBadge) {
                const count = parseInt(inboxBadge.textContent) - 1;
                inboxBadge.textContent = count > 0 ? count : '';
              }
            }, 300);
          }
        });
      });
    }
  }

  // Function to show message detail
  function showMessageDetail(messageItem) {
    // Extract information from the message item
    const sender = messageItem.querySelector('h6').childNodes[0].textContent.trim();
    const regarding = messageItem.querySelector('span.text-muted').textContent;
    const preview = messageItem.querySelector('p.message-preview').textContent;
    const time = messageItem.querySelector('small.text-muted').textContent;
    
    // Check if modal already exists
    let detailModal = document.getElementById('messageDetailModal');
    if (!detailModal) {
      // Create modal if it doesn't exist
      const modalHTML = `
        <div class="modal fade" id="messageDetailModal" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header gradient-bg">
                <h5 class="modal-title text-white">Message Details</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <div class="d-flex align-items-center mb-3">
                  <img src="/assets/image/Test-profile-img.jpg" alt="Sender" class="rounded-circle me-2" width="40" height="40">
                  <div>
                    <h6 class="mb-0 sender-name"></h6>
                    <small class="text-muted message-time"></small>
                  </div>
                </div>
                <div class="mb-3">
                  <h6 class="message-regarding"></h6>
                  <p class="message-content"></p>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-light" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary reply-btn">Reply</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = modalHTML;
      document.body.appendChild(modalContainer);
      
      detailModal = document.getElementById('messageDetailModal');
    }
    
    // Update modal content
    detailModal.querySelector('.sender-name').textContent = sender;
    detailModal.querySelector('.message-time').textContent = time;
    detailModal.querySelector('.message-regarding').textContent = regarding;
    detailModal.querySelector('.message-content').textContent = preview;
    
    // Add reply functionality
    detailModal.querySelector('.reply-btn').addEventListener('click', function() {
      // Close details modal
      bootstrap.Modal.getInstance(detailModal).hide();
      
      // Open chat modal for reply
      openChatModal(sender, regarding.replace('- Regarding ', ''));
    });
    
    // Show the modal
    const modal = new bootstrap.Modal(detailModal);
    modal.show();
    
    // Mark message as read
    messageItem.classList.remove('unread');
  }

  // Save/Bookmark Functionality
  const productDetailsModal = document.getElementById('productDetailsModal');
  if (productDetailsModal) {
    const saveButton = productDetailsModal.querySelector('.btn-outline-primary');
    if (saveButton) {
      saveButton.addEventListener('click', function() {
        const icon = this.querySelector('i');
        const isSaved = icon.classList.contains('bi-bookmark-fill');
        
        if (isSaved) {
          icon.classList.replace('bi-bookmark-fill', 'bi-bookmark');
          showToast('Removed from saved items', 'info');
        } else {
          icon.classList.replace('bi-bookmark', 'bi-bookmark-fill');
          showToast('Added to saved items', 'success');
        }
      });
    }
  }

  // Initialize message list
  initMessageList();

  // Toast Notification Function
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = "position-fixed bottom-0 end-0 p-3";
    toast.style.zIndex = "1070";

    toast.innerHTML = `
      <div class="toast show bg-${type} text-white" role="alert">
        <div class="toast-header bg-${type} text-white">
          <strong class="me-auto">Notification</strong>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
          ${message}
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    // Add event listener to close button
    toast.querySelector('.btn-close').addEventListener('click', function() {
      toast.remove();
    });

    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
});