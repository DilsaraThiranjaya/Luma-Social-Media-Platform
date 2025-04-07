document.addEventListener('DOMContentLoaded', async () => {
  const LOGIN_URL = "/Luma-Social-Media-Platform/Front-end/pages/login.html";
  const BASE_URL = "http://localhost:8080/api/v1";

  // Get user ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const profileUserId = urlParams.get('id');

  if (!profileUserId) {
    window.location.href = '/Luma-Social-Media-Platform/Front-end/pages/timeline.html';
    return;
  }

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
      return Date.now() >= exp * 1000;
    } catch (error) {
      return true;
    }
  }

  function getRoleFromToken(token) {
    try {
      const decoded = jwt_decode(token);
      return decoded.role ||
          decoded.roles?.[0] ||
          decoded.authorities?.[0]?.replace('ROLE_', '') ||
          null;
    } catch (error) {
      throw error;
    }
  }

  if (authData?.token) {
    try {
      if (isTokenExpired(authData.token)) {
        await refreshAuthToken();
      }
      initializeUI();
      initializeRoleBasedAccess(getRoleFromToken(authData.token));
      initializeLogout();
      initializeNavbarUserInfo();
    } catch (error) {
      throw error;
      await handleAuthError("Session expired. Please log in again.");
    }
  } else {
    await handleAuthError("You need to log in to access this page.");
  }

  async function refreshAuthToken() {
    try {
      const authData = JSON.parse(sessionStorage.getItem('authData'));
      const response = await fetch(`${BASE_URL}/auth/refreshToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: authData.token
        })
      });

      if (!response.ok) throw new Error('Refresh failed');
      const responseData = await response.json();
      const newAccessToken = responseData.data.token;
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
    initializeReportModal();
    loadSidebarMedia('IMAGE', 'sidebarPhotosContainer');
    loadSidebarMedia('VIDEO', 'sidebarVideosContainer', 3);
    initializeSeeAllButtons();
    initializeFriends();
    initializeFriendshipButtons();

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(
        (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
    );

    const REACTION_TYPES = {
      LIKE: {icon: 'bi-hand-thumbs-up', fillIcon: 'bi-hand-thumbs-up-fill', color: 'text-primary'},
      LOVE: {icon: 'bi-heart', fillIcon: 'bi-heart-fill', color: 'text-danger'},
      HAHA: {icon: 'bi-emoji-laughing', fillIcon: 'bi-emoji-laughing-fill', color: 'text-warning'},
      WOW: {icon: 'bi-emoji-surprise', fillIcon: 'bi-emoji-surprise-fill', color: 'text-warning'},
      SAD: {icon: 'bi-emoji-frown', fillIcon: 'bi-emoji-frown-fill', color: 'text-secondary'},
      ANGRY: {icon: 'bi-emoji-angry', fillIcon: 'bi-emoji-angry-fill', color: 'text-danger'}
    };

    async function loadProfileInfo() {
      try {
        const response = await fetch(`${BASE_URL}/profile/user/${profileUserId}/profileInfo`, {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });
        const responseData = await response.json();

        if (responseData.code === 200 || responseData.code === 201) {

          const user = responseData.data;
          updateProfileUI(user);
          updateFriendshipStatus(user.friendshipStatus);
        } else {
          await Toast.fire({
            icon: "error",
            title: responseData.message
          });
        }
      } catch (error) {
        await Toast.fire({
          icon: "error",
          title: error.message || "Failed to load user data"
        });
      }
    }

    function updateProfileUI(user) {
      // Update profile information

      // Update stats
      document.getElementById("postCount").innerHTML = user.postCount;
      document.getElementById("followingCount").innerHTML = user.followingCount;
      document.getElementById("followerCount").innerHTML = user.followerCount;

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

      // Set Profile and Cover Images
      if (user.profilePictureUrl) {
        document.getElementById('profileImage').src = user.profilePictureUrl;
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
      document.getElementById('profileJoined').textContent = `Joined on ${formattedJoinDate}`;

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

    // Handle "See All" clicks
    function initializeSeeAllButtons() {
      document.querySelectorAll('.see-all-photos').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const photosTab = document.querySelector('[data-bs-target="#photos"]');
          if (photosTab) {
            const tab = new bootstrap.Tab(photosTab);
            tab.show();
          }
        });
      });

      document.querySelectorAll('.see-all-videos').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const videosTab = document.querySelector('[data-bs-target="#videos"]');
          if (videosTab) {
            const tab = new bootstrap.Tab(videosTab);
            tab.show();
          }
        });
      });
    }

    // Load friends for both tab and card
    async function loadFriends(containerId, limit = null) {
      try {
        const response = await fetch(`${BASE_URL}/friendship/${profileUserId}/friends`, {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });
        const data = await response.json();

        if (data.code === 200) {
          const container = document.getElementById(containerId);
          container.innerHTML = '';

          if (!data.data || data.data.length === 0 && limit === null) {
            container.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <div class="empty-friends-state">
                            <i class="bi bi-people fs-1 text-muted"></i>
                            <h5 class="mt-3">No friends yet</h5>
                            <p class="text-muted">When you connect with people, they'll appear here</p>
                        </div>
                    </div>
                `;
            return;
          }

          // If limit is provided, only show that many friends
          const friendsToShow = limit ? data.data.slice(0, limit) : data.data;

          friendsToShow.forEach(friendship => {
            const friend = friendship.user2;
            const friendElement = createFriendElement(friend, containerId === 'friendsContainer');
            container.appendChild(friendElement);
          });
        }
      } catch (error) {
        Toast.fire({
          icon: "error",
          title: "Failed to load friends"
        });
      }
    }

    function createFriendElement(friend, isFullView = false) {
      const element = document.createElement('div');
      element.className = isFullView ? 'col-md-4 mb-3' : 'sidebar-friend-item';

      if (isFullView) {
        element.innerHTML = `
            <div class="friend-card" data-friend-id="${friend.userId}">
                <img src="${friend.profilePictureUrl || '../assets/image/Test-profile-img.jpg'}" 
                     alt="Friend" 
                     class="friend-image">
                <div class="friend-info">
                    <h6>${friend.firstName} ${friend.lastName}</h6>
                    <div class="friend-actions">
                        <a class="btn btn-primary btn-sm"
                            href=${friend.email === authData.email
                            ? 'http://localhost:63342/Luma-Social-Media-Platform/Front-end/pages/profile.html'
                            : `http://localhost:63342/Luma-Social-Media-Platform/Front-end/pages/profile-view.html?id=${friend.userId}`}>
                            <i class="bi bi-person-badge me-2"></i>View Profile
                        </a>
                    </div>
                </div>
            </div>`;
      } else {
        element.innerHTML = `
            <a href=${friend.email === authData.email ? 'http://localhost:63342/Luma-Social-Media-Platform/Front-end/pages/profile.html' : `http://localhost:63342/Luma-Social-Media-Platform/Front-end/pages/profile-view.html?id=${friend.userId}`} class="friend-link text-decoration-none">
                <img src="${friend.profilePictureUrl || '../assets/image/Test-profile-img.jpg'}" 
                     alt="Friend" 
                     class="rounded-circle">
                <span>${friend.firstName} ${friend.lastName}</span>
            </a>
            `;
      }

      return element;
    }

// Initialize friends loading
    function initializeFriends() {
      // Load initial friends for sidebar
      loadFriends('sidebarFriendsContainer', 3);

      // Add tab change handler for friends
      document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', async (e) => {
          const target = e.target.getAttribute('data-bs-target');
          if (target === '#friends') {
            await loadFriends('friendsContainer');
          }
        });
      });

      // Handle "See All" friends click
      document.querySelector('.friends-card .text-primary').addEventListener('click', (e) => {
        e.preventDefault();
        const friendsTab = document.querySelector('[data-bs-target="#friends"]');
        if (friendsTab) {
          const tab = new bootstrap.Tab(friendsTab);
          tab.show();
        }
      });
    }

    function updateFriendshipStatus(status, skipReset = false) {
      const addFriendBtn = document.querySelector('.add-friend-btn');
      const unfriendBtn = document.querySelector('.unfriend-btn');
      const messageBtn = document.querySelector('.message-btn');
      const dropDownBtn = document.querySelector('.profile-view-dropdown');

      if (!skipReset) {
        resetFrienshipButtons(addFriendBtn, unfriendBtn, messageBtn, dropDownBtn);
      }

      switch (status) {
        case 'NONE':
          break;
        case 'PENDING_SENT':
          addFriendBtn.innerHTML = '<i class="bi bi-x-circle"></i> Cancel Request';
          addFriendBtn.classList.add('btn-secondary');
          break;
        case 'PENDING_RECEIVED':
          addFriendBtn.innerHTML = '<i class="bi bi-check-circle"></i> Accept';
          addFriendBtn.classList.add('btn-success');
          unfriendBtn.innerHTML = '<i class="bi bi-x-circle"></i> Decline';
          unfriendBtn.classList.remove('d-none');
          break;
        case 'FRIENDS':
          addFriendBtn.classList.add('d-none');
          unfriendBtn.innerHTML = '<i class="bi bi-person-dash-fill"></i> Unfriend';
          unfriendBtn.classList.remove('d-none');
          messageBtn.classList.remove('d-none');
          break;
        case 'BLOCKED':
          addFriendBtn.classList.add('d-none');
          unfriendBtn.classList.add('d-none');
          messageBtn.classList.add('d-none');
          dropDownBtn.classList.add('d-none');
          break;
      }
    }

    function resetFrienshipButtons (addFriendBtn, unfriendBtn, messageBtn, dropDownBtn) {
      addFriendBtn.classList.remove('d-none', 'btn-secondary', 'btn-success');
      addFriendBtn.innerHTML = '<i class="bi bi-person-plus-fill"></i> Add Friend';
      unfriendBtn.classList.add('d-none');
      messageBtn.classList.add('d-none');
      dropDownBtn.classList.remove('d-none');
    }

    async function initializeFriendshipButtons() {
      try {
        const addFriendBtn = document.querySelector('.add-friend-btn');
        const unfriendBtn = document.querySelector('.unfriend-btn');
        const messageBtn = document.querySelector('.message-btn');
        const dropDownBtn = document.querySelector('.profile-view-dropdown');

        // Initial reset before the API call
        resetFrienshipButtons(addFriendBtn, unfriendBtn, messageBtn, dropDownBtn);

        const response = await fetch(`${BASE_URL}/friendship/${profileUserId}/check`, {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        if (data.code !== 200) throw new Error(data.message || 'Failed to check friendship status');

        if (data.data) {
          switch (data.data.status) {
            case 'ACCEPTED':
              updateFriendshipStatus('FRIENDS', true);
              break;
            case 'PENDING':
              if (data.data.user1?.email === authData.email) {
                updateFriendshipStatus('PENDING_SENT', true);
              } else {
                updateFriendshipStatus('PENDING_RECEIVED', true);
              }
              break;
            case 'BLOCKED':
              updateFriendshipStatus('BLOCKED', true);
              break;
            default:
              updateFriendshipStatus('NONE', true);
          }
        } else {
          updateFriendshipStatus('NONE', true);
        }

        document.querySelector('.add-friend-btn').addEventListener('click', handleFriendAction);
        document.querySelector('.unfriend-btn').addEventListener('click', handleUnfriendAction);
        document.querySelector('.message-btn').addEventListener('click', () => {
          window.location.href = `/messages.html?userId=${profileUserId}`;
        });
        document.getElementById('blockProfile')?.addEventListener('click', handleBlockAction);

      } catch (error) {
        Toast.fire({ icon: 'error', title: error.message });
      }
    }

    async function handleFriendAction() {
      try {
        const currentStatus = document.querySelector('.add-friend-btn').textContent.trim();
        let endpoint = `${BASE_URL}/friendship/${profileUserId}/request`;
        let method = 'POST';

        if (currentStatus.includes('Cancel')) {
          endpoint = `${BASE_URL}/friendship/${profileUserId}`;
          method = 'DELETE';
        } else if (currentStatus.includes('Accept')) {
          endpoint = `${BASE_URL}/friendship/${profileUserId}/accept`;
        }

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });

        const data = await response.json();
        if (data.code === 200) {
          initializeFriendshipButtons(); // Refresh status
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        Toast.fire({
          icon: 'error',
          title: error.message || 'Failed to complete action'
        });
      }
    }

    async function handleUnfriendAction() {
      const result = await Swal.fire({
        title: 'Unfriend',
        text: `Are you sure you want to unfriend ${name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, unfriend',
        cancelButtonText: 'No, cancel'
      });

      // Only proceed if the user confirmed
      if (!result.isConfirmed) {
        return; // Exit the function if user clicked cancel
      }

      try {
        const currentStatus = document.querySelector('.unfriend-btn').textContent.trim();
        const endpoint = currentStatus.includes('Decline')
            ? `${BASE_URL}/friendship/${profileUserId}/decline`
            : `${BASE_URL}/friendship/${profileUserId}`;

        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });

        const data = await response.json();
        if (data.code === 200) {
          updateFriendshipStatus('NONE');
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        Toast.fire({
          icon: 'error',
          title: error.message || 'Failed to complete action'
        });
      }
    }

    async function handleBlockAction(e) {
      e.preventDefault();

      const result = await Swal.fire({
        title: 'Block',
        text: `Are you sure you want to block ${name}? This will also unfriend them.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, block',
        cancelButtonText: 'No, cancel'
      });

      // Only proceed if the user confirmed
      if (!result.isConfirmed) {
        return; // Exit the function if user clicked cancel
      }

      try {
        const response = await fetch(`${BASE_URL}/friendship/${profileUserId}/block`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });

        const data = await response.json();
        if (data.code === 200) {
          updateFriendshipStatus('BLOCKED');
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        Toast.fire({
          icon: 'error',
          title: error.message || 'Failed to block user'
        });
      }
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

    // Function to load posts from backend
    async function loadPosts() {
      try {
        const loader = `<div class="loading-spinner">Loading posts...</div>`;
        document.querySelector(".posts-container").innerHTML = loader;

        const response = await $.ajax({
          url: `${BASE_URL}/profile/${profileUserId}/posts`,
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

          response.data.posts.map(post => {

            const postElement = generatePostElement(post);
            postsContainer.appendChild(postElement);
            return {postElement, post};
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
          ${generatePostDropdown(postData.postId)}
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

    function generatePostDropdown(postId) {
      return `
    <button class="btn btn-light btn-sm dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false">
      <i class="bi bi-three-dots"></i>
    </button>
    <ul class="dropdown-menu dropdown-menu-end">
      <li><a class="dropdown-item report-post-btn" data-post-id="${postId}">
        <i class="bi bi-flag me-2"></i>Report
      </a></li>
    </ul>
  `;
    }

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
        });
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

    // Function to load media
    async function loadMedia(type) {
      try {
        const response = await fetch(`${BASE_URL}/profile/${profileUserId}/posts`, {
          headers: {'Authorization': `Bearer ${authData.token}`}
        });
        const responseData = await response.json();

        const media = responseData.data.posts
            .flatMap(post => post.media)
            .filter(m => m.mediaType === type.toUpperCase());

        return media;
      } catch (error) {
        Toast.fire({icon: 'error', title: 'Failed to load media'});
        return [];
      }
    }

    function populateMediaTab(containerId, media, mediaType) {
      const container = document.getElementById(containerId);
      container.innerHTML = '';

      if (media.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'col-12 text-center py-5';
        emptyState.innerHTML = `
      <div class="empty-media-state">
        <i class="bi ${mediaType === 'photo' ? 'bi-image' : 'bi-camera-reels'} fs-1 text-muted"></i>
        <h5 class="mt-3">No ${mediaType === 'photo' ? 'photos' : 'videos'} to show</h5>
        <p class="text-muted">When you share ${mediaType === 'photo' ? 'photos' : 'videos'}, they'll appear here</p>
      </div>
    `;
        container.appendChild(emptyState);
        return;
      }

      media.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-3';

        const card = document.createElement('div');
        card.className = `media-card ${mediaType}-card`;
        card.innerHTML = `
      ${mediaType === 'photo' ?
            `<img src="${item.mediaUrl}" class="img-fluid rounded media-image" alt="Photo">` :
            `<video class="img-fluid rounded media-video" src="${item.mediaUrl}"></video>`}
      <div class="media-overlay">
        <button class="btn btn-light btn-sm view-media-btn">
          <i class="bi ${mediaType === 'photo' ? 'bi-zoom-in' : 'bi-play-fill'}"></i>
        </button>
      </div>
    `;

        card.querySelector('.view-media-btn').addEventListener('click', () => {
          showMediaModal(item.mediaUrl, item.mediaType);
        });

        col.appendChild(card);
        container.appendChild(col);
      });
    }

    function showMediaModal(mediaUrl, mediaType) {
      const mediaContainer = document.getElementById('mediaContainer');
      mediaContainer.innerHTML = mediaType === 'IMAGE' ?
          `<img src="${mediaUrl}" class="img-fluid" style="max-height: 80vh">` :
          `<video src="${mediaUrl}" class="img-fluid" controls style="max-height: 80vh"></video>`;

      const mediaModal = new bootstrap.Modal(document.getElementById('mediaModal'));
      mediaModal.show();
    }

// Update tab change handlers
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
      tab.addEventListener('shown.bs.tab', async (e) => {
        const target = e.target.getAttribute('data-bs-target');

        if (target === '#photos') {
          const photos = await loadMedia('IMAGE');
          populateMediaTab('photosContainer', photos, 'photo');
        } else if (target === '#videos') {
          const videos = await loadMedia('VIDEO');
          populateMediaTab('videosContainer', videos, 'video');
        }
      });
    });

    // Load sidebar media
    async function loadSidebarMedia(type, containerId, limit = 3) {
      try {
        const media = await loadMedia(type);
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        media.slice(0, limit).forEach(item => {
          const col = document.createElement('div');
          col.className = 'col-4';

          const card = document.createElement('div');
          card.className = `media-card ${type.toLowerCase()}-card`;
          card.innerHTML = `
                ${type === 'IMAGE' ?
              `<img src="${item.mediaUrl}" class="img-fluid rounded media-image" alt="Photo">` :
              `<video class="img-fluid rounded media-video" src="${item.mediaUrl}"></video>`}
                <div class="media-overlay">
                    <button class="btn btn-light btn-sm view-media-btn">
                        <i class="bi ${type === 'IMAGE' ? 'bi-zoom-in' : 'bi-play-fill'}"></i>
                    </button>
                </div>
            `;

          card.querySelector('.view-media-btn').addEventListener('click', () => {
            showMediaModal(item.mediaUrl, item.mediaType);
          });

          col.appendChild(card);
          container.appendChild(col);
        });
      } catch (error) {
        Toast.fire({ icon: 'error', title: `Failed to load ${type.toLowerCase()}s` });
      }
    }

    // Report Post Functionality
    let currentReportPostId = null;

    document.addEventListener('click', function(e) {
      if (e.target.closest('.report-post-btn')) {
        const postId = e.target.closest('.report-post-btn').dataset.postId;
        showReportPostModal(postId);
      }

      if (e.target.closest('#reportProfile')) {
        showReportUserModal();
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

        // Handle report type selection
        document.querySelectorAll('#reportUserTypeDropdown + .dropdown-menu .dropdown-item').forEach(item => {
          item.addEventListener('click', function(e) {
            e.preventDefault();
            const value = this.dataset.value;
            document.getElementById('reportUserTypeDropdown').textContent = this.textContent;
            document.getElementById('reportUserTypeDropdown').dataset.selected = value;
            document.getElementById('reportUserTypeError').style.display = 'none';
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

        document.querySelectorAll('#reportUserPriorityDropdown + .dropdown-menu .dropdown-item').forEach(item => {
          item.addEventListener('click', function(e) {
            e.preventDefault();
            const value = this.dataset.value;
            document.getElementById('reportUserPriorityDropdown').textContent = this.textContent;
            document.getElementById('reportUserPriorityDropdown').dataset.selected = value;
          });
        });

      // Submit report handler
      document.getElementById('submitReportBtn').addEventListener('click', submitPostReport);
      document.getElementById('reportUserSubmitReportBtn').addEventListener('click', submitUserReport);
    }

// Function to show report modal
    function showReportPostModal(postId) {
      currentReportPostId = postId;
      const modal = new bootstrap.Modal(document.getElementById('reportPostModal'));
      modal.show();
    }

    function showReportUserModal() {
      const modal = new bootstrap.Modal(document.getElementById('reportUserModal'));
      modal.show();
    }

// Form validation
    function validateReportPostForm() {
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

    function validateReportUserForm() {
      let isValid = true;

      const reportType = document.getElementById('reportUserTypeDropdown').dataset.selected;
      if (!reportType) {
        document.getElementById('reportUserTypeError').textContent = 'Please select a report type';
        document.getElementById('reportUserTypeError').style.display = 'block';
        isValid = false;
      }

      const description = document.getElementById('reportUserDescription').value.trim();
      if (description.length < 20) {
        document.getElementById('reportUserDescriptionError').textContent = 'Description must be at least 20 characters';
        document.getElementById('reportUserDescriptionError').style.display = 'block';
        isValid = false;
      }

      return isValid;
    }

// Submit report
    async function submitPostReport() {
      const reportButton = document.getElementById('submitReportBtn');
      const OriginalReportButtonText = reportButton.innerHTML;

      if (!validateReportPostForm()) return;

      const reportData = {
        postId: currentReportPostId,
        type: document.getElementById('reportTypeDropdown').dataset.selected,
        priority: document.getElementById('priorityDropdown').dataset.selected || 'LOW',
        description: document.getElementById('reportDescription').value.trim(),
      };

      reportButton.disabled = true;
      reportButton.innerHTML = `<span class="spinner-border  spinner-border-sm" style="color: white !important" role="status" aria-hidden="true"></span>`;

      const result = await Swal.fire({
        title: "Are you sure?",
        text: "This action cannot be undone!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, submit report!",
        cancelButtonText: "Cancel"
      });

// Only proceed if confirmed
      if (result.isConfirmed) {
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
      }
    }

    async function submitUserReport() {
      const reportButton = document.getElementById('reportUserSubmitReportBtn');
      const OriginalReportButtonText = reportButton.innerHTML;

      if (!validateReportUserForm()) return;

      const reportData = {
        userId: profileUserId,
        type: document.getElementById('reportUserTypeDropdown').dataset.selected,
        priority: document.getElementById('reportUserPriorityDropdown').dataset.selected || 'LOW',
        description: document.getElementById('reportUserDescription').value.trim(),
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
          const response = await fetch(`${BASE_URL}/profile/report`, {
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
          document.getElementById('reportUserModal').querySelectorAll('.dropdown-toggle').forEach(el => {
            el.textContent = el.id === 'reportUserTypeDropdown' ? 'Select Report Type' : 'Select Priority';
            delete el.dataset.selected;
          });
          document.getElementById('reportUserDescription').value = '';
          bootstrap.Modal.getInstance(document.getElementById('reportUserModal')).hide();
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


