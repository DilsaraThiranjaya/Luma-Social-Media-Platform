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

    if (authData?.token) {
        try {
            // Check token expiration first
            if (isTokenExpired(authData.token)) {
                await refreshAuthToken();
            }
            initializeUI();
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

        // Initialize tooltips and popovers
        const tooltipTriggerList = document.querySelectorAll(
            '[data-bs-toggle="tooltip"]'
        );
        const tooltipList = [...tooltipTriggerList].map(
            (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
        );

        // Post Modal Functionality
        const postModal = document.getElementById("postModal");
        const postTextarea = document.querySelector(".post-content-input");
        const postButton = document.querySelector(".btn-post");
        const mediaPreviewContainer = document.querySelector(
            ".media-preview-container"
        );

        let selectedPrivacy = {
            icon: "bi-globe",
            text: "Public"
        };

        const dropdownButton = document.querySelector('.dropdown-toggle[data-bs-toggle="dropdown"]');
        dropdownButton.innerHTML = `
        <i class="bi ${selectedPrivacy.icon} me-1"></i>${selectedPrivacy.text}`;

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

        // Media upload function
        function handleMediaUpload(files, type) {
            Array.from(files).forEach((file) => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const mediaElement = document.createElement("div");
                    mediaElement.className = "media-preview-item position-relative mb-3";

                    if (type === "image") {
                        mediaElement.innerHTML = `
            <img src="${e.target.result}" class="img-fluid rounded" alt="Media Preview">
            <button type="button" class="btn-close position-absolute top-0 end-0 m-2 bg-light rounded-circle" aria-label="Remove"></button>
          `;
                    } else if (type === "video") {
                        mediaElement.innerHTML = `
            <video src="${e.target.result}" class="img-fluid rounded" controls></video>
            <button type="button" class="btn-close position-absolute top-0 end-0 m-2 bg-light rounded-circle" aria-label="Remove"></button>
          `;
                    }

                    mediaPreviewContainer.appendChild(mediaElement);

                    // Remove button functionality
                    mediaElement
                        .querySelector(".btn-close")
                        .addEventListener("click", function () {
                            mediaElement.remove();
                            updatePostButtonState();
                        });

                    updatePostButtonState();
                };
                reader.readAsDataURL(file);
            });
        }

        // Update post button state based on content
        function updatePostButtonState() {
            postButton.disabled =
                postTextarea.value.trim() === "" &&
                mediaPreviewContainer.children.length === 0;
        }

        // Listen for textarea input
        postTextarea.addEventListener("input", updatePostButtonState);

        // Emoji Picker Functionality
        function initEmojiPicker(targetInput, emojiButton) {
            let emojiContainer = document.querySelector(".emoji-container");

            if (!emojiContainer) {
                emojiContainer = document.createElement("div");
                emojiContainer.className =
                    "emoji-container p-2 border rounded shadow bg-white";
                emojiContainer.style.position = "absolute";
                emojiContainer.style.zIndex = "1050";
                emojiContainer.style.width = "250px";
                emojiContainer.style.bottom = "0";
                emojiContainer.style.right = "0";

                const commonEmojis = [
                    "😀",
                    "😂",
                    "😊",
                    "😍",
                    "🥰",
                    "😎",
                    "😇",
                    "🤔",
                    "😄",
                    "😅",
                    "😉",
                    "😋",
                    "😘",
                    "🥳",
                    "😮",
                    "😢",
                    "😡",
                    "👍",
                    "👎",
                    "❤️",
                    "🔥",
                    "✨",
                    "🎉",
                    "👏",
                    "🙏",
                    "💯",
                    "💪",
                    "🤝",
                    "🫡",
                    "🙌",
                ];
                emojiContainer.innerHTML = `<div class="d-flex flex-wrap">${commonEmojis
                    .map((e) => `<div class="emoji-item p-1 fs-4">${e}</div>`)
                    .join("")}</div>`;

                emojiButton.parentNode.appendChild(emojiContainer);

                emojiContainer.querySelectorAll(".emoji-item").forEach((item) => {
                    item.addEventListener("click", () =>
                        insertAtCursor(targetInput, item.textContent)
                    );
                });

                document.addEventListener("click", function closePicker(e) {
                    if (!emojiContainer.contains(e.target) && e.target !== emojiButton) {
                        emojiContainer.remove();
                        document.removeEventListener("click", closePicker);
                    }
                });
            } else {
                emojiContainer.remove();
            }
        }

        // Helper function to insert emoji at cursor position
        function insertAtCursor(textarea, text) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value =
                textarea.value.substring(0, start) + text + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + text.length;
            textarea.focus();
        }

        // Post Modal Emoji Picker
        document.querySelector(".btn-emoji").addEventListener("click", () => {
            initEmojiPicker(postTextarea, document.querySelector(".btn-emoji"));
        });

        // Create Post Functionality
        postButton.addEventListener("click", function () {
            const postText = postTextarea.value.trim();
            const mediaItems = Array.from(mediaPreviewContainer.children);

            if (postText || mediaItems.length > 0) {
                createNewPost(postText, mediaItems);

                // Reset form
                postTextarea.value = "";
                mediaPreviewContainer.innerHTML = "";
                postButton.disabled = true;

                // Close modal
                const bsModal = bootstrap.Modal.getInstance(postModal);
                if (bsModal) {
                    bsModal.hide();
                }
            }
        });

        document.querySelectorAll('.dropdown-item[data-icon]').forEach(item => {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                const icon = this.dataset.icon;
                const text = this.dataset.text;
                selectedPrivacy = {icon, text};

                // Update dropdown button display
                const dropdownButton = document.querySelector('.dropdown-toggle[data-bs-toggle="dropdown"]');
                dropdownButton.innerHTML = `
        <i class="bi ${icon} me-1"></i>${text}
      `;
            });
        });

        function createNewPost(text, mediaItems) {
            const timelineContainer = document.querySelector(".timeline-posts");
            const newPost = document.createElement("div");
            newPost.className = "card post-card mb-3 new-post-animation";

            // Format media content
            const mediaContent = mediaItems
                .map((item) => {
                    const media = item.querySelector("img, video");
                    return media
                        ? media.outerHTML.replace('class="', 'class="img-fluid rounded mb-3 ')
                        : "";
                })
                .join("");

            // Current date
            const formattedDate = new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            });

            newPost.innerHTML = `
    <div class="card-header bg-transparent">
      <div class="d-flex align-items-center timline-post-item">
        <img src="../assets/image/Profile-picture.png" alt="Profile" class="rounded-circle me-2">
        <div>
          <h6 class="mb-0">Dilsara Thiranjaya</h6>
          <small class="text-muted">${formattedDate} • <i class="bi ${selectedPrivacy.icon}"></i> ${selectedPrivacy.text}</small>
        </div>
        <div class="ms-auto">
          <button class="btn btn-light btn-sm">
            <i class="bi bi-three-dots"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="card-body">
      <p>${text.replace(/\n/g, "<br>")}</p>
      ${mediaContent}
      <div class="post-stats d-flex align-items-center text-muted">
        <span><i class="bi bi-hand-thumbs-up-fill text-primary"></i> 0</span>
        <span class="ms-auto">0 Comments • 0 Shares</span>
      </div>
    </div>
    <div class="card-footer bg-transparent">
      <div class="post-actions d-flex justify-content-around">
        <button class="btn btn-light reaction-btn">
          <i class="bi bi-hand-thumbs-up"></i> <span class="ms-2">Like</span>
        </button>
        <button class="btn btn-light reaction-btn">
          <i class="bi bi-chat-text"></i> <span class="ms-2">Comment</span>
        </button>
        <button class="btn btn-light reaction-btn share-post-btn" data-bs-toggle="modal" data-bs-target="#shareModal>
          <i class="bi bi-share"></i> <span class="ms-2">Share</span>
        </button>
      </div>
    </div>
  `;

            // Add the new post to the timeline
            timelineContainer.prepend(newPost);

            // Add reaction event listeners to the new post
            addPostInteractions(newPost);

            // Remove animation class after animation completes
            setTimeout(() => {
                newPost.classList.remove("new-post-animation");
            }, 500);
        }

        // Add interactions to posts (like, comment, share)
        function addPostInteractions(postElement) {
            if (!postElement) return;

            // Like functionality
            const likeBtn = postElement.querySelector(".reaction-btn:first-child");
            if (likeBtn) {
                likeBtn.addEventListener("click", function () {
                    const icon = this.querySelector("i");
                    const isLiked = icon.classList.contains("bi-hand-thumbs-up-fill");
                    const likeCountEl = postElement.querySelector(
                        ".post-stats span:first-child"
                    );
                    const likeCount = parseInt(
                        likeCountEl.textContent.match(/\d+/)[0] || "0"
                    );

                    if (isLiked) {
                        icon.classList.remove("bi-hand-thumbs-up-fill");
                        icon.classList.add("bi-hand-thumbs-up");
                        likeCountEl.innerHTML = `<i class="bi bi-hand-thumbs-up-fill text-primary"></i> ${
                            likeCount - 1
                        }`;
                    } else {
                        icon.classList.remove("bi-hand-thumbs-up");
                        icon.classList.add("bi-hand-thumbs-up-fill");
                        likeCountEl.innerHTML = `<i class="bi bi-hand-thumbs-up-fill text-primary"></i> ${
                            likeCount + 1
                        }`;

                        // Add like animation
                        createLikeAnimation(this);
                    }
                });
            }

            // Comment functionality
            const commentBtn = postElement.querySelector(".reaction-btn:nth-child(2)");
            if (commentBtn) {
                commentBtn.addEventListener("click", function () {
                    let commentSection = postElement.querySelector(".comment-section");

                    if (!commentSection) {
                        commentSection = document.createElement("div");
                        commentSection.className = "comment-section p-3 border-top";

                        commentSection.innerHTML = `
            <div class="d-flex">
              <img src="../assets/image/Profile-picture.png" alt="Profile" class="rounded-circle me-2" width="32" height="32">
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
                                addComment(postElement, commentText);
                                commentInput.value = "";
                                sendCommentBtn.disabled = true;
                            }
                        });

                        commentInput.addEventListener("keypress", function (e) {
                            if (e.key === "Enter" && this.value.trim()) {
                                addComment(postElement, this.value.trim());
                                this.value = "";
                                sendCommentBtn.disabled = true;
                            }
                        });

                        // Focus the input
                        commentInput.focus();
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

        function addComment(postElement, commentText) {
            const commentsContainer = postElement.querySelector(".comments-list");
            const commentStats = postElement.querySelector(
                ".post-stats span:last-child"
            );
            const currentComments = parseInt(
                commentStats.textContent.match(/\d+/)[0] || "0"
            );
            const currentShares = parseInt(
                commentStats.textContent.match(/Shares/)[0]
                    ? commentStats.textContent.split("•")[1].trim().split(" ")[0]
                    : "0"
            );

            // Create comment element
            const commentElement = document.createElement("div");
            commentElement.className = "comment-item d-flex mb-2 new-comment-animation";

            // Format current time
            const now = new Date();
            const options = {hour: "numeric", minute: "numeric", hour12: true};
            const time = new Intl.DateTimeFormat("en-US", options).format(now);

            commentElement.innerHTML = `
      <img src="../assets/image/Profile-picture.png" alt="Profile" class="rounded-circle me-2 mt-1" width="32" height="32">
      <div>
        <div class="comment-bubble p-2 rounded">
          <strong>Dilsara Thiranjaya</strong>
          <p class="mb-0">${commentText}</p>
        </div>
        <div class="comment-actions">
          <small class="text-muted">${time}</small>
          <button class="btn btn-sm text-primary p-0 ms-2 comment-like-btn">Like</button>
          <button class="btn btn-sm text-primary p-0 ms-2 comment-reply-btn">Reply</button>
        </div>
      </div>
    `;

            // Add to comments container
            commentsContainer.appendChild(commentElement);

            // Update comment count
            commentStats.textContent = `${
                currentComments + 1
            } Comments • ${currentShares} Shares`;

            // Remove animation after it completes
            setTimeout(() => {
                commentElement.classList.remove("new-comment-animation");
            }, 500);

            // Add comment interaction listeners
            const likeCommentBtn = commentElement.querySelector(".comment-like-btn");
            likeCommentBtn.addEventListener("click", function () {
                this.classList.toggle("comment-liked");
                if (this.classList.contains("comment-liked")) {
                    this.innerHTML = "Liked";
                } else {
                    this.innerHTML = "Like";
                }
            });

            const replyCommentBtn = commentElement.querySelector(".comment-reply-btn");
            replyCommentBtn.addEventListener("click", function () {
                const replyBox = document.createElement("div");
                replyBox.className = "d-flex mt-2";
                replyBox.innerHTML = `
        <img src="../assets/image/Profile-picture.png" alt="Profile" class="rounded-circle me-2 mt-1" width="24" height="24">
        <div class="flex-grow-1">
          <div class="input-group input-group-sm">
            <input type="text" class="form-control reply-input" placeholder="Write a reply...">
            <button class="btn btn-primary reply-send-btn" disabled>
              <i class="bi bi-send"></i>
            </button>
          </div>
        </div>
      `;

                const parentComment = this.closest(".comment-item");
                parentComment.appendChild(replyBox);

                const replyInput = replyBox.querySelector(".reply-input");
                const sendReplyBtn = replyBox.querySelector(".reply-send-btn");

                replyInput.focus();

                replyInput.addEventListener("input", function () {
                    sendReplyBtn.disabled = this.value.trim() === "";
                });

                sendReplyBtn.addEventListener("click", function () {
                    const replyText = replyInput.value.trim();
                    if (replyText) {
                        addReply(parentComment, replyText);
                        replyBox.remove();
                    }
                });

                replyInput.addEventListener("keypress", function (e) {
                    if (e.key === "Enter" && this.value.trim()) {
                        addReply(parentComment, this.value.trim());
                        replyBox.remove();
                    }
                });

                // Remove other reply boxes
                document.querySelectorAll(".reply-input").forEach((input) => {
                    if (input !== replyInput) {
                        input.closest(".d-flex.mt-2").remove();
                    }
                });
            });
        }

        function addReply(commentElement, replyText) {
            // Create reply element
            const replyElement = document.createElement("div");
            replyElement.className =
                "reply-item d-flex mt-2 mb-2 ms-4 new-comment-animation";

            // Format current time
            const now = new Date();
            const options = {hour: "numeric", minute: "numeric", hour12: true};
            const time = new Intl.DateTimeFormat("en-US", options).format(now);

            replyElement.innerHTML = `
      <img src="../assets/image/Profile-picture.png" alt="Profile" class="rounded-circle me-2 mt-1" width="24" height="24">
      <div>
        <div class="comment-bubble p-2 rounded">
          <strong>Dilsara Thiranjaya</strong>
          <p class="mb-0">${replyText}</p>
        </div>
        <div class="comment-actions">
          <small class="text-muted">${time}</small>
          <button class="btn btn-sm text-primary p-0 ms-2 comment-like-btn">Like</button>
        </div>
      </div>
    `;

            // Add to comment element
            commentElement.appendChild(replyElement);

            // Remove animation after it completes
            setTimeout(() => {
                replyElement.classList.remove("new-comment-animation");
            }, 500);

            // Add like functionality to reply
            const likeReplyBtn = replyElement.querySelector(".comment-like-btn");
            likeReplyBtn.addEventListener("click", function () {
                this.classList.toggle("comment-liked");
                if (this.classList.contains("comment-liked")) {
                    this.innerHTML = "Liked";
                } else {
                    this.innerHTML = "Like";
                }
            });
        }

        // Create like animation
        function createLikeAnimation(element) {
            const likeBubble = document.createElement("div");
            likeBubble.className = "like-animation";
            likeBubble.innerHTML = `<i class="bi bi-heart-fill text-danger"></i>`;

            element.appendChild(likeBubble);

            // Remove after animation completes
            setTimeout(() => {
                if (element.contains(likeBubble)) {
                    element.removeChild(likeBubble);
                }
            }, 1000);
        }

        // Add interactions to existing posts
        document.querySelectorAll(".post-card").forEach((post) => {
            addPostInteractions(post);
        });

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

        document.addEventListener("click", function (e) {
            if (e.target.closest(".share-post-btn")) {
                const post = e.target.closest(".post-card");
                const postContent = post.querySelector(".card-body p").textContent;
                const shareModal = new bootstrap.Modal(document.getElementById("shareModal"));

                // Set modal textarea to post content
                document.getElementById("shareModal").querySelector("textarea").value = postContent;

                // Show the modal
                shareModal.show();
            }
        });

        // Share Modal Handler
        document.getElementById("shareModal").querySelector(".btn-post").addEventListener("click", function () {
            const shareMessage = document.getElementById("shareModal").querySelector("textarea").value;
            const privacy = document.querySelector(".btn-share-option.active").textContent.trim();

            // Add shared post to timeline (example function)
            createNewPost(`Shared with ${privacy}: \n\n ${shareMessage}`, []);

            // Hide the modal
            const shareModal = bootstrap.Modal.getInstance(document.getElementById("shareModal"));
            shareModal.hide();
        });

        // Share Option Selection
        document.querySelectorAll(".btn-share-option").forEach((btn) => {
            btn.addEventListener("click", function () {
                document.querySelectorAll(".btn-share-option").forEach((b) => b.classList.remove("active"));
                this.classList.add("active");
            });
        });

        // Clean up backdrop and styles after modal is hidden
        document.getElementById("shareModal").addEventListener("hidden.bs.modal", function () {
            // Remove the backdrop manually if it's stuck
            const modalBackdrop = document.querySelector(".modal-backdrop");
            if (modalBackdrop) {
                modalBackdrop.remove();
            }

            // Ensure 'modal-open' class is removed from the body
            document.body.classList.remove("modal-open");

            // Reset any inline padding-right (used to compensate for scrollbar)
            document.body.style.paddingRight = '';

            // Re-enable scrolling in case it's disabled
            document.body.style.overflow = ''; // Ensures scrolling is allowed
        });

        // Trending Post Click Handler
        document.querySelectorAll('.trend-post').forEach(post => {
            post.addEventListener('click', function (e) {
                e.preventDefault();
                // Implement trending post view
                console.log('Viewing trending post:', this.querySelector('h6').textContent);
            });
        });

        // Fetch timeline posts
        async function fetchTimelinePosts() {
            try {
                const response = await fetch(`${BASE_URL}/timeline/getPost?userEmail=${authData.email}`, {
                    headers: {
                        'Authorization': `Bearer ${authData.token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch posts');

                const data = await response.json();
                return data.data; // Array of posts
            } catch (error) {
                console.error('Error fetching posts:', error);
                return [];
            }
        }

        // Create a new post
        async function createPost(postData) {
            try {
                const response = await fetch(`${BASE_URL}/timeline`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authData.token}`
                    },
                    body: JSON.stringify(postData)
                });

                if (!response.ok) throw new Error('Failed to create post');

                const data = await response.json();
                return data.data;
            } catch (error) {
                console.error('Error creating post:', error);
                return null;
            }
        }

        // Add reaction to a post
        async function addReaction(postId, reactionType) {
            try {
                const response = await fetch(`${BASE_URL}/timeline/${postId}/react?userEmail=${authData.email}&reactionType=${reactionType}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authData.token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to add reaction');

                return true;
            } catch (error) {
                console.error('Error adding reaction:', error);
                return false;
            }
        }

        // Add comment to a post
        async function addComment(postId, content) {
            try {
                const response = await fetch(`${BASE_URL}/timeline/${postId}/comment?userEmail=${authData.email}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authData.token}`
                    },
                    body: JSON.stringify(content)
                });

                if (!response.ok) throw new Error('Failed to add comment');

                return true;
            } catch (error) {
                console.error('Error adding comment:', error);
                return false;
            }
        }

        // Share a post
        async function sharePost(postId, shareMessage) {
            try {
                const response = await fetch(`${BASE_URL}/timeline/${postId}/share?userEmail=${authData.email}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authData.token}`
                    },
                    body: JSON.stringify(shareMessage)
                });

                if (!response.ok) throw new Error('Failed to share post');

                const data = await response.json();
                return data.data;
            } catch (error) {
                console.error('Error sharing post:', error);
                return null;
            }
        }

        // Initialize timeline
        async function initializeTimeline() {
            const posts = await fetchTimelinePosts();
            const timelineContainer = document.querySelector('.timeline-posts');
            timelineContainer.innerHTML = ''; // Clear existing posts

            posts.forEach(post => {
                const postElement = createPostElement(post);
                timelineContainer.appendChild(postElement);
            });
        }

        // Create post element
        function createPostElement(post) {
            // Implementation remains the same as in your existing code
            // Just update the interaction handlers to use the new API functions
        }

        // Initialize the timeline when the page loads
        initializeTimeline();
    }
});
