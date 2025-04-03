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
            initializeNavbarUserInfo();
            initializeLogout();
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
                    title: "Logout Failed",
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

                document.getElementById('navProfileName').textContent = `${user.firstName} ${user.lastName}`;
                document.getElementById('sideBarProfileName').textContent = `${user.firstName} ${user.lastName}`;

                if (user.profilePictureUrl) {
                    document.getElementById('navProfileImg').src = user.profilePictureUrl;
                    document.getElementById('navBarProfileImg').src = user.profilePictureUrl;
                    document.getElementById('sideBarProfileImg').src = user.profilePictureUrl;
                }

                const sideBarLocationElement = document.getElementById('sideBarLocation');
                const sideBarLocationItem = document.querySelector('.sidebar-location-item');

                if (user.location !== null && user.location !== '') {
                    // Keep the icon and update only the text
                    sideBarLocationElement.nextSibling.nodeValue = ` ${user.location}`;
                    sideBarLocationItem.classList.remove('d-none');
                } else {
                    sideBarLocationItem.classList.add('d-none');
                }

                const formattedJoinDate = user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long'
                    })
                    : 'Not specified';

                const sideBarJoinedDate = document.getElementById('sideBarJoinedDate');
                // Find the text node after the icon and update only the text
                sideBarJoinedDate.childNodes[1].nodeValue = ` Joined on ${formattedJoinDate}`;

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
        loadPosts();
        initializeReportModal();

        // Initialize tooltips and popovers
        const tooltipTriggerList = document.querySelectorAll(
            '[data-bs-toggle="tooltip"]'
        );
        const tooltipList = [...tooltipTriggerList].map(
            (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
        );

        // Post Modal Functionality
        const postModal = document.getElementById("postModal");
        const bsPostModal = new bootstrap.Modal(postModal);
        const postTextarea = document.querySelector(".post-content-input");
        const postButton = document.querySelector(".btn-post");
        const mediaPreviewContainer = document.querySelector(
            ".media-preview-container"
        );

        let selectedPrivacy = {
            icon: "bi-globe",
            text: "Public",
        };

        const dropdownButton = document.querySelector(
            '.privacy-dropdown[data-bs-toggle="dropdown"]'
        );
        dropdownButton.innerHTML = `
        <i class="bi ${selectedPrivacy.icon} me-1"></i>${selectedPrivacy.text}
        `;

        // Media Upload Handler
        const imageUpload = document.getElementById("imageUpload");
        const videoUpload = document.getElementById("videoUpload");

        // Handle image upload
        imageUpload.addEventListener("change", function (e) {
            handleMediaUpload(e.target.files, "image");
        });

        // Handle video upload
        videoUpload.addEventListener("change", function (e) {
            handleMediaUpload(e.target.files, "video");
        });

        // Initialize instant add photo button
        document.getElementById('addPhotos').addEventListener('click', function () {
            bsPostModal.show();

            postModal.addEventListener('shown.bs.modal', function modalShown() {
                imageUpload.click();
                postModal.removeEventListener('shown.bs.modal', modalShown);
            });
        });

        // Initialize instant add video button
        document.getElementById('addVideos').addEventListener('click', function () {
            bsPostModal.show();

            postModal.addEventListener('shown.bs.modal', function modalShown() {
                videoUpload.click();
                postModal.removeEventListener('shown.bs.modal', modalShown);
            });
        });

        // Media upload function
        const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
        const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
        let mediaFiles = [];

        function handleMediaUpload(files, type) {
            const validImageTypes = ["image/jpeg", "image/png", "image/webp"];
            const validVideoTypes = ["video/mp4", "video/quicktime"];

            Array.from(files).forEach((file) => {
                // Validation checks
                if (type === "image" && !validImageTypes.includes(file.type)) {
                    Toast.fire({icon: "error", title: "Invalid image format (JPEG, PNG, WebP only)"});
                    return;
                }

                if (type === "video" && !validVideoTypes.includes(file.type)) {
                    Toast.fire({icon: "error", title: "Invalid video format (MP4, MOV only)"});
                    return;
                }

                if (type === "image" && file.size > MAX_IMAGE_SIZE) {
                    Toast.fire({icon: "error", title: "Image size exceeds 20MB limit"});
                    return;
                }

                if (type === "video" && file.size > MAX_VIDEO_SIZE) {
                    Toast.fire({icon: "error", title: "Video size exceeds 100MB limit"});
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    const mediaElement = document.createElement("div");
                    mediaElement.className = "media-preview-item position-relative mb-3";
                    mediaElement.dataset.type = type;
                    mediaElement.dataset.filename = file.name;

                    // Store file reference
                    mediaElement.fileData = file;

                    if (type === "image") {
                        mediaElement.innerHTML = `
          <img src="${e.target.result}" class="img-fluid rounded" alt="Media Preview">
          <button type="button" class="btn-close position-absolute top-0 end-0 m-2 bg-light rounded-circle" aria-label="Remove"></button>
        `;
                    } else {
                        mediaElement.innerHTML = `
          <video src="${e.target.result}" class="img-fluid rounded" controls></video>
          <button type="button" class="btn-close position-absolute top-0 end-0 m-2 bg-light rounded-circle" aria-label="Remove"></button>
        `;
                    }

                    mediaPreviewContainer.appendChild(mediaElement);

                    // Store in mediaFiles array
                    mediaFiles.push({
                        element: mediaElement,
                        file: file,
                        type: type
                    });

                    // Remove button handler
                    mediaElement.querySelector(".btn-close").addEventListener("click", () => {
                        mediaFiles = mediaFiles.filter(item => item.element !== mediaElement);
                        mediaElement.remove();
                        updatePostButtonState();
                    });

                    updatePostButtonState();
                };
                reader.readAsDataURL(file);
            });
        }

        // Reset function
        function resetPostModal() {
            // Clear text content
            postTextarea.value = "";

            // Clear media previews
            mediaPreviewContainer.innerHTML = "";
            mediaFiles = [];

            // Reset privacy to default
            selectedPrivacy = {icon: "bi-globe", text: "Public"};
            updatePrivacyDropdown();

            // Reset button state
            postButton.disabled = true;

            // Clear file inputs (important for allowing same file to be re-selected)
            imageUpload.value = "";
            videoUpload.value = "";
        }

// Event listeners for modal close
        postModal.addEventListener('hide.bs.modal', function (event) {
            const hasContent = postTextarea.value.trim() || mediaFiles.length > 0;

            if (hasContent) {
                event.preventDefault(); // Prevent immediate closing

                Swal.fire({
                    title: 'Unsaved Changes',
                    text: "You have unsaved changes. Are you sure you want to discard them?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Yes, discard',
                    cancelButtonText: 'No, keep editing',
                }).then((result) => {
                    if (result.isConfirmed) {
                        resetPostModal();
                        bsPostModal.hide(); // Close after reset
                    }
                });
            }
        });

// Optional: Also reset when opening (in case modal was closed improperly)
        postModal.addEventListener('show.bs.modal', function () {
            // Only reset if there's no existing content
            if (!postTextarea.value.trim() && mediaFiles.length === 0) {
                resetPostModal();
            }
        });

        // Update post button state based on content
        function updatePostButtonState() {
            postButton.disabled =
                postTextarea.value.trim() === "" &&
                mediaPreviewContainer.children.length === 0;
        }

        // Listen for textarea input
        postTextarea.addEventListener("input", updatePostButtonState);

        // Emoji Picker Functionality
        async function initEmojiPicker(targetInput, emojiButton, isEditModal = false) {
            const containerClass = isEditModal ? 'emoji-container-edit' : 'emoji-container';
            let emojiContainer = document.querySelector(`.${containerClass}`);

            // If container already exists, remove it
            if (emojiContainer) {
                emojiContainer.remove();
                return;
            }

            // Create new container
            emojiContainer = document.createElement("div");
            emojiContainer.className = `${containerClass} p-2 border rounded shadow bg-white`;
            emojiContainer.style.position = "absolute";
            emojiContainer.style.zIndex = "1050";
            emojiContainer.style.width = "300px";
            emojiContainer.style.maxHeight = "400px";
            emojiContainer.style.overflowY = "auto";
            emojiContainer.style.bottom = "0";
            emojiContainer.style.right = "0";
            emojiContainer.style.fontFamily = "'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";

            // Show loading state
            const originalButtonHTML = emojiButton.innerHTML;
            emojiButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
            emojiButton.disabled = true;

            try {
                // Fetch emojis from EmojiHub API
                const response = await fetch('https://emojihub.yurace.pro/api/all');
                if (!response.ok) throw new Error('Failed to fetch emojis');
                const allEmojis = await response.json();

                // Group emojis by category
                const categories = {};
                allEmojis.forEach(emoji => {
                    if (!categories[emoji.category]) {
                        categories[emoji.category] = [];
                    }
                    categories[emoji.category].push(emoji);
                });

                // Build HTML structure
                let emojiHTML = '';
                for (const [category, emojis] of Object.entries(categories)) {
                    emojiHTML += `
        <div class="emoji-category mb-3">
          <h6 class="category-title text-muted mb-2">${category}</h6>
          <div class="d-flex flex-wrap">
            ${emojis.slice(0, 30).map(emoji => `
              <div class="emoji-item p-1 fs-4" 
                   title="${emoji.name}" 
                   data-emoji="${emoji.htmlCode[0]}">
                ${emoji.htmlCode[0]}
              </div>
            `).join("")}
          </div>
        </div>
      `;
                }

                emojiContainer.innerHTML = emojiHTML;
                emojiButton.parentNode.appendChild(emojiContainer);

                // Add click handler for emoji items
                emojiContainer.querySelectorAll(".emoji-item").forEach(item => {
                    item.addEventListener("click", () => {
                        const emoji = item.getAttribute("data-emoji");
                        insertAtCursor(targetInput, emoji);
                        emojiContainer.remove();
                    });
                });

                // Close picker when clicking outside
                const closePicker = (e) => {
                    if (!emojiContainer.contains(e.target) && e.target !== emojiButton) {
                        emojiContainer.remove();
                        document.removeEventListener("click", closePicker);
                    }
                };
                document.addEventListener("click", closePicker);

            } catch (error) {
                // Fallback to basic emojis if API fails
                emojiContainer.innerHTML = `
      <div class="text-center p-3 text-muted">
        <i class="bi bi-emoji-frown fs-4"></i>
        <p class="mb-0">Couldn't load emojis</p>
        <small>Using basic selection</small>
      </div>
      <div class="d-flex flex-wrap p-2">
        ${["😀", "😂", "😊", "😍", "🥰", "😎", "😇", "🤔", "😄", "😅", "😉", "😋", "😘", "🥳", "😮", "😢", "😡", "👍", "👎", "❤️"]
                    .map(e => `<div class="emoji-item p-1 fs-4">${e}</div>`).join("")}
      </div>
        `;
                emojiButton.parentNode.appendChild(emojiContainer);
            } finally {
                // Restore button state
                emojiButton.innerHTML = originalButtonHTML;
                emojiButton.disabled = false;
            }
        }

        // Helper function to insert emoji at cursor position
        function insertAtCursor(textarea, emoji) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value =
                textarea.value.substring(0, start) +
                emoji +
                textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
            textarea.focus();
        }

        // Post (Create) Modal Emoji Picker
        document.querySelector("#postModal .btn-emoji").addEventListener("click", (e) => {
            e.stopPropagation();
            initEmojiPicker(
                document.querySelector("#postModal .post-content-input"),
                document.querySelector("#postModal .btn-emoji")
            );
        });

