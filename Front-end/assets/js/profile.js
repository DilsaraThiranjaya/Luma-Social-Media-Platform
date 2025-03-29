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

    // Initialize
    loadProfileInfo();
    loadPosts();

    // Initialize tooltips
    const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]'
    );
    const tooltipList = [...tooltipTriggerList].map(
        (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
    );

    // Load Profile Info
    async function loadProfileInfo() {
      try {
        const response = await fetch(`${BASE_URL}/profile/profileInfo`, {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });
        const responseData = await response.json();

        if (responseData.code === 200 || responseData.code === 201) {
          const user = responseData.data;

          // Format birthday to "Month Day, Year" (e.g., "January 15, 1995")
          const formattedBirthday = user.birthday
              ? new Date(user.birthday).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
              : 'Not specified';

          // Format createdAt to "Month Year" (e.g., "October 2023")
          const formattedJoinDate = user.createdAt
              ? new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
              })
              : 'Not specified';

          // Update Profile Name in Header and Navigation
          document.getElementById('profileName').textContent = `${user.firstName} ${user.lastName}`;
          document.getElementById('navProfileName').textContent = `${user.firstName} ${user.lastName}`;

          // Set Profile and Cover Images
          if (user.profilePictureUrl) {
            document.getElementById('profileImage').src = user.profilePictureUrl;
            document.getElementById('navProfileImg').src = user.profilePictureUrl;
            document.getElementById('navBarProfileImg').src = user.profilePictureUrl;
          }
          if (user.coverPhotoUrl) {
            document.getElementById('coverImage').src = user.coverPhotoUrl;
          }

          // Populate Basic Info in About Tab
          document.getElementById('aboutName').textContent = `${user.firstName} ${user.lastName}`;

          // Get the container elements for each info item
          const emailItem = document.querySelector('.about-email-item');
          const phoneItem = document.querySelector('.about-phone-item');
          const birthdayItem = document.querySelector('.about-birthday-item');

          // Handle Email - hide if not allowed to display
          if (user.isDisplayEmail && user.email !== null && user.email !== '') {
            document.getElementById('aboutEmail').textContent = user.email;
            emailItem.classList.remove('d-none');
          } else {
            emailItem.classList.add('d-none');
          }

          // Handle Phone - hide if not allowed to display
          if (user.isDisplayPhone && user.phoneNumber !== null && user.phoneNumber !== '') {
            document.getElementById('aboutPhone').textContent = user.phoneNumber;
            phoneItem.classList.remove('d-none');
          } else {
            phoneItem.classList.add('d-none');
          }

          // Handle Birthday - hide if not allowed to display
          if (user.isDisplayBirthdate && user.birthday !== null && user.birthday !== '') {
            document.getElementById('aboutBirthday').textContent = formattedBirthday;
            birthdayItem.classList.remove('d-none');
          } else {
            birthdayItem.classList.add('d-none');
          }

          // Handle Location
          const aboutLocationElement = document.getElementById('aboutLocation');
          const aboutLocationItem = document.querySelector('.about-location-item');
          if (user.location !== null && user.location !== '') {
            aboutLocationElement.textContent = user.location;
            aboutLocationItem.classList.remove('d-none');
          } else {
            aboutLocationItem.classList.add('d-none');
          }

          // Populate Basic Info in About Card

          // Handle Bio
          const profileBioElement = document.getElementById('profileBio');
          if (user.bio !== null && user.bio !== '') {
            profileBioElement.textContent = user.bio;
            profileBioElement.classList.remove('d-none');
          } else {
            profileBioElement.classList.add('d-none');
          }

          // Handle Work Experience - show only latest
          const profileWorkElement = document.getElementById('profileWork');
          const profileWorkItem = document.querySelector('.profile-work-item');
          const latestWork = getLatestItem(user.workExperience);
          if (latestWork?.company) {
            profileWorkElement.textContent = `Works at ${latestWork.company}`;
            profileWorkItem.classList.remove('d-none');
          } else {
            profileWorkItem.classList.add('d-none');
          }

          // Handle Education - show only latest
          const profileEducationElement = document.getElementById('profileEducation');
          const profileEducationItem = document.querySelector('.profile-education-item');
          const latestEducation = getLatestItem(user.education);
          if (latestEducation?.institution) {
            profileEducationElement.textContent = `Studied at ${latestEducation.institution}`;
            profileEducationItem.classList.remove('d-none');
          } else {
            profileEducationItem.classList.add('d-none');
          }

          // Handle Location
          const profileLocationElement = document.getElementById('profileLocation');
          const profileLocationItem = document.querySelector('.profile-location-item');
          if (user.location !== null && user.location !== '') {
            profileLocationElement.textContent = `Lives in ${user.location}`;
            profileLocationItem.classList.remove('d-none');
          } else {
            profileLocationItem.classList.add('d-none');
          }

          // Handle Join Date
          document.getElementById('profileJoined').textContent = `Joined ${formattedJoinDate}`;

          // Populate Work Experience
          const workTimeline = document.getElementById('workTimeline');
          workTimeline.innerHTML = '';
          user.workExperience?.forEach(work => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <h6>${work.jobTitle || 'No position specified'}</h6>
            <p class="company">${work.company || 'No company specified'}</p>
            <p class="period">${formatTimelinePeriod(work.startDate, work.endDate)}</p>
            <p class="description ${work.description ? '' : 'd-none'}">${work.description}</p>
          </div>
        `;
            workTimeline.appendChild(item);
          });

          // Populate Education
          const educationTimeline = document.getElementById('educationTimeline');
          educationTimeline.innerHTML = '';
          user.education?.forEach(edu => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <h6>${edu.fieldOfStudy || 'No degree specified'}</h6>
            <p class="company">${edu.institution || 'No institution specified'}</p>
            <p class="period">${formatTimelinePeriod(edu.startDate, edu.endDate)}</p>
            <p class="description ${edu.description ? '' : 'd-none'}">${edu.description}</p>
          </div>
        `;
            educationTimeline.appendChild(item);
          });

          return;
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

    // Format timeline period to "YYYY - YYYY" or "YYYY - Present"
    function formatTimelinePeriod(startDate, endDate) {
      const startYear = startDate ? new Date(startDate).getFullYear() : '';
      const endYear = endDate ? new Date(endDate).getFullYear() : 'Present';
      return `${startYear} - ${endYear}`;
    }

    // Helper function to sort by date and get most recent item
    function getLatestItem(items, dateField = 'startDate') {
      if (!items || items.length === 0) return null;

      // Clone array to avoid mutating original
      const sorted = [...items].sort((a, b) => {
        const dateA = new Date(a[dateField] || 0);
        const dateB = new Date(b[dateField] || 0);
        return dateB - dateA; // Sort descending (newest first)
      });

      return sorted[0];
    }

    // Handle cover image change
    $("#coverImageInput").on("change", function (e) {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          Toast.fire({
            icon: "error",
            title: "File size must be less than 2MB"
          });
          return;
        }

        // Validate file type
        const validTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
          Toast.fire({
            icon: "error",
            title: "Invalid file type. Only JPEG, PNG, and WebP files are allowed."
          });
          return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("userEmail", authData.email);

        // Show spinner and hide camera icon
        $("#uploadCoverImageInputSpinner").show();
        $("#cameraIconCoverImage").hide();
        $("#coverImageInputLabel").prop("disabled", true); // Disable button during upload

        $.ajax({
          url: BASE_URL + "/profile/upload-cover-photo",
          type: "POST",
          data: formData,
          processData: false,
          contentType: false,
          headers: {
            "Authorization": "Bearer " + authData.token
          },
          success: function(response) {
            if (response.code === 200) {
              $("#coverImage").attr("src", response.data + "?t=" + new Date().getTime());

              createProfileAndCoverPicPost(response.data, "Updated my cover photo!");
            } else {
              Toast.fire({
                icon: "error",
                title: response.message || "Error updating cover picture"
              });
            }
          },
          error: function(xhr) {
            const errorMsg = xhr.responseJSON?.message || "Server error";
            Toast.fire({
              icon: "error",
              title: errorMsg
            });
          },
          complete: function() {
            // Always hide spinner and show camera icon when done
            $("#uploadCoverImageInputSpinner").hide();
            $("#cameraIconCoverImage").show();
            $("#coverImageInputLabel").prop("disabled", false);
          }
        });
      }
    });

    $("#profileImageInput").on("change", function(e) {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          Toast.fire({
            icon: "error",
            title: "File size must be less than 2MB"
          });
          return;
        }

        // Validate file type
        const validTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
          Toast.fire({
            icon: "error",
            title: "Invalid file type. Only JPEG, PNG, and WebP files are allowed."
          });
          return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("userEmail", authData.email);

        // Show spinner and hide camera icon
        $("#uploadProfileImageSpinner").show();
        $("#cameraIconProfileImage").hide();
        $("#profileImageInputLabel").prop("disabled", true); // Disable button during upload

        $.ajax({
          url: BASE_URL + "/profile/upload-profile-picture",
          type: "POST",
          data: formData,
          processData: false,
          contentType: false,
          headers: {
            "Authorization": "Bearer " + authData.token
          },
          success: function(response) {
            if (response.code === 200) {
              // Update profile image display with cache busting
              $("#profileImage").attr("src", response.data + "?t=" + new Date().getTime());
              $("#navBarProfileImg").attr("src", response.data + "?t=" + new Date().getTime());
              $("#navProfileImg").attr("src", response.data + "?t=" + new Date().getTime());

              createProfileAndCoverPicPost(response.data, "Updated my profile picture!");
            } else {
              Toast.fire({
                icon: "error",
                title: response.message || "Error updating profile picture"
              });
            }
          },
          error: function(xhr) {
            const errorMsg = xhr.responseJSON?.message || "Server error";
            Toast.fire({
              icon: "error",
              title: errorMsg
            });
          },
          complete: function() {
            // Always hide spinner and show camera icon when done
            $("#uploadProfileImageSpinner").hide();
            $("#cameraIconProfileImage").show();
            $("#profileImageInputLabel").prop("disabled", false);
          }
        });
      }
    });

    // Function to create a post when profile picture is updated
    function createProfileAndCoverPicPost(imageUrl, content) {
      const postData = {
        content: content,
        privacy: "PUBLIC",
        media: [{
          mediaUrl: imageUrl,
          mediaType: "IMAGE"
        }]
      };

      $.ajax({
        url: BASE_URL + "/profile/posts/create",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(postData),
        headers: {
          "Authorization": "Bearer " + authData.token
        },
        success: function(response) {
          loadPosts();
        },
        error: function(error) {
          Toast.fire({
            icon: "error",
            title: error.message
          })
        }
      });
    }

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
    document.getElementById('addPhotos').addEventListener('click', function() {
      bsPostModal.show();

      postModal.addEventListener('shown.bs.modal', function modalShown() {
        imageUpload.click();
        postModal.removeEventListener('shown.bs.modal', modalShown);
      });
    });

    // Initialize instant add video button
    document.getElementById('addVideos').addEventListener('click', function() {
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
          Toast.fire({ icon: "error", title: "Invalid image format (JPEG, PNG, WebP only)" });
          return;
        }

        if (type === "video" && !validVideoTypes.includes(file.type)) {
          Toast.fire({ icon: "error", title: "Invalid video format (MP4, MOV only)" });
          return;
        }

        if (type === "image" && file.size > MAX_IMAGE_SIZE) {
          Toast.fire({ icon: "error", title: "Image size exceeds 20MB limit" });
          return;
        }

        if (type === "video" && file.size > MAX_VIDEO_SIZE) {
          Toast.fire({ icon: "error", title: "Video size exceeds 100MB limit" });
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
      selectedPrivacy = { icon: "bi-globe", text: "Public" };
      updatePrivacyDropdown();

      // Reset button state
      postButton.disabled = true;

      // Clear file inputs (important for allowing same file to be re-selected)
      imageUpload.value = "";
      videoUpload.value = "";
    }

// Event listeners for modal close
    postModal.addEventListener('hide.bs.modal', function(event) {
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
    postModal.addEventListener('show.bs.modal', function() {
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
    postButton.addEventListener("click", async function () {
      const postText = postTextarea.value.trim();
      const OriginalPostButtonText = postButton.innerHTML;
      if (!postText && mediaFiles.length === 0) return;

      postButton.disabled = true;
      postButton.innerHTML = `<span class="spinner-border  spinner-border-sm" style="color: white !important" role="status" aria-hidden="true"></span>`;
      const bsModal = bootstrap.Modal.getInstance(postModal);

      try {
        // Upload media files
        const mediaUploads = mediaFiles.map(async ({ file, type }) => {
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
          selectedPrivacy = { icon: "bi-globe", text: "Public" };
          updatePrivacyDropdown();
          bsModal.hide();
          Toast.fire({ icon: "success", title: "Post created!" });
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

// Helper function to update privacy dropdown display
    function updatePrivacyDropdown() {
      const dropdownButton = document.querySelector('.privacy-dropdown');
      dropdownButton.innerHTML = `
    <i class="bi ${selectedPrivacy.icon} me-1"></i>${selectedPrivacy.text}
  `;
    }

    document.querySelectorAll(".dropdown-item[data-icon]").forEach((item) => {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        const icon = this.dataset.icon;
        const text = this.dataset.text;
        selectedPrivacy = { icon, text };

        // Update dropdown button display
        const dropdownButton = document.querySelector(
            '.privacy-dropdown[data-bs-toggle="dropdown"]'
        );
        dropdownButton.innerHTML = `
        <i class="bi ${icon} me-1"></i>${text}
      `;
      });
    });

    // Function to load posts from backend
    async function loadPosts() {
      try {
        const loader = `<div class="loading-spinner">Loading posts...</div>`;
        document.querySelector(".posts-container").innerHTML = loader;

        const response = await $.ajax({
          url: BASE_URL + "/profile/posts",
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
      newPost.className = "card post-card mb-3";

      // Format media content
      const mediaContent = (postData.media || []).map(media => {
        if (media.mediaType === 'IMAGE') {
          return `<img src="${media.mediaUrl}" class="img-fluid rounded mb-3" alt="Post media">`;
        }
        if (media.mediaType === 'VIDEO') {
          return `<video src="${media.mediaUrl}" class="img-fluid rounded mb-3" controls></video>`;
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
      Object.entries(groupedReactions)
          .filter(([type, count]) => count > 0)
          .forEach(([type, count]) => {
            const icon = REACTION_TYPES[type]?.fillIcon || "bi-hand-thumbs-up-fill";
            const color = REACTION_TYPES[type]?.color || "text-primary";
            reactionDisplay += `<span class="reaction-icon me-1">
                            <i class="bi ${icon} ${color}"></i> ${count}
                          </span>`;
          });

      // For the like button, check if the user has reacted and show the reaction type if available
      const likeButtonIcon = postData.liked && postData.reactionType
          ? `bi ${REACTION_TYPES[postData.reactionType].fillIcon} ${REACTION_TYPES[postData.reactionType].color}`
          : "bi-hand-thumbs-up";
      const likeButtonText = postData.liked && postData.reactionType ? postData.reactionType : "Like";

      newPost.innerHTML = `
    <div class="card-header bg-transparent">
      <div class="d-flex align-items-center timline-post-item">
        <img src="${postData.user.profilePictureUrl || '/assets/image/Profile-picture.png'}" 
             alt="Profile" class="rounded-circle me-2" style="width: 40px; height: 40px;">
        <div>
          <h6 class="mb-0">${postData.user.firstName} ${postData.user.lastName}</h6>
          <small class="text-muted">
            ${new Date(postData.createdAt || Date.now()).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      })} • 
            <i class="bi ${getPrivacyIcon(postData.privacy)}"></i> 
            ${postData.privacy.charAt(0) + postData.privacy.slice(1).toLowerCase()}
          </small>
        </div>
        <div class="ms-auto dropdown">
          ${generatePostDropdown()}
        </div>
      </div>
    </div>
    <div class="card-body">
      <p>${postData.content.replace(/\n/g, "<br>")}</p>
      ${mediaContent}
      <div class="post-stats d-flex align-items-center text-muted">
        <!-- Display multiple reaction types with counts -->
        ${reactionDisplay}
        <span class="ms-auto">${postData.comments} Comments • ${postData.shares} Shares</span>
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
        <button class="btn btn-light reaction-btn share-post-btn" 
                data-bs-toggle="modal" 
                data-bs-target="#shareModal"
                data-post-id="${postData.postId}">
          <i class="bi bi-share"></i> <span class="ms-2">Share</span>
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

    function generatePostDropdown() {
      return `
    <button class="btn btn-light btn-sm dropdown-toggle" 
            type="button" 
            data-bs-toggle="dropdown" 
            aria-expanded="false">
      <i class="bi bi-three-dots"></i>
    </button>
    <ul class="dropdown-menu dropdown-menu-end">
      <li><a class="dropdown-item" href="#" data-action="edit">
        <i class="bi bi-pencil-square me-2"></i>Edit
      </a></li>
      <li><a class="dropdown-item text-danger" href="#" data-action="delete">
        <i class="bi bi-trash me-2"></i>Delete
      </a></li>
      <li><hr class="dropdown-divider"></li>
      <li><a class="dropdown-item" href="#" data-action="report">
        <i class="bi bi-flag me-2"></i>Report
      </a></li>
    </ul>
  `;
    }

    // Add new reaction constants at top
    const REACTION_TYPES = {
      LIKE: { icon: 'bi-hand-thumbs-up', fillIcon: 'bi-hand-thumbs-up-fill', color: 'text-primary' },
      LOVE: { icon: 'bi-heart', fillIcon: 'bi-heart-fill', color: 'text-danger' },
      HAHA: { icon: 'bi-emoji-laughing', fillIcon: 'bi-emoji-laughing-fill', color: 'text-warning' },
      WOW: { icon: 'bi-emoji-surprise', fillIcon: 'bi-emoji-surprise-fill', color: 'text-warning' },
      SAD: { icon: 'bi-emoji-frown', fillIcon: 'bi-emoji-frown-fill', color: 'text-secondary' },
      ANGRY: { icon: 'bi-emoji-angry', fillIcon: 'bi-emoji-angry-fill', color: 'text-danger' }
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
          body: JSON.stringify({ type: reactionType })
        });

        if (!response.ok) throw new Error('Failed to save reaction');

        const result = await response.json();
        const reactionCount = likeBtn.closest('.post-card').querySelector('.post-stats span:first-child');

        if (result.message === "Added") {
          reactionCount.innerHTML = `<i class="bi bi-hand-thumbs-up-fill text-primary"></i> ${parseInt(reactionCount.textContent) + 1}`;
          likeBtn.innerHTML = `<i class="bi ${REACTION_TYPES[reactionType].fillIcon} ${REACTION_TYPES[reactionType].color}"></i> <span>${reactionType}</span>`;
          createReactionAnimation(likeBtn, reactionType);
        } else {
          reactionCount.innerHTML = `<i class="bi bi-hand-thumbs-up-fill text-primary"></i> ${parseInt(reactionCount.textContent) - 1}`;
          likeBtn.innerHTML = '<i class="bi bi-hand-thumbs-up"></i> <span>Like</span>';
        }
      } catch (error) {
        Toast.fire({ icon: 'error', title: 'Failed to save reaction' });
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


