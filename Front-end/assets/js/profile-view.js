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

    // Initialize tooltips
    const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]'
    );
    const tooltipList = [...tooltipTriggerList].map(
        (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
    );

    // Add friend button toggle
    $('.btn-primary:contains("Follow")').click(function () {
      const $btn = $(this);
      if ($btn.hasClass("following")) {
        $btn
            .html('<i class="bi bi-plus-lg"></i> Follow')
            .removeClass("following btn-outline-primary")
            .addClass("btn-primary");
      } else {
        $btn
            .html('<i class="bi bi-check-lg"></i> Following')
            .addClass("following btn-outline-primary")
            .removeClass("btn-primary");
      }
    });

    // Photo overlay effect
    $(".photo-card").hover(
        function () {
          $(this).find(".photo-overlay").css("opacity", "1");
        },
        function () {
          $(this).find(".photo-overlay").css("opacity", "0");
        }
    );

    function createNewPost(text, mediaItems) {
      const timelineContainer = document.querySelector(".posts-container");
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
        <img src="/assets/image/Profile-picture.png" alt="Profile" class="rounded-circle me-2">
        <div>
          <h6 class="mb-0">Dilsara Thiranjaya</h6>
          <small class="text-muted">${formattedDate} • <i class="bi ${
          selectedPrivacy.icon
      }"></i> ${selectedPrivacy.text}</small>
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

    const REACTION_TYPES = {
      LIKE: { icon: 'bi-hand-thumbs-up', fillIcon: 'bi-hand-thumbs-up-fill', color: 'text-primary' },
      LOVE: { icon: 'bi-heart', fillIcon: 'bi-heart-fill', color: 'text-danger' },
      HAHA: { icon: 'bi-emoji-laughing', fillIcon: 'bi-emoji-laughing-fill', color: 'text-warning' },
      WOW: { icon: 'bi-emoji-surprise', fillIcon: 'bi-emoji-surprise-fill', color: 'text-warning' },
      SAD: { icon: 'bi-emoji-frown', fillIcon: 'bi-emoji-frown-fill', color: 'text-secondary' },
      ANGRY: { icon: 'bi-emoji-angry', fillIcon: 'bi-emoji-angry-fill', color: 'text-danger' }
    };

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

    async function handleReaction(likeBtn, reactionType) {
      const post = likeBtn.closest('.post-card');
      const reactionCount = post.querySelector('.post-stats span:first-child');
      const currentType = likeBtn.dataset.reactionType;

      // Remove existing reaction class and icon
      if (currentType) {
        likeBtn.classList.remove(REACTION_TYPES[currentType].color);
        likeBtn.querySelector('i').classList.remove(REACTION_TYPES[currentType].fillIcon);
        likeBtn.querySelector('i').classList.add(REACTION_TYPES[currentType].icon);
      }

      // If clicking the same reaction, remove it
      if (currentType === reactionType) {
        likeBtn.dataset.reactionType = '';
        likeBtn.innerHTML = '<i class="bi bi-hand-thumbs-up"></i> <span class="ms-2">Like</span>';
        updateReactionCount(reactionCount, -1);
        return;
      }

      // Add new reaction
      likeBtn.dataset.reactionType = reactionType;
      likeBtn.classList.add(REACTION_TYPES[reactionType].color);
      likeBtn.innerHTML = `
        <i class="bi ${REACTION_TYPES[reactionType].fillIcon}"></i>
        <span class="ms-2">${reactionType}</span>
    `;

      // If there was no previous reaction, increment the count
      if (!currentType) {
        updateReactionCount(reactionCount, 1);
      }

      // Create reaction animation
      createReactionAnimation(likeBtn, reactionType);

      // Send reaction to server
      try {
        const response = await fetch('/api/v1/profile/reaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            type: reactionType,
            postId: post.dataset.postId
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save reaction');
        }
      } catch (error) {
        console.error('Error saving reaction:', error);
        // Revert the UI changes if the server request fails
        handleReaction(likeBtn, currentType || '');
      }
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
          handleReaction(likeBtn, 'LIKE');
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
              <img src="/assets/image/Profile-picture.png" alt="Profile" class="rounded-circle me-2" width="32" height="32">
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

    function updateReactionCount(countElement, change) {
      const currentCount = parseInt(countElement.textContent.match(/\d+/)[0] || '0');
      const newCount = Math.max(0, currentCount + change);
      countElement.innerHTML = `<i class="bi bi-hand-thumbs-up-fill text-primary"></i> ${newCount}`;
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
      const options = { hour: "numeric", minute: "numeric", hour12: true };
      const time = new Intl.DateTimeFormat("en-US", options).format(now);

      commentElement.innerHTML = `
      <img src="/assets/image/Profile-picture.png" alt="Profile" class="rounded-circle me-2 mt-1" width="32" height="32">
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
        <img src="/assets/image/Profile-picture.png" alt="Profile" class="rounded-circle me-2 mt-1" width="24" height="24">
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
      const options = { hour: "numeric", minute: "numeric", hour12: true };
      const time = new Intl.DateTimeFormat("en-US", options).format(now);

      replyElement.innerHTML = `
      <img src="/assets/image/Profile-picture.png" alt="Profile" class="rounded-circle me-2 mt-1" width="24" height="24">
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

    // Add interactions to existing posts
    document.querySelectorAll(".post-card").forEach((post) => {
      addPostInteractions(post);
    });

    document.addEventListener("click", function (e) {
      if (e.target.closest(".share-post-btn")) {
        const post = e.target.closest(".post-card");
        const postContent = post.querySelector(".card-body p").textContent;
        const shareModal = new bootstrap.Modal(
            document.getElementById("shareModal")
        );

        // Set modal textarea to post content
        document.getElementById("shareModal").querySelector("textarea").value =
            postContent;

        // Show the modal
        shareModal.show();
      }
    });

    // Share Modal Handler
    document
        .getElementById("shareModal")
        .querySelector(".btn-post")
        .addEventListener("click", function () {
          const shareMessage = document
              .getElementById("shareModal")
              .querySelector("textarea").value;
          const privacy = document
              .querySelector(".btn-share-option.active")
              .textContent.trim();

          // Add shared post to timeline (example function)
          createNewPost(`Shared with ${privacy}: \n\n ${shareMessage}`, []);

          // Hide the modal
          const shareModal = bootstrap.Modal.getInstance(
              document.getElementById("shareModal")
          );
          shareModal.hide();
        });

    // Share Option Selection
    document.querySelectorAll(".btn-share-option").forEach((btn) => {
      btn.addEventListener("click", function () {
        document
            .querySelectorAll(".btn-share-option")
            .forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
      });
    });

    // Clean up backdrop and styles after modal is hidden
    document
        .getElementById("shareModal")
        .addEventListener("hidden.bs.modal", function () {
          // Remove the backdrop manually if it's stuck
          const modalBackdrop = document.querySelector(".modal-backdrop");
          if (modalBackdrop) {
            modalBackdrop.remove();
          }

          // Ensure 'modal-open' class is removed from the body
          document.body.classList.remove("modal-open");

          // Reset any inline padding-right (used to compensate for scrollbar)
          document.body.style.paddingRight = "";

          // Re-enable scrolling in case it's disabled
          document.body.style.overflow = ""; // Ensures scrolling is allowed
        });
    }

});