// Edit Modal Emoji Picker
        document.querySelector("#editPostModal .btn-emoji").addEventListener("click", (e) => {
            e.stopPropagation();
            initEmojiPicker(
                document.querySelector("#editPostModal .edit-post-content-input"),
                document.querySelector("#editPostModal .btn-emoji"),
                true // This flag helps differentiate between modals
            );
        })

        // Create Post Functionality
        postButton.addEventListener("click", async function () {
            const postText = postTextarea.value.trim();
            const OriginalPostButtonText = postButton.innerHTML;
            if (!postText && mediaFiles.length === 0) return;

            postButton.disabled = true;
            postButton.innerHTML = `<span class="spinner-border  spinner-border-sm" style="color: white !important" role="status" aria-hidden="true"></span>`;
            const bsModal = bootstrap.Modal.getInstance(postModal);

            try {
                // Upload media files
                const mediaUploads = mediaFiles.map(async ({file, type}) => {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("type", type.toUpperCase());

                    const response = await $.ajax({
                        url: BASE_URL + "/profile/posts/upload-media",
                        type: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        headers: {
                            "Authorization": "Bearer " + authData.token
                        }
                    });

                    if (response.code !== 200) throw new Error(response.message);
                    return response.data;
                });

                // Wait for all media uploads
                const mediaResults = await Promise.all(mediaUploads);

                // Prepare post data
                const postData = {
                    content: postText,
                    privacy: selectedPrivacy.text.toUpperCase(),
                    media: mediaResults.map(result => ({
                        mediaUrl: result.mediaUrl,
                        mediaType: result.mediaType
                    }))
                };

                // Create the post
                const postResponse = await $.ajax({
                    url: BASE_URL + "/profile/posts/create",
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(postData),
                    headers: {
                        "Authorization": "Bearer " + authData.token
                    }
                });

                if (postResponse.code === 200 || postResponse.code === 201) {
                    loadPosts();

                    // Reset form
                    postTextarea.value = "";
                    mediaPreviewContainer.innerHTML = "";
                    mediaFiles = [];
                    selectedPrivacy = {icon: "bi-globe", text: "Public"};
                    updatePrivacyDropdown();
                    bsModal.hide();
                }
            } catch (error) {
                Toast.fire({
                    icon: "error",
                    title: error.responseJSON?.message || "Failed to create post"
                });
            } finally {
                postButton.disabled = false;
                postButton.innerHTML = OriginalPostButtonText;
            }
        });

        // Update privacy dropdown display for both modals
        function updatePrivacyDropdown(modalType = 'create') {
            const dropdownButton = document.querySelector(
                `${modalType === 'create' ? '#postModal' : '#editPostModal'} .privacy-dropdown`
            );
            if (dropdownButton) {
                dropdownButton.innerHTML = `
      <i class="bi ${selectedPrivacy.icon} me-1"></i>${selectedPrivacy.text === 'Private' ? 'Only Me' : selectedPrivacy.text}
     `;
            }
        }

