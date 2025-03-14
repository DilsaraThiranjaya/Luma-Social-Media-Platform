document.addEventListener("DOMContentLoaded", function () {
  // Initialize tooltips
  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]'
  );
  const tooltipList = [...tooltipTriggerList].map(
    (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
  );

  // Handle cover image change
  $("#coverImageInput").on("change", function (e) {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        $("#coverImage").attr("src", e.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

  // Handle profile image change
  $("#profileImageInput").on("change", function (e) {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        $("#profileImage").attr("src", e.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

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

  // Post Modal Functionality
  const postModal = document.getElementById("postModal");
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
    '.dropdown-toggle[data-bs-toggle="dropdown"]'
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

  document.querySelectorAll(".dropdown-item[data-icon]").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      const icon = this.dataset.icon;
      const text = this.dataset.text;
      selectedPrivacy = { icon, text };

      // Update dropdown button display
      const dropdownButton = document.querySelector(
        '.dropdown-toggle[data-bs-toggle="dropdown"]'
      );
      dropdownButton.innerHTML = `
        <i class="bi ${icon} me-1"></i>${text}
      `;
    });
  });

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
});
