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
      initializeLogout();
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

  function initializeLogout() {
    const logoutButton = document.getElementById('logoutButton');
    logoutButton.addEventListener('click', async () => {
      try {
        sessionStorage.removeItem('authData');
        window.location.href = LOGIN_URL;
      } catch (error) {
        Toast.fire({
          icon: "error",
          title: error.message || "Logout Failed",
          text: error.message
        });
      }
    });
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
    // // Toast configuration
    // const Toast = Swal.mixin({
    //   toast: true,
    //   position: "bottom-end",
    //   iconColor: "white",
    //   customClass: {
    //     popup: "colored-toast",
    //   },
    //   showConfirmButton: false,
    //   timer: 1500,
    //   timerProgressBar: true,
    // });
    //
    // // Initialize
    // try {
    //   await loadFriendsAndChats();
    //   connectWebSocket();
    // } catch (error) {
    //     Toast.fire({
    //         icon: "error",
    //         title: error.message
    //     })
    // }
    //
    // // Initialize WebSocket connection
    // let stompClient = null;
    //
    // function connectWebSocket() {
    //   const socket = new SockJS(`${BASE_URL}/ws-messages`);
    //   stompClient = Stomp.over(socket);
    //
    //   stompClient.connect({}, function () {
    //     // Subscribe to user's chat channel
    //     stompClient.subscribe(`/topic/user/${currentUserId}/chat`, function (message) {
    //       const msg = JSON.parse(message.body);
    //
    //       handleNewMessage(msg);
    //     });
    //   }, function (error) {
    //     console.error('WebSocket connection error:', error);
    //     setTimeout(connectWebSocket, 5000);
    //   });
    // }
    //
    // function handleNewMessage(msg) {
    //
    // }
    //
    // // Load friends and create private chats
    // async function loadFriendsAndChats() {
    //   try {
    //     // Get friends list
    //     const friendsResponse = await fetch(`${BASE_URL}/friendship/friends`, {
    //       headers: {
    //         'Authorization': `Bearer ${authData.token}`
    //       }
    //     });
    //
    //     if (!friendsResponse.ok) throw new Error('Failed to fetch friends');
    //     const friendsData = await friendsResponse.json();
    //
    //     // Get existing chats
    //     const chatsResponse = await fetch(`${BASE_URL}/chats/chats`, {
    //       headers: {
    //         'Authorization': `Bearer ${authData.token}`
    //       }
    //     });
    //
    //     if (!chatsResponse.ok) throw new Error('Failed to fetch chats');
    //     const chatsData = await chatsResponse.json();
    //
    //     let privateChats = [];
    //     let groupChats = [];
    //     // Process private chats
    //     if (chatsData.length > 0) {
    //       privateChats = chatsData.data.filter(chat => chat.type === 'PRIVATE');
    //       groupChats = chatsData.data.filter(chat => chat.type === 'GROUP');
    //     }
    //
    //     // Create private chat elements
    //     const privateChatsContainer = document.getElementById('private-chats-list');
    //     const noPrivateChats = document.getElementById('no-private-chats');
    //
    //     if (privateChats.length > 0) {
    //       noPrivateChats.style.display = 'none';
    //       privateChatsContainer.innerHTML = privateChats.map(chat => createChatElement(chat)).join('');
    //     }
    //
    //     // Create group chat elements
    //     const groupChatsContainer = document.getElementById('group-chats-list');
    //     const noGroupChats = document.getElementById('no-group-chats');
    //
    //     if (groupChats.length > 0) {
    //       noGroupChats.style.display = 'none';
    //       groupChatsContainer.innerHTML = groupChats.map(chat => createChatElement(chat)).join('');
    //     }
    //
    //     // Create private chats for friends without existing chats
    //     for (const friend of friendsData.data) {
    //       if (!privateChats.some(chat =>
    //           chat.participants.some(p => p.userId === friend.userId))) {
    //         if (friend.user1.email !== authData.email) {
    //           await createPrivateChat(friend.user1.userId);
    //         } else {
    //           await createPrivateChat(friend.user2.userId);
    //         }
    //       }
    //     }
    //
    //     // Add click handlers
    //     document.querySelectorAll('.chat-item').forEach(item => {
    //       item.addEventListener('click', () => selectChat(item.dataset.chatId));
    //     });
    //   } catch (error) {
    //     console.error('Error loading chats:', error);
    //     Toast.fire({
    //       icon: "error",
    //       title: "Failed to load chats"
    //     });
    //   }
    // }
    //
    // function createChatElement(chat) {
    //   const otherParticipant = chat.type === 'PRIVATE'
    //       ? chat.participants.find(p => p.userId !== currentUserId)
    //       : null;
    //
    //   const name = chat.type === 'PRIVATE'
    //       ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
    //       : chat.groupName;
    //
    //   const image = chat.type === 'PRIVATE'
    //       ? otherParticipant.profilePictureUrl || '../assets/image/Profile-picture.png'
    //       : chat.groupImageUrl || '../assets/image/Profile-picture.png';
    //
    //   const lastMessage = chat.lastMessage
    //       ? `<p class="mb-0 text-truncate">${chat.lastMessage.content}</p>`
    //       : '<p class="mb-0 text-muted">No messages yet</p>';
    //
    //   return `
    //   <div class="chat-item" data-chat-id="${chat.chatId}" data-chat-type="${chat.type}">
    //     <div class="d-flex align-items-center">
    //       <div class="position-relative">
    //         <img src="${image}" alt="${name}" class="rounded-circle">
    //         ${otherParticipant?.isOnline ? '<span class="online-indicator"></span>' : ''}
    //       </div>
    //       <div class="chat-info">
    //         <h6 class="mb-0">${name}</h6>
    //         ${lastMessage}
    //       </div>
    //       <div class="chat-meta">
    //         ${chat.lastMessage ? `
    //           <span class="time">${formatTime(chat.lastMessage.sentAt)}</span>
    //         ` : ''}
    //       </div>
    //     </div>
    //   </div>
    // `;
    // }
    //
    // async function createPrivateChat(userId) {
    //   try {
    //     const response = await fetch(`${BASE_URL}/chats/private?userId=${userId}`, {
    //       method: 'POST',
    //       headers: {
    //         'Authorization': `Bearer ${authData.token}`
    //       }
    //     });
    //
    //     if (!response.ok) throw new Error('Failed to create private chat');
    //     return await response.json();
    //   } catch (error) {
    //     console.error('Error creating private chat:', error);
    //   }
    // }
    //
    // async function selectChat(chatId) {
    //   try {
    //     // Load chat messages
    //     const response = await fetch(`${BASE_URL}/chats/${chatId}/messages`, {
    //       headers: {
    //         'Authorization': `Bearer ${authData.token}`
    //       }
    //     });
    //
    //     if (!response.ok) throw new Error('Failed to load messages');
    //     const messages = await response.json();
    //
    //     // Update UI
    //     document.getElementById('initial-state').style.display = 'none';
    //     document.getElementById('active-chat').style.display = 'block';
    //
    //     // Update chat header
    //     const chatItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
    //     const chatName = chatItem.querySelector('h6').textContent;
    //     const chatImage = chatItem.querySelector('img').src;
    //     const isOnline = chatItem.querySelector('.online-indicator') !== null;
    //
    //     updateChatHeader(chatName, chatImage, isOnline);
    //
    //     // Display messages
    //     const messagesContainer = document.querySelector('.chat-messages');
    //     messagesContainer.innerHTML = messages.data
    //         .map(msg => createMessageElement(msg))
    //         .join('');
    //
    //     messagesContainer.scrollTop = messagesContainer.scrollHeight;
    //   } catch (error) {
    //     console.error('Error selecting chat:', error);
    //     Toast.fire({
    //       icon: "error",
    //       title: "Failed to load chat"
    //     });
    //   }
    // }
    //
    // function createMessageElement(message) {
    //   const isSent = message.sender.userId === currentUserId;
    //   const time = formatTime(message.sentAt);
    //
    //   return `
    //   <div class="message ${isSent ? 'sent' : 'received'}">
    //     <div class="message-content">
    //       ${message.mediaUrl
    //       ? `<img src="${message.mediaUrl}" alt="Shared image" class="message-image">`
    //       : ''
    //   }
    //       <p>${message.content}</p>
    //       <span class="message-time">${time}</span>
    //       ${isSent ? '<span class="message-status"><i class="bi bi-check2-all"></i></span>' : ''}
    //     </div>
    //   </div>
    // `;
    // }
    //
    // function formatTime(timestamp) {
    //   return new Date(timestamp).toLocaleTimeString('en-US', {
    //     hour: 'numeric',
    //     minute: 'numeric',
    //     hour12: true
    //   });
    // }
    //
    // function updateChatHeader(name, imgSrc, isOnline) {
    //   const header = document.querySelector('.chat-header');
    //   const userImg = header.querySelector('img');
    //   const userName = header.querySelector('h6');
    //   const statusText = header.querySelector('small');
    //   const onlineIndicator = header.querySelector('.online-indicator');
    //
    //   userImg.src = imgSrc;
    //   userName.textContent = name;
    //   statusText.textContent = isOnline ? 'Online' : 'Offline';
    //
    //   if (isOnline) {
    //     if (!onlineIndicator) {
    //       const indicator = document.createElement('span');
    //       indicator.className = 'online-indicator';
    //       userImg.parentElement.appendChild(indicator);
    //     }
    //   } else {
    //     onlineIndicator?.remove();
    //   }
    // }
    //
    // // Initialize Agora for calls
    // async function initializeAgoraCall(isVideo) {
    //   try {
    //     const agoraClient = AgoraRTC.createClient({mode: 'rtc', codec: 'vp8'});
    //     const appId = '428728982af04de9902f5f12ffd88b21';
    //     const channelName = selectedChatId.toString();
    //
    //     // Create local tracks
    //     const [audioTrack, videoTrack] = isVideo
    //         ? await AgoraRTC.createMicrophoneAndCameraTracks()
    //         : [await AgoraRTC.createMicrophoneAudioTrack(), null];
    //
    //     // Join the channel
    //     const uid = await agoraClient.join(appId, channelName, null, null);
    //
    //     // Show call UI
    //     document.getElementById('call-container').style.display = 'block';
    //     document.getElementById('call-title').textContent =
    //         `${isVideo ? 'Video' : 'Voice'} Call with ${document.querySelector('.chat-header h6').textContent}`;
    //
    //     // Add call controls
    //     const callControls = document.createElement('div');
    //     callControls.className = 'call-controls';
    //     callControls.innerHTML = `
    //     <button class="btn btn-light mx-2" id="toggleAudio">
    //       <i class="bi bi-mic-fill"></i>
    //     </button>
    //     ${isVideo ? `
    //       <button class="btn btn-light mx-2" id="toggleVideo">
    //         <i class="bi bi-camera-video-fill"></i>
    //       </button>
    //     ` : ''}
    //     <button class="btn btn-danger mx-2" id="endCallBtn">
    //       <i class="bi bi-telephone-x-fill"></i>
    //     </button>
    //   `;
    //     document.querySelector('.call-header').appendChild(callControls);
    //
    //     // Publish local tracks
    //     await agoraClient.publish(audioTrack);
    //     if (isVideo && videoTrack) {
    //       await agoraClient.publish(videoTrack);
    //       videoTrack.play('local-video-container');
    //     }
    //
    //     // Handle remote user events
    //     agoraClient.on('user-published', async (remoteUser, mediaType) => {
    //       await agoraClient.subscribe(remoteUser, mediaType);
    //
    //       if (mediaType === 'audio') {
    //         remoteUser.audioTrack.play();
    //       }
    //       if (mediaType === 'video') {
    //         remoteUser.videoTrack.play('remote-video-container');
    //       }
    //     });
    //
    //     // Handle user unpublished
    //     agoraClient.on('user-unpublished', async (remoteUser, mediaType) => {
    //       if (mediaType === 'audio') {
    //         remoteUser.audioTrack?.stop();
    //       }
    //       if (mediaType === 'video') {
    //         remoteUser.videoTrack?.stop();
    //       }
    //     });
    //
    //     // Setup control buttons
    //     document.getElementById('toggleAudio')?.addEventListener('click', async () => {
    //       if (audioTrack.enabled) {
    //         await audioTrack.setEnabled(false);
    //         document.querySelector('#toggleAudio i').className = 'bi bi-mic-mute-fill';
    //       } else {
    //         await audioTrack.setEnabled(true);
    //         document.querySelector('#toggleAudio i').className = 'bi bi-mic-fill';
    //       }
    //     });
    //
    //     if (isVideo) {
    //       document.getElementById('toggleVideo')?.addEventListener('click', async () => {
    //         if (videoTrack.enabled) {
    //           await videoTrack.setEnabled(false);
    //           document.querySelector('#toggleVideo i').className = 'bi bi-camera-video-off-fill';
    //         } else {
    //           await videoTrack.setEnabled(true);
    //           document.querySelector('#toggleVideo i').className = 'bi bi-camera-video-fill';
    //         }
    //       });
    //     }
    //
    //     // Handle end call
    //     const endCall = async () => {
    //       audioTrack?.close();
    //       videoTrack?.close();
    //       await agoraClient.leave();
    //       document.getElementById('call-container').style.display = 'none';
    //       document.querySelector('.call-controls')?.remove();
    //     };
    //
    //     document.getElementById('endCallBtn').addEventListener('click', endCall);
    //
    //     // Handle user leaving
    //     agoraClient.on('user-left', endCall);
    //
    //     return {agoraClient, audioTrack, videoTrack};
    //   } catch (error) {
    //     console.error('Error in call:', error);
    //     await Swal.fire({
    //       icon: 'error',
    //       title: 'Call Failed',
    //       text: 'Failed to establish the call. Please try again.',
    //     });
    //   }
    // }
    //
    // // Call button event listeners
    // document.querySelector('.chat-actions .bi-telephone').parentElement.addEventListener('click', () => {
    //   initializeAgoraCall(false);
    // });
    //
    // document.querySelector('.chat-actions .bi-camera-video').parentElement.addEventListener('click', () => {
    //   initializeAgoraCall(true);
    // });

    let stompClient = null;
    let currentChatId = null;
    let currentUserId = authData.userId;

    // Initialize
    connectWebSocket();
    loadUserChats();

    // Initialize WebSocket connection
    function connectWebSocket() {
      const socket = new SockJS('/ws');
      stompClient = Stomp.over(socket);
      stompClient.connect({}, function(frame) {
        console.log('Connected: ' + frame);
        if (currentChatId) {
          subscribeToChatMessages(currentChatId);
        }
      });
    }

    function subscribeToChatMessages(chatId) {
      if (stompClient) {
        stompClient.subscribe('/topic/chat.' + chatId, function(message) {
          const messageData = JSON.parse(message.body);
          displayMessage(messageData);
        });
      }
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Load user chats
    async function loadUserChats() {
      try {
        const response = await fetch(`${BASE_URL}/chats`, {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const chats = response.data.data;
        displayChats(chats);
      } catch (error) {
        console.error('Error loading chats:', error);
      }
    }

    function displayChats(chats) {
      const privateChats = document.querySelector('#private-chats .chat-list');
      const groupChats = document.querySelector('#group-chats .chat-list');

      privateChats.innerHTML = '';
      groupChats.innerHTML = '';

      chats.forEach(chat => {
        const chatHtml = createChatListItem(chat);
        if (chat.type === 'PRIVATE') {
          privateChats.insertAdjacentHTML('beforeend', chatHtml);
        } else {
          groupChats.insertAdjacentHTML('beforeend', chatHtml);
        }
      });

      // Add click handlers to chat items
      document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', function() {
          const chatId = this.dataset.chatId;
          selectChat(chatId);
        });
      });
    }

    function createChatListItem(chat) {
      const lastMessage = chat.lastMessage ? chat.lastMessage.content : '';
      const unreadCount = chat.unreadCount;
      const isOnline = chat.participants.some(p => p.user.isOnline);

      return `
      <div class="chat-item" data-chat-id="${chat.chatId}">
        <div class="d-flex align-items-center">
          <div class="position-relative">
            <img src="${chat.type === 'GROUP' ? chat.groupImageUrl : chat.participants[0].user.profilePictureUrl}" 
                 alt="Profile" class="rounded-circle">
            ${isOnline ? '<span class="online-indicator"></span>' : ''}
          </div>
          <div class="chat-info">
            <h6 class="mb-0">${chat.type === 'GROUP' ? chat.groupName : chat.participants[0].user.firstName}</h6>
            <p class="mb-0">${lastMessage}</p>
          </div>
          <div class="chat-meta">
            ${chat.lastMessage ? `<span class="time">${formatTime(chat.lastMessage.sentAt)}</span>` : ''}
            ${unreadCount > 0 ? `<span class="unread-count">${unreadCount}</span>` : ''}
          </div>
        </div>
      </div>
    `;
    }

    async function selectChat(chatId) {
      try {
        const response = await axios.get(`/api/v1/chats/${chatId}`);
        const chat = response.data.data;
        currentChatId = chatId;

        // Update UI
        document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-chat-id="${chatId}"]`).classList.add('active');

        updateChatHeader(chat);
        loadChatMessages(chatId);

        // Subscribe to new messages
        subscribeToChatMessages(chatId);

        // Mark messages as read
        markMessagesAsRead(chatId);
      } catch (error) {
        console.error('Error selecting chat:', error);
      }
    }

    async function loadChatMessages(chatId) {
      try {
        const response = await axios.get(`/api/v1/chats/${chatId}/messages`);
        const messages = response.data.data;
        displayChatMessages(messages);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    }

    function displayChatMessages(messages) {
      const messagesContainer = document.querySelector('.chat-messages');
      messagesContainer.innerHTML = '<div class="message-date-divider"><span>Today</span></div>';

      messages.forEach(message => {
        displayMessage(message);
      });

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function displayMessage(message) {
      const messagesContainer = document.querySelector('.chat-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${message.sender.userId === currentUserId ? 'sent' : 'received'}`;

      const content = message.mediaUrl
          ? `<img src="${message.mediaUrl}" alt="Shared image" class="message-image"><p>${message.content || ''}</p>`
          : `<p>${message.content}</p>`;

      messageDiv.innerHTML = `
      <div class="message-content">
        ${content}
        <span class="message-time">${formatTime(message.sentAt)}</span>
        ${message.sender.userId === currentUserId ? '<span class="message-status"><i class="bi bi-check2-all"></i></span>' : ''}
      </div>
    `;

      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async function sendMessage(content, mediaUrl = null) {
      if (!currentChatId) return;

      const messageData = {
        chatId: currentChatId,
        content: content,
        mediaUrl: mediaUrl,
        mediaType: mediaUrl ? 'IMAGE' : null,
        sender: { userId: currentUserId }
      };

      try {
        if (stompClient) {
          stompClient.send("/app/chat.send", {}, JSON.stringify(messageData));
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }

    // Message input handler
    const messageInput = document.querySelector('.chat-input-container input');
    const sendButton = document.querySelector('.chat-input-container .btn-primary');

    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(this.value.trim());
        this.value = '';
      }
    });

    sendButton.addEventListener('click', function() {
      const content = messageInput.value.trim();
      if (content) {
        sendMessage(content);
        messageInput.value = '';
      }
    });

    // File attachment handler
    const attachButton = document.querySelector('.chat-input-container .bi-paperclip').parentElement;
    attachButton.addEventListener('click', function() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.click();

      input.onchange = async function(e) {
        const file = e.target.files[0];
        if (file) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await axios.post('/api/v1/upload', formData);
            const mediaUrl = response.data.url;
            sendMessage('', mediaUrl);
          } catch (error) {
            console.error('Error uploading file:', error);
          }
        }
      };
    });

    // Group chat creation
    const newGroupChatBtn = document.getElementById('newGroupChatBtn');
    if (newGroupChatBtn) {
      newGroupChatBtn.addEventListener('click', createNewGroupChat);
    }

    async function createNewGroupChat() {
      const modalHTML = `
      <div class="modal fade" id="createGroupModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Create New Group Chat</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="createGroupForm">
                <div class="mb-3">
                  <label for="groupName" class="form-label">Group Name</label>
                  <input type="text" class="form-control" id="groupName" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Group Members</label>
                  <div class="input-group mb-2">
                    <input type="text" class="form-control" id="memberSearch" placeholder="Search friends">
                    <button class="btn btn-primary" type="button" id="searchMemberBtn">
                      <i class="bi bi-search"></i>
                    </button>
                  </div>
                  <div class="selected-members border rounded p-2 mb-2">
                    <div class="d-flex flex-wrap gap-2" id="selectedMembersList"></div>
                  </div>
                  <div class="member-results border rounded p-2" style="max-height: 200px; overflow-y: auto;">
                    <div id="memberSearchResults"></div>
                  </div>
                </div>
                <div class="mb-3">
                  <label for="groupImage" class="form-label">Group Image (Optional)</label>
                  <input type="file" class="form-control" id="groupImage" accept="image/*">
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" id="createGroupBtn">Create Group</button>
            </div>
          </div>
        </div>
      </div>
    `;

      if (!document.getElementById('createGroupModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
      }

      const modal = new bootstrap.Modal(document.getElementById('createGroupModal'));
      modal.show();

      setupGroupCreationListeners();
    }

    function setupGroupCreationListeners() {
      const searchInput = document.getElementById('memberSearch');
      const searchButton = document.getElementById('searchMemberBtn');
      const createGroupButton = document.getElementById('createGroupBtn');

      searchButton.addEventListener('click', async () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
          try {
            const response = await axios.get(`/api/v1/users/search?q=${searchTerm}`);
            displaySearchResults(response.data.data);
          } catch (error) {
            console.error('Error searching users:', error);
          }
        }
      });

      createGroupButton.addEventListener('click', async () => {
        const groupName = document.getElementById('groupName').value.trim();
        const selectedMembers = Array.from(document.querySelectorAll('.selected-member'))
            .map(member => parseInt(member.dataset.id));
        const groupImageInput = document.getElementById('groupImage');

        if (!groupName || selectedMembers.length < 2) {
          alert('Please enter a group name and select at least 2 members');
          return;
        }

        try {
          let groupImageUrl = null;
          if (groupImageInput.files[0]) {
            const formData = new FormData();
            formData.append('file', groupImageInput.files[0]);
            const uploadResponse = await axios.post('/api/v1/upload', formData);
            groupImageUrl = uploadResponse.data.url;
          }

          const response = await axios.post('/api/v1/chats/group', {
            groupName: groupName,
            groupImageUrl: groupImageUrl,
            participantIds: selectedMembers
          });

          const newChat = response.data.data;
          loadUserChats(); // Refresh chat list
          selectChat(newChat.chatId); // Select the new chat

          bootstrap.Modal.getInstance(document.getElementById('createGroupModal')).hide();
        } catch (error) {
          console.error('Error creating group:', error);
          alert('Failed to create group chat');
        }
      });
    }

    function displaySearchResults(users) {
      const resultsContainer = document.getElementById('memberSearchResults');
      resultsContainer.innerHTML = users.map(user => `
      <div class="member-item d-flex align-items-center p-2 border-bottom" data-id="${user.userId}" data-name="${user.firstName} ${user.lastName}">
        <div class="position-relative">
          <img src="${user.profilePictureUrl}" alt="Profile" class="rounded-circle me-2" style="width: 32px; height: 32px;">
        </div>
        <span>${user.firstName} ${user.lastName}</span>
        <button class="btn btn-sm btn-primary ms-auto add-member-btn">Add</button>
      </div>
    `).join('');

      // Add click handlers for add buttons
      resultsContainer.querySelectorAll('.add-member-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const memberItem = this.closest('.member-item');
          addSelectedMember(memberItem.dataset.id, memberItem.dataset.name);
        });
      });
    }

    function addSelectedMember(userId, name) {
      const selectedList = document.getElementById('selectedMembersList');
      if (!document.querySelector(`.selected-member[data-id="${userId}"]`)) {
        const memberElement = document.createElement('div');
        memberElement.className = 'selected-member badge bg-primary d-flex align-items-center p-2';
        memberElement.dataset.id = userId;
        memberElement.innerHTML = `
        ${name}
        <button type="button" class="btn-close btn-close-white ms-2 remove-member-btn" aria-label="Remove"></button>
      `;

        memberElement.querySelector('.remove-member-btn').addEventListener('click', function() {
          memberElement.remove();
        });

        selectedList.appendChild(memberElement);
      }
    }

    // Utility functions
    function formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    }

    async function markMessagesAsRead(chatId) {
      try {
        await axios.post(`/api/v1/chats/${chatId}/messages/read`);
        const unreadBadge = document.querySelector(`[data-chat-id="${chatId}"] .unread-count`);
        if (unreadBadge) {
          unreadBadge.remove();
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  }
});