// Handle privacy selection for both modals
        document.querySelectorAll(".dropdown-item[data-icon]").forEach((item) => {
            item.addEventListener("click", function (e) {
                e.preventDefault();
                const icon = this.dataset.icon;
                const text = this.dataset.text;
                selectedPrivacy = {icon, text};

                // Determine which modal we're in
                const modalType = this.closest('.modal')?.id === 'editPostModal' ? 'edit' : 'create';
                updatePrivacyDropdown(modalType);
            });
        });

        // Function to load posts from backend
        async function loadPosts() {
            try {
                const loader = `<div class="loading-spinner">Loading posts...</div>`;
                document.querySelector(".posts-container").innerHTML = loader;

                const response = await $.ajax({
                    url: BASE_URL + "/timeline/posts",
                    type: "GET",
                    headers: {
                        "Authorization": "Bearer " + authData.token
                    }
                });

                if (response.code === 200) {
                    const postsContainer = document.querySelector(".posts-container");
                    postsContainer.innerHTML = "";

                    if (response.data.posts.length === 0) {
                        postsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-newspaper"></i>
                    <p>No posts to show</p>
                </div>
             `;
                        return;
                    }

                    response.data.posts.forEach(post => {
                        const postElement = generatePostElement(post);
                        postsContainer.appendChild(postElement);
                    });

                    const hash = window.location.hash;
                    if (hash) {
                        const postElement = document.getElementById(hash.substring(1));
                        if (postElement) {
                            postElement.scrollIntoView({ behavior: 'smooth' });
                            postElement.style.backgroundColor = '#fff9e6';
                            setTimeout(() => {
                                postElement.style.backgroundColor = '';
                            }, 2000);
                        }
                    }
                }
            } catch (error) {
                Toast.fire({
                    icon: "error",
                    title: error.responseJSON?.message || "Failed to load posts"
                });
            }
        }

// Modified post creation function (generic version)
        function generatePostElement(postData) {
            const newPost = document.createElement("div");
            newPost.id = `post-${postData.postId}`;
            newPost.className = "card post-card mb-3";
            newPost.dataset.postId = postData.postId;

            // Format media content
            const mediaContent = (postData.media || []).map(media => {
                if (media.mediaType === 'IMAGE') {
                    return `<img src="${media.mediaUrl}" class="w-100 img-fluid rounded mb-3" alt="Post media">`;
                }
                if (media.mediaType === 'VIDEO') {
                    return `<video src="${media.mediaUrl}" class="w-100 img-fluid rounded mb-3" controls></video>`;
                }
                return "";
            }).join("");

            // Group reactions by type from the list of ReactionDTOs
            const groupedReactions = {};
            if (postData.reactions && Array.isArray(postData.reactions)) {
                postData.reactions.forEach(reaction => {
                    const type = reaction.type; // Reaction type, e.g., "LIKE", "LOVE"
                    groupedReactions[type] = (groupedReactions[type] || 0) + 1;
                });
            }

            // Build the reaction display HTML for reaction counts
            let reactionDisplay = "";
            if (Object.keys(groupedReactions).length > 0) {
                reactionDisplay = Object.entries(groupedReactions)
                    .map(([type, count]) => `
      <span class="reaction-icon me-1">
        <i class="bi ${REACTION_TYPES[type].fillIcon} ${REACTION_TYPES[type].color}"></i> ${count}
      </span>
        `)
                    .join('');
            }

            // For the like button, check if the user has reacted and show the reaction type if available
            const likeButtonIcon = postData.liked && postData.reactionType
                ? `bi ${REACTION_TYPES[postData.reactionType].fillIcon} ${REACTION_TYPES[postData.reactionType].color}`
                : "bi-hand-thumbs-up";
            const likeButtonText = postData.liked && postData.reactionType ? postData.reactionType : "Like";

            const formattedPrivacy = postData.privacy.charAt(0).toUpperCase() + postData.privacy.slice(1).toLowerCase();
            const output = formattedPrivacy === "Private" ? "Only Me" : formattedPrivacy;

            newPost.innerHTML = `
        <div class="card-header bg-transparent">
      <div class="d-flex align-items-center timline-post-item">
        <img src="${postData.user.profilePictureUrl || '/assets/image/Profile-picture.png'}" 
             alt="Profile" class="rounded-circle me-2" style="width: 40px; height: 40px;">
        <div>
          <h6 class="mb-0">${postData.user.firstName} ${postData.user.lastName}</h6>
          <small class="text-muted">
            ${formatCommentDate(postData.createdAt)} • 
            <i class="bi ${getPrivacyIcon(postData.privacy)}"></i> 
            ${output}
          </small>
        </div>
        <div class="ms-auto dropdown">
          ${generatePostDropdown(postData)}
        </div>
      </div>
        </div>
        <div class="card-body">
      <p>${postData.content.replace(/\n/g, "<br>")}</p>
      ${mediaContent}
      <div class="post-stats d-flex align-items-center text-muted">
        <span class="reaction-container">
        ${reactionDisplay}
      </span>
      <span class="ms-auto">
        ${postData.comments.length} Comments
      </span>
      </div>
        </div>
        <div class="card-footer bg-transparent">
      <div class="post-actions d-flex justify-content-around">
        <button class="btn btn-light reaction-btn like-btn" data-post-id="${postData.postId}">
          <i class="bi ${likeButtonIcon}"></i>
          <span class="ms-2">${likeButtonText}</span>
        </button>
        <button class="btn btn-light reaction-btn">
          <i class="bi bi-chat-text"></i> <span class="ms-2">Comment</span>
        </button>
      </div>
        </div>
         `;

            addPostInteractions(newPost);
            return newPost;
        }


// Helper functions
        function getPrivacyIcon(privacy) {
            const icons = {
                PUBLIC: 'bi-globe',
                FRIENDS: 'bi-people-fill',
                PRIVATE: 'bi-lock-fill'
            };
            return icons[privacy] || 'bi-globe';
        }

        function generatePostDropdown(postData) {
            const dropdown =  `
            <button class="btn btn-light btn-sm dropdown-toggle" 
            type="button" 
            data-bs-toggle="dropdown" 
            aria-expanded="false">
      <i class="bi bi-three-dots"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
      ${postData.user.email === authData.email ? `
        <li><a class="dropdown-item edit-post-btn" data-post-id="${postData.postId}">
          <i class="bi bi-pencil-square me-2"></i>Edit
        </a></li>
        <li><a class="dropdown-item text-danger delete-post-btn" data-post-id="${postData.postId}">
          <i class="bi bi-trash me-2"></i>Delete
        </a></li>
      ` :`
      <li><a class="dropdown-item report-post-btn" data-post-id="${postData.postId}">
        <i class="bi bi-flag me-2"></i>Report
      </a></li>`}
      </ul>`;
            return dropdown;
        }

// Get Edit Modal elements (assumed to be defined in your HTML similar to your create post modal)
        const editPostModal = document.getElementById("editPostModal");
        const bsEditPostModal = new bootstrap.Modal(editPostModal);
        const editPostTextarea = editPostModal.querySelector(".edit-post-content-input");
        const editPostButton = editPostModal.querySelector("#saveEditPostBtn");
        const editMediaPreviewContainer = editPostModal.querySelector(".media-preview-container");

// File inputs for edit modal
        const editImageUpload = editPostModal.querySelector("#editImageUpload");
        const editVideoUpload = editPostModal.querySelector("#editVideoUpload");

// Array to store media files for the edit modal
        let editMediaFiles = [];

// When an edit button is clicked on a post, load post details (including existing media) into the edit modal.
        document.addEventListener("click", function (e) {
            if (e.target.closest(".edit-post-btn")) {
                const postId = e.target.closest(".edit-post-btn").getAttribute("data-post-id");
                $.ajax({
                    url: BASE_URL + "/profile/posts/" + postId,
                    type: "GET",
                    headers: {"Authorization": "Bearer " + authData.token},
                    success: function (response) {
                        // Assume response.data contains the post details including content and media
                        const postData = response.data;
                        window.currentPostData = response.data;
                        editPostTextarea.value = postData.content;
                        editMediaPreviewContainer.innerHTML = "";
                        editMediaFiles = []; // Reset the edit media files array

                        // Pre-populate existing media (if any)
                        if (postData.media && postData.media.length > 0) {
                            postData.media.forEach((media) => {
                                const mediaElement = document.createElement("div");
                                mediaElement.className = "media-preview-item position-relative mb-3";
                                mediaElement.dataset.type = media.mediaType === "IMAGE" ? "image" : "video";
                                mediaElement.dataset.filename = media.mediaUrl;
                                if (media.mediaType === "IMAGE") {
                                    mediaElement.innerHTML = `
                <img src="${media.mediaUrl}" class="img-fluid rounded" alt="Media Preview">
                <button type="button" class="btn-close position-absolute top-0 end-0 m-2 bg-light rounded-circle" aria-label="Remove"></button>
              `;
                                } else {
                                    mediaElement.innerHTML = `
                <video src="${media.mediaUrl}" class="img-fluid rounded" controls></video>
                <button type="button" class="btn-close position-absolute top-0 end-0 m-2 bg-light rounded-circle" aria-label="Remove"></button>
              `;
                                }

                                editMediaPreviewContainer.appendChild(mediaElement);
                                // Save as an "existing" media item (not a File object)
                                editMediaFiles.push({
                                    element: mediaElement,
                                    file: null,
                                    url: media.mediaUrl,
                                    type: media.mediaType === "IMAGE" ? "image" : "video",
                                    existing: true,
                                    deleted: false
                                });
                                // Add remove handler for each media item
                                mediaElement.querySelector(".btn-close").addEventListener("click", () => {
                                    const mediaItem = editMediaFiles.find(item => item.element === mediaElement);
                                    if (mediaItem) {
                                        mediaItem.deleted = true; // Add a deletion flag
                                    }
                                    mediaElement.remove();
                                    updateEditPostButtonState();
                                });
                            });
                        }
                        // Save the postId in a data attribute on the Save button.
                        editPostButton.setAttribute("data-post-id", postId);
                        bsEditPostModal.show();
                    },
                    error: function (error) {
                        Toast.fire({
                            icon: "error",
                            title: error.responseJSON?.message || "Failed to load post details"
                        });
                    }
                });
            }
        });

// Handle file selection for images and videos in the edit modal.
        editImageUpload.addEventListener("change", function (e) {
            handleEditMediaUpload(e.target.files, "image");
        });

        editVideoUpload.addEventListener("change", function (e) {
            handleEditMediaUpload(e.target.files, "video");
        });

        function handleEditMediaUpload(files, type) {
            const validImageTypes = ["image/jpeg", "image/png", "image/webp"];
            const validVideoTypes = ["video/mp4", "video/quicktime"];
            const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
            const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

            Array.from(files).forEach((file) => {
                // Validation checks
                if (type === "image" && !validImageTypes.includes(file.type)) {
                    Toast.fire({icon: "error", title: "Invalid image format (JPEG, PNG, WebP only)"});
                    return;
                }
                if (type === "video" && !validVideoTypes.includes(file.type)) {
                    Toast.fire({icon: "error", title: "Invalid video format (MP4, MOV only)"});
                    return;
                }
                if (type === "image" && file.size > MAX_IMAGE_SIZE) {
                    Toast.fire({icon: "error", title: "Image size exceeds 20MB limit"});
                    return;
                }
                if (type === "video" && file.size > MAX_VIDEO_SIZE) {
                    Toast.fire({icon: "error", title: "Video size exceeds 100MB limit"});
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    const mediaElement = document.createElement("div");
                    mediaElement.className = "media-preview-item position-relative mb-3";
                    mediaElement.dataset.type = type;
                    mediaElement.dataset.filename = file.name;
                    mediaElement.fileData = file;

                    if (type === "image") {
                        mediaElement.innerHTML = `
          <img src="${e.target.result}" class="img-fluid rounded" alt="Media Preview">
          <button type="button" class="btn-close position-absolute top-0 end-0 m-2 bg-light rounded-circle" aria-label="Remove"></button>
        `;
                    } else {
                        mediaElement.innerHTML = `
          <video src="${e.target.result}" class="img-fluid rounded" controls></video>
          <button type="button" class="btn-close position-absolute top-0 end-0 m-2 bg-light rounded-circle" aria-label="Remove"></button>
        `;
                    }
                    editMediaPreviewContainer.appendChild(mediaElement);
                    editMediaFiles.push({
                        element: mediaElement,
                        file: file,
                        type: type,
                        existing: false,
                        deleted: false
                    });
                    mediaElement.querySelector(".btn-close").addEventListener("click", () => {
                        editMediaFiles = editMediaFiles.filter(item => item.element !== mediaElement);
                        mediaElement.remove();
                        updateEditPostButtonState();
                    });
                    updateEditPostButtonState();
                };
                reader.readAsDataURL(file);
            });
        }

        function updateEditPostButtonState() {
            // Enable the Save Changes button if there's any content or media
            if (editPostTextarea.value.trim() || editMediaFiles.length > 0) {
                editPostButton.disabled = false;
            } else {
                editPostButton.disabled = true;
            }
        }

        editPostModal.addEventListener('show.bs.modal', function () {
            if (window.currentPostData) {
                const currentPrivacy = window.currentPostData.privacy;
                selectedPrivacy = {
                    icon: getPrivacyIcon(currentPrivacy),
                    text: currentPrivacy.charAt(0) + currentPrivacy.slice(1).toLowerCase()
                };
                updatePrivacyDropdown('edit');
            }
        });

// Confirm unsaved changes on modal close (similar to your create modal)
        editPostModal.addEventListener("hide.bs.modal", function (event) {
            const hasContent = editPostTextarea.value.trim() || editMediaFiles.length > 0;
            if (hasContent) {
                event.preventDefault();
                Swal.fire({
                    title: 'Unsaved Changes',
                    text: "You have unsaved changes. Are you sure you want to discard them?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Yes, discard',
                    cancelButtonText: 'No, keep editing'
                }).then((result) => {
                    if (result.isConfirmed) {
                        resetEditPostModal();
                        bsEditPostModal.hide();
                    }
                });
            }
        });

        function resetEditPostModal() {
            editPostTextarea.value = "";
            editMediaPreviewContainer.innerHTML = "";
            editMediaFiles = [];
            editPostButton.disabled = true;
            editImageUpload.value = "";
            editVideoUpload.value = "";
        }

        // Edit Post
        editPostButton.addEventListener("click", async function () {
            const postId = editPostButton.getAttribute("data-post-id");
            const updatedContent = editPostTextarea.value.trim();
            const OriginalEditPostButtonText = editPostButton.innerHTML;

            editPostButton.disabled = true;
            editPostButton.innerHTML = '<span class="spinner-border spinner-border-sm" style="color: white !important" role="status" aria-hidden="true"></span>';

            try {
                const formData = new FormData();
                formData.append("content", new Blob([updatedContent], {type: "text/plain"}));
                formData.append("privacy", new Blob([selectedPrivacy.text.toUpperCase()], {type: "text/plain"}));

                // Media to delete (append as strings)
                editMediaFiles.forEach(media => {
                    if (media.existing && media.deleted) {
                        formData.append(
                            "mediaToDelete",
                            new Blob([media.url], {type: "text/plain"})
                        );
                    }
                });

                // New media files (MultipartFile)
                editMediaFiles.forEach(media => {
                    if (!media.existing && !media.deleted) {
                        formData.append("newMedia", media.file);
                    }
                });

                const postResponse = await $.ajax({
                    url: BASE_URL + "/profile/posts/" + postId,
                    type: "PUT",
                    headers: {"Authorization": "Bearer " + authData.token},
                    data: formData,
                    processData: false,
                    contentType: false
                });

                if (postResponse.code === 200) {
                    loadPosts();
                    resetEditPostModal();
                    bsEditPostModal.hide();
                    selectedPrivacy = {icon: "bi-globe", text: "Public"};
                    updatePrivacyDropdown('edit');
                }
            } catch (error) {
                Toast.fire({icon: "error", title: error.responseJSON?.message || "Failed to update post"});
            } finally {
                editPostButton.disabled = false;
                editPostButton.innerHTML = OriginalEditPostButtonText;
            }
        });

        // Delete Post
        document.addEventListener("click", function (e) {
            if (e.target.closest(".delete-post-btn")) {
                const postId = e.target.closest(".delete-post-btn").getAttribute("data-post-id");
                Swal.fire({
                    title: "Are you sure?",
                    text: "This action cannot be undone!",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Yes, delete it!",
                    cancelButtonText: "Cancel"
                }).then((result) => {
                    if (result.isConfirmed) {
                        $.ajax({
                            url: BASE_URL + "/profile/posts/" + postId,
                            type: "DELETE",
                            headers: {"Authorization": "Bearer " + authData.token},
                            success: function (response) {
                                Toast.fire({icon: "success", title: "Post deleted successfully"});
                                loadPosts();
                            },
                            error: function (error) {
                                Toast.fire({
                                    icon: "error",
                                    title: error.responseJSON?.message || "Failed to delete post"
                                });
                            }
                        });
                    }
                });
            }
        });


        // Add new reaction constants at top
        const REACTION_TYPES = {
            LIKE: {icon: 'bi-hand-thumbs-up', fillIcon: 'bi-hand-thumbs-up-fill', color: 'text-primary'},
            LOVE: {icon: 'bi-heart', fillIcon: 'bi-heart-fill', color: 'text-danger'},
            HAHA: {icon: 'bi-emoji-laughing', fillIcon: 'bi-emoji-laughing-fill', color: 'text-warning'},
            WOW: {icon: 'bi-emoji-surprise', fillIcon: 'bi-emoji-surprise-fill', color: 'text-warning'},
            SAD: {icon: 'bi-emoji-frown', fillIcon: 'bi-emoji-frown-fill', color: 'text-secondary'},
            ANGRY: {icon: 'bi-emoji-angry', fillIcon: 'bi-emoji-angry-fill', color: 'text-danger'}
        };

// Replace old handleReaction with:
        async function handleReaction(likeBtn, reactionType) {
            const postId = likeBtn.dataset.postId;
            try {
                const response = await fetch(`${BASE_URL}/profile/posts/${postId}/reactions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authData.token}`
                    },
                    body: JSON.stringify({type: reactionType})
                });

                if (!response.ok) throw new Error('Failed to save reaction');

                const result = await response.json();
                updatePostReactions(likeBtn, result.data, result.message, reactionType);
            } catch (error) {
                Toast.fire({icon: 'error', title: 'Failed to save reaction'});
            }
        }

        function updatePostReactions(likeBtn, postData, action, reactionType) {
            const reactionStats = likeBtn.closest('.post-card').querySelector('.post-stats .reaction-container');

            // Step 1: Count the existing reactions from the response (post before update)
            const reactionCounts = {};
            postData.reactions.forEach(reaction => {
                reactionCounts[reaction.type] = (reactionCounts[reaction.type] || 0) + 1;
            });

            // Step 2: Manually adjust counts because backend does NOT return updated post
            switch (action) {
                case "Added":
                    reactionCounts[reactionType] = (reactionCounts[reactionType] || 0);
                    break;
                case "Removed":
                    reactionCounts[reactionType] = (reactionCounts[reactionType] || 0) - 1;
                    break;
                case "Updated":
                    reactionCounts[postData.reactionType] = (reactionCounts[postData.reactionType] || 0) - 1;
                    reactionCounts[reactionType] = (reactionCounts[reactionType] || 0) + 1;
                    break;
                default:
                    return;
            }

            // Ensure the count does not go negative
            if (reactionCounts[reactionType] <= 0) {
                delete reactionCounts[reactionType];
            }

            // Step 3: Update the reaction stats UI (e.g., 👍 2 ❤️ 3)
            reactionStats.innerHTML = Object.entries(reactionCounts)
                .map(([type, count]) => `<i class="bi ${REACTION_TYPES[type].fillIcon} ${REACTION_TYPES[type].color}"></i> ${count}`)
                .join(' • ');

            // Step 4: Update the button UI (change icon and text)
            if (action === "Added" || action === "Updated") {
                likeBtn.innerHTML = `<i class="bi ${REACTION_TYPES[reactionType].fillIcon} ${REACTION_TYPES[reactionType].color}"></i> <span>${reactionType}</span>`;
                createReactionAnimation(likeBtn, reactionType);
            } else {
                likeBtn.innerHTML = '<i class="bi bi-hand-thumbs-up"></i> <span>Like</span>';
            }
        }

        function createReactionPopup(likeBtn) {
            const popup = document.createElement('div');
            popup.className = 'reaction-popup';
            popup.style.position = 'absolute';
            popup.style.bottom = '100%';
            popup.style.left = '50%';
            popup.style.transform = 'translateX(-50%)';
            popup.style.background = 'white';
            popup.style.padding = '8px';
            popup.style.borderRadius = '20px';
            popup.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
            popup.style.display = 'flex';
            popup.style.gap = '8px';
            popup.style.zIndex = '1000';

            Object.entries(REACTION_TYPES).forEach(([type, {icon, fillIcon, color}]) => {
                const reactionBtn = document.createElement('button');
                reactionBtn.className = `btn btn-light reaction-option ${color}`;
                reactionBtn.innerHTML = `<i class="bi ${fillIcon}"></i>`;
                reactionBtn.style.padding = '4px';
                reactionBtn.style.minWidth = '32px';
                reactionBtn.style.height = '32px';
                reactionBtn.style.borderRadius = '50%';

                reactionBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleReaction(likeBtn, type);
                    popup.remove();
                });

                // Hover animation
                reactionBtn.addEventListener('mouseenter', () => {
                    reactionBtn.style.transform = 'scale(1.2)';
                    reactionBtn.style.transition = 'transform 0.2s';
                });

                reactionBtn.addEventListener('mouseleave', () => {
                    reactionBtn.style.transform = 'scale(1)';
                });

                popup.appendChild(reactionBtn);
            });

            return popup;
        }

        // Add interactions to posts (like, comment, share)
        function addPostInteractions(postElement) {
            if (!postElement) return;

            // Like functionality
            const likeBtn = postElement.querySelector(".reaction-btn:first-child");
            if (likeBtn) {
                likeBtn.addEventListener('mouseenter', () => {
                    reactionTimeout = setTimeout(() => {
                        const popup = createReactionPopup(likeBtn);
                        likeBtn.appendChild(popup);
                    }, 500);
                });

                likeBtn.addEventListener('mouseleave', () => {
                    clearTimeout(reactionTimeout);
                    const popup = likeBtn.querySelector('.reaction-popup');
                    if (popup) {
                        popup.remove();
                    }
                });

                likeBtn.addEventListener('click', () => {
                    const iconElement = likeBtn.querySelector('i'); // Get the <i> element inside the button
                    if (!iconElement) return handleReaction(likeBtn, 'LIKE'); // Default to LIKE if no icon is found

                    // Find the reaction type by checking which icon class is applied
                    let currentReaction = 'LIKE'; // Default reaction
                    for (const [reaction, data] of Object.entries(REACTION_TYPES)) {
                        if (iconElement.classList.contains(data.fillIcon) || iconElement.classList.contains(data.icon)) {
                            currentReaction = reaction;
                            break; // Found the reaction, no need to continue checking
                        }
                    }

                    handleReaction(likeBtn, currentReaction);
                });

            }

            // Comment functionality
            const commentBtn = postElement.querySelector(".reaction-btn:nth-child(2)");
            if (commentBtn) {
                commentBtn.addEventListener("click", function () {
                    const postId = postElement.dataset.postId;
                    let commentSection = postElement.querySelector(".comment-section");

                    if (!commentSection) {
                        commentSection = document.createElement("div");
                        commentSection.className = "comment-section p-3 border-top";
                        commentSection.dataset.postId = postId;

                        commentSection.innerHTML = `
                             <div class="d-flex">
                                 <div class="flex-grow-1">
                                    <div class="input-group">
                                        <input type="text" class="form-control comment-input" placeholder="Write a comment...">
                                        <button class="btn btn-primary comment-send-btn" disabled>
                                            <i class="bi bi-send"></i>
                                        </button>
                                    </div>
                                 </div>
                               </div>
                            <div class="comments-list mt-3"></div>
                            `;

                        postElement
                            .querySelector(".card-footer")
                            .insertBefore(
                                commentSection,
                                postElement.querySelector(".post-actions")
                            );

                        // Add comment input functionality
                        const commentInput = commentSection.querySelector(".comment-input");
                        const sendCommentBtn =
                            commentSection.querySelector(".comment-send-btn");

                        commentInput.addEventListener("input", function () {
                            sendCommentBtn.disabled = this.value.trim() === "";
                        });

                        commentInput.addEventListener("focus", function () {
                            commentSection.classList.add("active-comment-section");
                        });

                        sendCommentBtn.addEventListener("click", function () {
                            const commentText = commentInput.value.trim();
                            if (commentText) {
                                addComment(postElement, commentSection, commentText);
                                commentInput.value = "";
                                sendCommentBtn.disabled = true;
                            }
                        });

                        commentInput.addEventListener("keypress", function (e) {
                            if (e.key === "Enter" && this.value.trim()) {
                                addComment(postElement, commentSection, this.value.trim());
                                this.value = "";
                                sendCommentBtn.disabled = true;
                            }
                        });

                        // Focus the input
                        commentInput.focus();

                        loadPostComments(postElement, commentSection);
                    } else {
                        // Toggle comment section
                        commentSection.classList.toggle("d-none");
                        if (!commentSection.classList.contains("d-none")) {
                            commentSection.querySelector(".comment-input").focus();
                        }
                    }
                });
            }

            // Add hover effect
            postElement.addEventListener("mouseenter", function () {
                this.classList.add("post-hover");
            });

            postElement.addEventListener("mouseleave", function () {
                this.classList.remove("post-hover");
            });
        }

        function createReactionAnimation(element, reactionType) {
            const animation = document.createElement('div');
            animation.className = 'reaction-animation';
            animation.innerHTML = `<i class="bi ${REACTION_TYPES[reactionType].fillIcon} ${REACTION_TYPES[reactionType].color}"></i>`;

            // Add animation styles
            animation.style.position = 'absolute';
            animation.style.pointerEvents = 'none';
            animation.style.animation = 'reaction-float 1s ease-out forwards';
            animation.style.fontSize = '1.5rem';

            element.appendChild(animation);

            // Remove after animation
            setTimeout(() => {
                if (element.contains(animation)) {
                    element.removeChild(animation);
                }
            }, 1000);
        }

        async function addComment(postElement, commentSection, commentText, parentCommentId = 0) {
            const postId = postElement.dataset.postId;

            try {
                const response = await fetch(`${BASE_URL}/profile/posts/${postId}/comments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authData.token}`
                    },
                    body: JSON.stringify({
                        content: commentText,
                        parentCommentId: parentCommentId || 0
                    })
                });

                if (!response.ok) throw new Error('Failed to add comment');

                // Reload comments
                await loadPostComments(postElement, commentSection);
            } catch (error) {
                Toast.fire({icon: 'error', title: error.message});
            }
        }

        async function loadPostComments(postElement, commentSection) {
            const postId = postElement.dataset.postId;
            if (!postId) {
                console.error("No postId found for post element");
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}/profile/posts/${postId}`, {
                    headers: {'Authorization': `Bearer ${authData.token}`}
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const responseData = await response.json();
                if (responseData.code !== 200) {
                    throw new Error(responseData.message || "Failed to load comments");
                }

                const commentsContainer = commentSection.querySelector('.comments-list');
                commentsContainer.innerHTML = '';

                // Create a comment map to easily find parent comments
                const commentMap = new Map();

                // First, create map entries for all comments
                responseData.data.comments.forEach(comment => {
                    commentMap.set(comment.commentId, comment);
                });

                renderComments(commentsContainer, responseData.data.comments);
            } catch (error) {
                console.error("Error loading comments:", error);
                Toast.fire({
                    icon: "error",
                    title: error.message || "Failed to load comments"
                });
            }
        }

        function renderComments(container, comments, depth = 0) {
            container.innerHTML = '';

            if (!comments || comments.length === 0) {
                if (depth === 0) { // Only show "No comments" for top-level
                    container.innerHTML = '<div class="text-muted">No comments yet</div>';
                }
                return;
            }

            // Filter comments based on depth
            // For top-level (depth = 0), only show comments with parentCommentId = 0
            // For nested levels, show all replies as they're already filtered by parent
            const filteredComments = depth === 0
                ? comments.filter(comment => comment.parentCommentId === 0)
                : comments;

            filteredComments.forEach(comment => {
                const commentElement = createCommentElement(comment, depth);
                container.appendChild(commentElement);

                if (comment.replies && comment.replies.length > 0) {
                    const repliesContainer = document.createElement('div');
                    repliesContainer.className = `replies-container ms-${depth + 3}`; // Increased indentation
                    renderComments(repliesContainer, comment.replies, depth + 1);
                    commentElement.querySelector('.comment-bubble').appendChild(repliesContainer);
                }
            });
        }

        function createCommentElement(comment, depth) {
            const commentEl = document.createElement('div');
            commentEl.className = `comment-item my-2 ms-${depth * 3}`;
            commentEl.dataset.commentId = comment.commentId;
            commentEl.dataset.authorId = comment.user.userId;

            commentEl.innerHTML = `
        <div class="comment-bubble p-2 rounded">
            <div class="d-flex align-items-center">
                <img src="${comment.user.profilePictureUrl}" 
                     class="rounded-circle me-2" 
                     width="32" height="32">
                <div>
                    <h6 class="mb-0">${comment.user.firstName} ${comment.user.lastName}</h6>
                    <small class="text-muted">${formatCommentDate(comment.createdAt)}</small>
                </div>
            </div>
            <p class="mb-0 mt-2 ms-3">${comment.content}</p>
            <div class="comment-actions mt-2">
                <button class="btn btn-sm text-muted reply-btn">
                    <i class="bi bi-reply"></i> Reply
                </button>
                ${comment.user.email === authData.email ? `
                <button class="btn btn-sm text-danger delete-comment-btn">
                    <i class="bi bi-trash"></i> Delete
                </button>
                ` : ''}
            </div>
            <div class="reply-input-container mt-2 d-none"></div>
        </div>
        `;

            // Add reply handler
            commentEl.querySelector('.reply-btn').addEventListener('click', () => {
                showReplyInput(commentEl, comment.commentId);
            });

            // Add delete handler
            if (comment.user.email === authData.email) {
                commentEl.querySelector('.delete-comment-btn').addEventListener('click', async () => {
                    await deleteComment(commentEl);
                });
            }

            return commentEl;
        }

        // Helper function to format comment date
        function formatCommentDate(dateString) {
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
                })
            } else if (days > 0) {
                return `${days}d ago`;
            } else if (hours > 0) {
                return `${hours}h ago`;
            } else if (minutes > 0) {
                return `${minutes}m ago`;
            } else {
                return 'Just now';
            }
        }

        async function deleteComment(commentElement) {
            const commentId = commentElement.dataset.commentId;
            const postElement = commentElement.closest('.post-card');

            try {
                const response = await fetch(`${BASE_URL}/profile/comments/${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${authData.token}`
                    }
                });

                if (response.ok) {
                    commentElement.remove();
                    // Update comment count
                    // const commentCountElement = postElement.querySelector('.post-stats span:last-child');
                    // const currentCount = parseInt(commentCountElement.textContent.match(/\d+/)[0]) || 0;
                    // commentCountElement.textContent = `${currentCount - 1} Comments`;
                }
            } catch (error) {
                Toast.fire({icon: 'error', title: 'Failed to delete comment'});
            }
        }

        function showReplyInput(commentElement, parentCommentId) {
            const inputContainer = commentElement.querySelector('.reply-input-container');
            inputContainer.classList.remove('d-none');

            if (!inputContainer.querySelector('.reply-input')) {
                inputContainer.innerHTML = `
            <div class="input-group mt-2">
                <input type="text" class="form-control reply-input" 
                       placeholder="Write a reply...">
                <button class="btn btn-primary btn-send-reply">
                    <i class="bi bi-send"></i>
                </button>
            </div>
        `;

                const input = inputContainer.querySelector('.reply-input');
                const sendBtn = inputContainer.querySelector('.btn-send-reply');

                sendBtn.addEventListener('click', async () => {
                    const replyText = input.value.trim();
                    if (replyText) {
                        const postElement = commentElement.closest('.post-card');
                        const commentSection = postElement.querySelector('.comment-section');

                        try {
                            const response = await fetch(`${BASE_URL}/profile/comments/${parentCommentId}/reply`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${authData.token}`
                                },
                                body: JSON.stringify({
                                    content: replyText
                                })
                            });

                            if (response.ok) {
                                input.value = '';
                                await loadPostComments(postElement, commentSection);
                            }
                        } catch (error) {
                            Toast.fire({icon: 'error', title: 'Failed to post reply'});
                        }
                    }
                });
            }
        }

        // Add interactions to existing posts
        document.querySelectorAll(".post-card").forEach((post) => {
            addPostInteractions(post);
        });

        // document.addEventListener("click", function (e) {
        //     if (e.target.closest(".share-post-btn")) {
        //         const post = e.target.closest(".post-card");
        //         const postContent = post.querySelector(".card-body p").textContent;
        //         const shareModal = new bootstrap.Modal(
        //             document.getElementById("shareModal")
        //         );
        //
        //         // Set modal textarea to post content
        //         document.getElementById("shareModal").querySelector("textarea").value =
        //             postContent;
        //
        //         // Show the modal
        //         shareModal.show();
        //     }
        // });
        //
        // // Share Modal Handler
        // document
        //     .getElementById("shareModal")
        //     .querySelector(".btn-post")
        //     .addEventListener("click", function () {
        //         const shareMessage = document
        //             .getElementById("shareModal")
        //             .querySelector("textarea").value;
        //         const privacy = document
        //             .querySelector(".btn-share-option.active")
        //             .textContent.trim();
        //
        //         // Add shared post to timeline (example function)
        //         createNewPost(`Shared with ${privacy}: \n\n ${shareMessage}`, []);
        //
        //         // Hide the modal
        //         const shareModal = bootstrap.Modal.getInstance(
        //             document.getElementById("shareModal")
        //         );
        //         shareModal.hide();
        //     });
        //
        // // Share Option Selection
        // document.querySelectorAll(".btn-share-option").forEach((btn) => {
        //     btn.addEventListener("click", function () {
        //         document
        //             .querySelectorAll(".btn-share-option")
        //             .forEach((b) => b.classList.remove("active"));
        //         this.classList.add("active");
        //     });
        // });
        //
        // // Clean up backdrop and styles after modal is hidden
        // document
        //     .getElementById("shareModal")
        //     .addEventListener("hidden.bs.modal", function () {
        //         // Remove the backdrop manually if it's stuck
        //         const modalBackdrop = document.querySelector(".modal-backdrop");
        //         if (modalBackdrop) {
        //             modalBackdrop.remove();
        //         }
        //
        //         // Ensure 'modal-open' class is removed from the body
        //         document.body.classList.remove("modal-open");
        //
        //         // Reset any inline padding-right (used to compensate for scrollbar)
        //         document.body.style.paddingRight = "";
        //
        //         // Re-enable scrolling in case it's disabled
        //         document.body.style.overflow = ""; // Ensures scrolling is allowed
        //     });

        // Create improved chat modal with two-sided conversation layout
        function createChatModal() {
            // Create the chat modal if it doesn't exist
            if (!document.getElementById("chatModal")) {
                const modalElement = document.createElement("div");
                modalElement.className = "modal fade";
                modalElement.id = "chatModal";
                modalElement.tabIndex = "-1";
                modalElement.setAttribute("aria-labelledby", "chatModalLabel");
                modalElement.setAttribute("aria-hidden", "true");

                modalElement.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header gradient-bg">
            <div class="d-flex align-items-center">
              <img src="" alt="Profile" class="chat-user-img rounded-circle me-2" width="40" height="40">
              <h5 class="modal-title text-white" id="chatModalLabel">Chat</h5>
              <small class="text-white-50 ms-2 online-status">
                <span class="online-indicator me-1"></span>Online
              </small>
            </div>
            <div>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
          </div>
          <div class="modal-body p-0">
            <!-- Chat header with date -->
            <div class="chat-date-header text-center py-2">
              <small class="text-muted">Today</small>
            </div>
            
            <!-- Chat messages container -->
            <div class="chat-messages p-3" style="height: 350px; overflow-y: auto;">
              <!-- Messages will be added here -->
            </div>
          </div>
          <div class="modal-footer p-2">
            <div class="input-group">
              <button class="btn btn-light chat-emoji-btn">
                <i class="bi bi-emoji-smile"></i>
              </button>
              <button class="btn btn-light">
                <i class="bi bi-paperclip"></i>
              </button>
              <input type="text" class="form-control chat-input" placeholder="Type a message...">
              <button class="btn btn-primary send-message-btn">
                <i class="bi bi-send-fill"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
        `;

                document.body.appendChild(modalElement);

                // Add CSS for the two-sided chat layout
                addChatStyles();

                // Add send message functionality
                const chatModal = document.getElementById("chatModal");
                const chatInput = chatModal.querySelector(".chat-input");
                const sendBtn = chatModal.querySelector(".send-message-btn");
                const emojiBtn = chatModal.querySelector(".chat-emoji-btn");

                // Send message on button click
                sendBtn.addEventListener("click", function () {
                    sendChatMessage(chatInput.value);
                });

                // Send message on Enter key
                chatInput.addEventListener("keypress", function (e) {
                    if (e.key === "Enter") {
                        sendChatMessage(chatInput.value);
                    }
                });

                // Add emoji button functionality
                emojiBtn.addEventListener("click", () =>
                    initEmojiPicker(chatInput, emojiBtn)
                );

                // Add attachment button functionality
                const attachBtn = chatModal.querySelector(".bi-paperclip").parentElement;
                attachBtn.addEventListener("click", function () {
                    // Create file input
                    const fileInput = document.createElement("input");
                    fileInput.type = "file";
                    fileInput.accept = "image/*";
                    fileInput.click();

                    fileInput.addEventListener("change", function (e) {
                        if (e.target.files.length > 0) {
                            const file = e.target.files[0];
                            const reader = new FileReader();

                            reader.onload = function (e) {
                                sendImageMessage(e.target.result);
                            };

                            reader.readAsDataURL(file);
                        }
                    });
                });
            }
        }

        // Add necessary styles for the chat modal
        function addChatStyles() {
            // Check if styles already exist
            if (!document.getElementById("chat-modal-styles")) {
                const styleElement = document.createElement("style");
                styleElement.id = "chat-modal-styles";

                styleElement.innerHTML = `
      .gradient-bg {
        background: linear-gradient(135deg, #6366f1, #3b82f6);
      }
      
      .online-indicator {
        display: inline-block;
        width: 8px;
        height: 8px;
        background-color: #10b981;
        border-radius: 50%;
      }
      
      .chat-date-header {
        position: sticky;
        top: 0;
        background-color: rgba(255, 255, 255, 0.9);
        z-index: 1;
      }
      
      .chat-message {
        max-width: 75%;
        margin-bottom: 15px;
        clear: both;
      }
      
      .chat-message-received {
        float: left;
      }
      
      .chat-message-sent {
        float: right;
      }
      
      .message-content {
        padding: 10px 12px;
        border-radius: 18px;
        position: relative;
        word-wrap: break-word;
      }
      
      .chat-message-received .message-content {
        background-color: #f3f4f6;
        border-bottom-left-radius: 5px;
      }
      
      .chat-message-sent .message-content {
        background-color: #3b82f6;
        color: white;
        border-bottom-right-radius: 5px;
      }
      
      .chat-message-received .message-time {
        text-align: left;
        display: block;
        margin-top: 2px;
        font-size: 0.7rem;
      }
      
      .chat-message-sent .message-time {
        text-align: right;
        display: block;
        margin-top: 2px;
        font-size: 0.7rem;
      }
      
      .chat-user-img {
        object-fit: cover;
      }
      
      .message-image {
        max-width: 200px;
        border-radius: 12px;
        margin-bottom: 5px;
      }
      
      .chat-typing-indicator {
        display: flex;
        padding: 5px 10px;
        background-color: #f3f4f6;
        border-radius: 18px;
        width: fit-content;
      }
      
      .typing-dot {
        width: 8px;
        height: 8px;
        background-color: #9ca3af;
        border-radius: 50%;
        margin: 0 2px;
        animation: typing-animation 1.4s infinite ease-in-out;
      }
      
      .typing-dot:nth-child(1) {
        animation-delay: 0s;
      }
      
      .typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      @keyframes typing-animation {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-5px); }
      }
      
      /* Message status indicators */
      .message-status {
        font-size: 0.7rem;
        text-align: right;
        margin-top: 2px;
      }
      
      .message-status i {
        margin-left: 5px;
      }
      
      .emoji-container {
        position: absolute;
        bottom: 100%;
        right: 0;
        background-color: white;
        border: 1px solid #dee2e6;
        border-radius: 0.375rem;
        width: 250px;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        z-index: 1060;
        display: flex;
        flex-wrap: wrap;
        padding: 0.5rem;
      }
      
      .emoji-item {
        cursor: pointer;
        font-size: 1.5rem;
        padding: 0.25rem;
        transition: transform 0.2s ease;
      }
      
      .emoji-item:hover {
        transform: scale(1.2);
      }
     `;

                document.head.appendChild(styleElement);
            }
        }

        // Chat Modal Functionality
        createChatModal();

        // Add click event to quick chat items
        document.querySelectorAll(".list-group-item-action").forEach((chatItem) => {
            chatItem.addEventListener("click", function (e) {
                e.preventDefault();

                // Get user info from the clicked item
                const userImg = this.querySelector("img").src;
                const userName = this.querySelector("h6").textContent;

                // Open chat modal with this user
                openChatModal(userName, userImg);
            });
        });

        // Open chat modal with specified user
        function openChatModal(userName, userImg) {
            createChatModal(); // Ensure the modal exists

            const chatModal = document.getElementById("chatModal");
            const modalTitle = chatModal.querySelector("#chatModalLabel");
            const userImage = chatModal.querySelector(".chat-user-img");
            const chatMessages = chatModal.querySelector(".chat-messages");

            // Set user info
            modalTitle.textContent = userName;
            userImage.src = userImg;

            // Clear previous messages
            chatMessages.innerHTML = "";

            // Add sample conversation
            const messages = [
                {
                    sender: "other",
                    text: "Hey there! How are you doing today?",
                    time: "10:30 AM",
                },
                {
                    sender: "me",
                    text: "I'm good! Just checking out this new platform.",
                    time: "10:32 AM",
                },
                {
                    sender: "other",
                    text: "It looks great! Have you tried posting anything yet?",
                    time: "10:33 AM",
                },
                {
                    sender: "me",
                    text: "Yes, I just made my first post a few minutes ago. The interface is really intuitive!",
                    time: "10:35 AM",
                },
                {
                    sender: "other",
                    text: "That's awesome! I'd love to see what you posted.",
                    time: "10:36 AM",
                    status: "read",
                },
                {
                    sender: "other",
                    image: "https://via.placeholder.com/300x200",
                    time: "10:37 AM",
                },
                {
                    sender: "me",
                    text: "Check out my profile when you get a chance. I shared some photos from the weekend meetup.",
                    time: "10:38 AM",
                    status: "sent",
                },
            ];

            messages.forEach((msg) => {
                if (msg.image) {
                    addImageMessage(msg.image, msg.sender === "me", msg.time, msg.status);
                } else {
                    addTextMessage(msg.text, msg.sender === "me", msg.time, msg.status);
                }
            });

            // Add typing indicator
            addTypingIndicator();

            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Show the modal
            const modal = new bootstrap.Modal(chatModal);
            modal.show();

            // Focus on input when shown
            chatModal.addEventListener("shown.bs.modal", function () {
                chatModal.querySelector(".chat-input").focus();
            });
        }

        // Add a text message to the chat
        function addTextMessage(text, isSent, time, status) {
            const chatMessages = document.querySelector(".chat-messages");
            const messageEl = document.createElement("div");

            messageEl.className = `chat-message ${
                isSent ? "chat-message-sent" : "chat-message-received"
            }`;

            let statusHTML = "";
            if (isSent && status) {
                if (status === "sent") {
                    statusHTML = `<span class="message-status"><i class="bi bi-check"></i></span>`;
                } else if (status === "delivered") {
                    statusHTML = `<span class="message-status"><i class="bi bi-check-all"></i></span>`;
                } else if (status === "read") {
                    statusHTML = `<span class="message-status"><i class="bi bi-check-all text-primary"></i></span>`;
                }
            }

            messageEl.innerHTML = `
        <div class="message-content">
      <p class="mb-0">${text}</p>
        </div>
        <small class="text-muted message-time">${time} ${statusHTML}</small>
        `;

            chatMessages.appendChild(messageEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Add an image message to the chat
        function addImageMessage(imageUrl, isSent, time, status) {
            const chatMessages = document.querySelector(".chat-messages");
            const messageEl = document.createElement("div");

            messageEl.className = `chat-message ${
                isSent ? "chat-message-sent" : "chat-message-received"
            }`;

            let statusHTML = "";
            if (isSent && status) {
                if (status === "sent") {
                    statusHTML = `<span class="message-status"><i class="bi bi-check"></i></span>`;
                } else if (status === "delivered") {
                    statusHTML = `<span class="message-status"><i class="bi bi-check-all"></i></span>`;
                } else if (status === "read") {
                    statusHTML = `<span class="message-status"><i class="bi bi-check-all text-primary"></i></span>`;
                }
            }

            messageEl.innerHTML = `
     <div class="message-content">
      <img src="${imageUrl}" class="message-image" alt="Shared image">
        </div>
     <small class="text-muted message-time">${time} ${statusHTML}</small>
    `;

            chatMessages.appendChild(messageEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Add typing indicator to the chat
        function addTypingIndicator() {
            const chatMessages = document.querySelector(".chat-messages");
            const typingEl = document.createElement("div");
            typingEl.className =
                "chat-message chat-message-received typing-indicator-container";

            typingEl.innerHTML = `
        <div class="chat-typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
        </div>
    `;

            chatMessages.appendChild(typingEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Remove typing indicator after 3 seconds
            setTimeout(() => {
                if (document.body.contains(typingEl)) {
                    typingEl.remove();
                }
            }, 3000);
        }

        // Send a text message from the current user
        function sendChatMessage(text) {
            if (!text.trim()) return;

            const chatInput = document.querySelector(".chat-input");

            // Format current time
            const now = new Date();
            const hours = now.getHours() % 12 || 12;
            const minutes = now.getMinutes().toString().padStart(2, "0");
            const ampm = now.getHours() >= 12 ? "PM" : "AM";
            const time = `${hours}:${minutes} ${ampm}`;

            // Add sent message
            addTextMessage(text, true, time, "sent");

            // Clear input
            chatInput.value = "";

            // Simulate message status change
            const sentMessages = document.querySelectorAll(".chat-message-sent");
            const lastSentMessage = sentMessages[sentMessages.length - 1];

            // Change to 'delivered' after 1 second
            setTimeout(() => {
                if (lastSentMessage) {
                    const statusSpan = lastSentMessage.querySelector(".message-status");
                    if (statusSpan) {
                        statusSpan.innerHTML = '<i class="bi bi-check-all"></i>';
                    }
                }
            }, 1000);

            // Change to 'read' after 2 seconds
            setTimeout(() => {
                if (lastSentMessage) {
                    const statusSpan = lastSentMessage.querySelector(".message-status");
                    if (statusSpan) {
                        statusSpan.innerHTML = '<i class="bi bi-check-all text-primary"></i>';
                    }
                }
            }, 2000);

            // Simulate response after delay
            simulateResponse();
        }

        // Send an image message from the current user
        function sendImageMessage(imageUrl) {
            // Format current time
            const now = new Date();
            const hours = now.getHours() % 12 || 12;
            const minutes = now.getMinutes().toString().padStart(2, "0");
            const ampm = now.getHours() >= 12 ? "PM" : "AM";
            const time = `${hours}:${minutes} ${ampm}`;

            // Add sent message
            addImageMessage(imageUrl, true, time, "sent");

            // Simulate message status change
            const sentMessages = document.querySelectorAll(".chat-message-sent");
            const lastSentMessage = sentMessages[sentMessages.length - 1];

            // Change to 'delivered' after 1 second
            setTimeout(() => {
                if (lastSentMessage) {
                    const statusSpan = lastSentMessage.querySelector(".message-status");
                    if (statusSpan) {
                        statusSpan.innerHTML = '<i class="bi bi-check-all"></i>';
                    }
                }
            }, 1000);

            // Simulate response after delay
            simulateResponse();
        }

        // Simulate a response from the other user
        function simulateResponse() {
            // First show typing indicator
            setTimeout(() => {
                addTypingIndicator();

                // Then show the response message
                setTimeout(() => {
                    const responseOptions = [
                        "That's great! Thanks for sharing.",
                        "I see what you mean. Let's discuss this further.",
                        "Interesting point! I hadn't thought of it that way.",
                        "Thanks for the update. I'll check it out soon.",
                        "Sounds good to me! Let's plan to meet up later.",
                    ];

                    const randomResponse =
                        responseOptions[Math.floor(Math.random() * responseOptions.length)];

                    // Format current time
                    const now = new Date();
                    const hours = now.getHours() % 12 || 12;
                    const minutes = now.getMinutes().toString().padStart(2, "0");
                    const ampm = now.getHours() >= 12 ? "PM" : "AM";
                    const time = `${hours}:${minutes} ${ampm}`;

                    // Remove typing indicator and add response
                    const typingIndicator = document.querySelector(
                        ".typing-indicator-container"
                    );
                    if (typingIndicator) typingIndicator.remove();

                    addTextMessage(randomResponse, false, time);
                }, 2000);
            }, 1000);
        }

        // Report Post Functionality
        let currentReportPostId = null;

        document.addEventListener('click', function(e) {
            if (e.target.closest('.report-post-btn')) {
                const postId = e.target.closest('.report-post-btn').dataset.postId;
                showReportPostModal(postId);
            }
        });

// Initialize report modal
        function initializeReportModal() {
            // Handle report type selection
            document.querySelectorAll('#reportTypeDropdown + .dropdown-menu .dropdown-item').forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    const value = this.dataset.value;
                    document.getElementById('reportTypeDropdown').textContent = this.textContent;
                    document.getElementById('reportTypeDropdown').dataset.selected = value;
                    document.getElementById('typeError').style.display = 'none';
                });
            });

            // Handle priority selection
            document.querySelectorAll('#priorityDropdown + .dropdown-menu .dropdown-item').forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    const value = this.dataset.value;
                    document.getElementById('priorityDropdown').textContent = this.textContent;
                    document.getElementById('priorityDropdown').dataset.selected = value;
                });
            });

            // Submit report handler
            document.getElementById('submitReportBtn').addEventListener('click', submitReport);
        }

// Function to show report modal
        function showReportPostModal(postId) {
            currentReportPostId = postId;
            const modal = new bootstrap.Modal(document.getElementById('reportPostModal'));
            modal.show();
        }

// Form validation
        function validateReportForm() {
            let isValid = true;

            const reportType = document.getElementById('reportTypeDropdown').dataset.selected;
            if (!reportType) {
                document.getElementById('typeError').textContent = 'Please select a report type';
                document.getElementById('typeError').style.display = 'block';
                isValid = false;
            }

            const description = document.getElementById('reportDescription').value.trim();
            if (description.length < 20) {
                document.getElementById('descriptionError').textContent = 'Description must be at least 20 characters';
                document.getElementById('descriptionError').style.display = 'block';
                isValid = false;
            }

            return isValid;
        }

// Submit report
        async function submitReport() {
            const reportButton = document.getElementById('submitReportBtn');
            const OriginalReportButtonText = reportButton.innerHTML;

            if (!validateReportForm()) return;

            const reportData = {
                postId: currentReportPostId,
                type: document.getElementById('reportTypeDropdown').dataset.selected,
                priority: document.getElementById('priorityDropdown').dataset.selected || 'LOW',
                description: document.getElementById('reportDescription').value.trim(),
            };

            reportButton.disabled = true;
            reportButton.innerHTML = `<span class="spinner-border  spinner-border-sm" style="color: white !important" role="status" aria-hidden="true"></span>`;

            Swal.fire({
                title: "Are you sure?",
                text: "This action cannot be undone!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, submit report!",
                cancelButtonText: "Cancel"
            }).then(async (result) => {
                try {
                    const response = await fetch(`${BASE_URL}/timeline/posts/report`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authData.token}`
                        },
                        body: JSON.stringify(reportData)
                    });

                    if (!response.ok) throw new Error('Failed to submit report');

                    Toast.fire({icon: 'success', title: 'Report Submitted'});

                    // Reset form
                    document.getElementById('reportPostModal').querySelectorAll('.dropdown-toggle').forEach(el => {
                        el.textContent = el.id === 'reportTypeDropdown' ? 'Select Report Type' : 'Select Priority';
                        delete el.dataset.selected;
                    });
                    document.getElementById('reportDescription').value = '';
                    bootstrap.Modal.getInstance(document.getElementById('reportPostModal')).hide();
                } catch (error) {
                    Toast.fire({icon: 'error', title: error.message || 'Submission Failed'});
                } finally {
                    reportButton.disabled = false;
                    reportButton.innerHTML = OriginalReportButtonText;
                }
            });
        }
    }
});
