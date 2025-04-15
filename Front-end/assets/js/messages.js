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
    // sessionStorage.removeItem('authData');
    // window.location.href = LOGIN_URL;
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
      initializeNavbarUserInfo();
      initializeNavBarStats();
    } catch (error) {
      await handleAuthError("Session expired. Please log in again.");
    }
  } else {
    await handleAuthError("You need to log in to access this page.");
  }

  async function refreshAuthToken() {
    try {
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
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  }

  function initializeNavBarStats() {
    updateFriendsCount();
    updateNotificationsCount();
    document.getElementById('messageBadge').classList.add('d-none');
  }

  async function updateFriendsCount() {
    try {
      const response = await fetch(`${BASE_URL}/friendship/requests`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      const responseData = await response.json();

      if (responseData.code === 200 || responseData.code === 201) {
        const friendRequestCount = responseData.data.length;

        if (friendRequestCount > 0) {
          document.getElementById('friendsBadge').classList.remove('d-none');
          document.getElementById('friendsBadge').textContent = friendRequestCount;
        } else {
          document.getElementById('friendsBadge').classList.add('d-none');
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

  async function updateNotificationsCount() {
    try {
      const response = await fetch(`${BASE_URL}/notifications/unread`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      const responseData = await response.json();

      if (responseData.code === 200 || responseData.code === 201) {
        const notificationCount = responseData.data.length;

        if (notificationCount > 0) {
          document.getElementById('notificationBadge').classList.remove('d-none');
          document.getElementById('notificationBadge').textContent = notificationCount;
        } else {
          document.getElementById('notificationBadge').classList.add('d-none');
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

  async function initializeUI() {
    // Toast configuration
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
    try {
      await loadFriendsAndChats();
      connectWebSocket();
    } catch (error) {
        Toast.fire({
            icon: "error",
            title: error.message
        })
    }

    // Initialize WebSocket connection
    let stompClient = null;

    function connectWebSocket() {
      const socket = new SockJS(`${BASE_URL}/ws-messages`);
      stompClient = Stomp.over(socket);

      stompClient.connect({}, function () {
        // Subscribe to user's chat channel
        stompClient.subscribe(`/topic/user/${currentUserId}/chat`, function (message) {
          const msg = JSON.parse(message.body);
          handleNewMessage(msg);
        });
      }, function (error) {
        console.error('WebSocket connection error:', error);
        setTimeout(connectWebSocket, 5000);
      });
    }

    // Load friends and create private chats
    async function loadFriendsAndChats() {
      try {
        // Get friends list
        const friendsResponse = await fetch(`${BASE_URL}/friendship/friends`, {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });

        if (!friendsResponse.ok) throw new Error('Failed to fetch friends');
        const friendsData = await friendsResponse.json();

        // Get existing chats
        const chatsResponse = await fetch(`${BASE_URL}/chats/chats`, {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });

        if (!chatsResponse.ok) throw new Error('Failed to fetch chats');
        const chatsData = await chatsResponse.json();

        let privateChats = [];
        let groupChats = [];
        // Process private chats
        if (chatsData.length > 0) {
          privateChats = chatsData.data.filter(chat => chat.type === 'PRIVATE');
          groupChats = chatsData.data.filter(chat => chat.type === 'GROUP');
        }

        // Create private chat elements
        const privateChatsContainer = document.getElementById('private-chats-list');
        const noPrivateChats = document.getElementById('no-private-chats');

        if (privateChats.length > 0) {
          noPrivateChats.style.display = 'none';
          privateChatsContainer.innerHTML = privateChats.map(chat => createChatElement(chat)).join('');
        }

        // Create group chat elements
        const groupChatsContainer = document.getElementById('group-chats-list');
        const noGroupChats = document.getElementById('no-group-chats');

        if (groupChats.length > 0) {
          noGroupChats.style.display = 'none';
          groupChatsContainer.innerHTML = groupChats.map(chat => createChatElement(chat)).join('');
        }

        // Create private chats for friends without existing chats
        for (const friend of friendsData.data) {
          if (!privateChats.some(chat =>
              chat.participants.some(p => p.userId === friend.userId))) {
            if (friend.user1.email !== authData.email) {
              await createPrivateChat(friend.user1.userId);
            } else {
              await createPrivateChat(friend.user2.userId);
            }
          }
        }

        // Add click handlers
        document.querySelectorAll('.chat-item').forEach(item => {
          item.addEventListener('click', () => selectChat(item.dataset.chatId));
        });
      } catch (error) {
        console.error('Error loading chats:', error);
        Toast.fire({
          icon: "error",
          title: "Failed to load chats"
        });
      }
    }

    function createChatElement(chat) {
      const otherParticipant = chat.type === 'PRIVATE'
          ? chat.participants.find(p => p.userId !== currentUserId)
          : null;

      const name = chat.type === 'PRIVATE'
          ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
          : chat.groupName;

      const image = chat.type === 'PRIVATE'
          ? otherParticipant.profilePictureUrl || '../assets/image/Profile-picture.png'
          : chat.groupImageUrl || '../assets/image/Profile-picture.png';

      const lastMessage = chat.lastMessage
          ? `<p class="mb-0 text-truncate">${chat.lastMessage.content}</p>`
          : '<p class="mb-0 text-muted">No messages yet</p>';

      return `
      <div class="chat-item" data-chat-id="${chat.chatId}" data-chat-type="${chat.type}">
        <div class="d-flex align-items-center">
          <div class="position-relative">
            <img src="${image}" alt="${name}" class="rounded-circle">
            ${otherParticipant?.isOnline ? '<span class="online-indicator"></span>' : ''}
          </div>
          <div class="chat-info">
            <h6 class="mb-0">${name}</h6>
            ${lastMessage}
          </div>
          <div class="chat-meta">
            ${chat.lastMessage ? `
              <span class="time">${formatTime(chat.lastMessage.sentAt)}</span>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    }

    async function createPrivateChat(userId) {
      try {
        const response = await fetch(`${BASE_URL}/chats/private?userId=${userId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });

        if (!response.ok) throw new Error('Failed to create private chat');
        return await response.json();
      } catch (error) {
        console.error('Error creating private chat:', error);
      }
    }

    async function selectChat(chatId) {
      try {
        // Load chat messages
        const response = await fetch(`${BASE_URL}/chats/${chatId}/messages`, {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });

        if (!response.ok) throw new Error('Failed to load messages');
        const messages = await response.json();

        // Update UI
        document.getElementById('initial-state').style.display = 'none';
        document.getElementById('active-chat').style.display = 'block';

        // Update chat header
        const chatItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
        const chatName = chatItem.querySelector('h6').textContent;
        const chatImage = chatItem.querySelector('img').src;
        const isOnline = chatItem.querySelector('.online-indicator') !== null;

        updateChatHeader(chatName, chatImage, isOnline);

        // Display messages
        const messagesContainer = document.querySelector('.chat-messages');
        messagesContainer.innerHTML = messages.data
            .map(msg => createMessageElement(msg))
            .join('');

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      } catch (error) {
        console.error('Error selecting chat:', error);
        Toast.fire({
          icon: "error",
          title: "Failed to load chat"
        });
      }
    }

    function createMessageElement(message) {
      const isSent = message.sender.userId === currentUserId;
      const time = formatTime(message.sentAt);

      return `
      <div class="message ${isSent ? 'sent' : 'received'}">
        <div class="message-content">
          ${message.mediaUrl
          ? `<img src="${message.mediaUrl}" alt="Shared image" class="message-image">`
          : ''
      }
          <p>${message.content}</p>
          <span class="message-time">${time}</span>
          ${isSent ? '<span class="message-status"><i class="bi bi-check2-all"></i></span>' : ''}
        </div>
      </div>
    `;
    }

    function formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    }

    function updateChatHeader(name, imgSrc, isOnline) {
      const header = document.querySelector('.chat-header');
      const userImg = header.querySelector('img');
      const userName = header.querySelector('h6');
      const statusText = header.querySelector('small');
      const onlineIndicator = header.querySelector('.online-indicator');

      userImg.src = imgSrc;
      userName.textContent = name;
      statusText.textContent = isOnline ? 'Online' : 'Offline';

      if (isOnline) {
        if (!onlineIndicator) {
          const indicator = document.createElement('span');
          indicator.className = 'online-indicator';
          userImg.parentElement.appendChild(indicator);
        }
      } else {
        onlineIndicator?.remove();
      }
    }

    // Initialize Agora for calls
    async function initializeAgoraCall(isVideo) {
      try {
        const agoraClient = AgoraRTC.createClient({mode: 'rtc', codec: 'vp8'});
        const appId = '428728982af04de9902f5f12ffd88b21';
        const channelName = selectedChatId.toString();

        // Create local tracks
        const [audioTrack, videoTrack] = isVideo
            ? await AgoraRTC.createMicrophoneAndCameraTracks()
            : [await AgoraRTC.createMicrophoneAudioTrack(), null];

        // Join the channel
        const uid = await agoraClient.join(appId, channelName, null, null);

        // Show call UI
        document.getElementById('call-container').style.display = 'block';
        document.getElementById('call-title').textContent =
            `${isVideo ? 'Video' : 'Voice'} Call with ${document.querySelector('.chat-header h6').textContent}`;

        // Add call controls
        const callControls = document.createElement('div');
        callControls.className = 'call-controls';
        callControls.innerHTML = `
        <button class="btn btn-light mx-2" id="toggleAudio">
          <i class="bi bi-mic-fill"></i>
        </button>
        ${isVideo ? `
          <button class="btn btn-light mx-2" id="toggleVideo">
            <i class="bi bi-camera-video-fill"></i>
          </button>
        ` : ''}
        <button class="btn btn-danger mx-2" id="endCallBtn">
          <i class="bi bi-telephone-x-fill"></i>
        </button>
      `;
        document.querySelector('.call-header').appendChild(callControls);

        // Publish local tracks
        await agoraClient.publish(audioTrack);
        if (isVideo && videoTrack) {
          await agoraClient.publish(videoTrack);
          videoTrack.play('local-video-container');
        }

        // Handle remote user events
        agoraClient.on('user-published', async (remoteUser, mediaType) => {
          await agoraClient.subscribe(remoteUser, mediaType);

          if (mediaType === 'audio') {
            remoteUser.audioTrack.play();
          }
          if (mediaType === 'video') {
            remoteUser.videoTrack.play('remote-video-container');
          }
        });

        // Handle user unpublished
        agoraClient.on('user-unpublished', async (remoteUser, mediaType) => {
          if (mediaType === 'audio') {
            remoteUser.audioTrack?.stop();
          }
          if (mediaType === 'video') {
            remoteUser.videoTrack?.stop();
          }
        });

        // Setup control buttons
        document.getElementById('toggleAudio')?.addEventListener('click', async () => {
          if (audioTrack.enabled) {
            await audioTrack.setEnabled(false);
            document.querySelector('#toggleAudio i').className = 'bi bi-mic-mute-fill';
          } else {
            await audioTrack.setEnabled(true);
            document.querySelector('#toggleAudio i').className = 'bi bi-mic-fill';
          }
        });

        if (isVideo) {
          document.getElementById('toggleVideo')?.addEventListener('click', async () => {
            if (videoTrack.enabled) {
              await videoTrack.setEnabled(false);
              document.querySelector('#toggleVideo i').className = 'bi bi-camera-video-off-fill';
            } else {
              await videoTrack.setEnabled(true);
              document.querySelector('#toggleVideo i').className = 'bi bi-camera-video-fill';
            }
          });
        }

        // Handle end call
        const endCall = async () => {
          audioTrack?.close();
          videoTrack?.close();
          await agoraClient.leave();
          document.getElementById('call-container').style.display = 'none';
          document.querySelector('.call-controls')?.remove();
        };

        document.getElementById('endCallBtn').addEventListener('click', endCall);

        // Handle user leaving
        agoraClient.on('user-left', endCall);

        return {agoraClient, audioTrack, videoTrack};
      } catch (error) {
        console.error('Error in call:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Call Failed',
          text: 'Failed to establish the call. Please try again.',
        });
      }
    }

    // Call button event listeners
    document.querySelector('.chat-actions .bi-telephone').parentElement.addEventListener('click', () => {
      initializeAgoraCall(false);
    });

    document.querySelector('.chat-actions .bi-camera-video').parentElement.addEventListener('click', () => {
      initializeAgoraCall(true);
    });
  }
});