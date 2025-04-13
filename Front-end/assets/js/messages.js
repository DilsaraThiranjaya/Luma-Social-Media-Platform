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

  function initializeUI() {
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

    // State variables
    let selectedChatId = null;
    let currentUserId = authData.userId;
    let currentFile = null;
    let stompClient = null;
    let agoraClient = null;

    // DOM elements
    const messageInput = document.querySelector('.chat-input-container input');
    const sendButton = document.querySelector('.chat-input-container .btn-primary');
    const attachButton = document.querySelector('.chat-input-container .bi-paperclip').parentElement;
    const emojiButton = document.querySelector('.chat-input-container .bi-emoji-smile').parentElement;
    const newGroupChatBtn = document.getElementById('newGroupChatBtn');
    const chatItems = document.querySelectorAll('.chat-item');

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

    // Initialize WebSocket connection
    function connectWebSocket(chatId) {
      if (stompClient && stompClient.connected) {
        stompClient.disconnect();
      }

      const socket = new SockJS('/ws-messages');
      stompClient = Stomp.over(socket);

      stompClient.connect({}, function(frame) {
        stompClient.subscribe(`/topic/chat/${chatId}`, function(message) {
          const msg = JSON.parse(message.body);
          addMessageToUI(msg, msg.sender.userId !== currentUserId);
        });
      }, function(error) {
        console.error('WebSocket connection error:', error);
        setTimeout(() => connectWebSocket(chatId), 5000);
      });
    }

    // Initialize Agora for calls
    function initializeAgoraCall() {
      agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      agoraClient.init('428728982af04de9902f5f12ffd88b21');
    }

    // Message handling
    function sendMessage() {
      const message = messageInput.value.trim();
      if (message || currentFile) {
        const formData = new FormData();
        if (currentFile) formData.append('file', currentFile);
        formData.append('content', message);
        formData.append('chatId', selectedChatId);
        formData.append('senderId', currentUserId);

        fetch(`${BASE_URL}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authData.token}`
          },
          body: formData
        }).then(response => {
          if (!response.ok) throw new Error('Failed to send message');
          return response.json();
        }).then(data => {
          addMessageToUI(data, true);
          messageInput.value = '';
          currentFile = null;
        }).catch(error => {
          Toast.fire({
            icon: "error",
            title: error.message || "Failed to send message"
          });
        });
      }
    }

    // UI Update functions
    function addMessageToUI(message, isReceived) {
      const messagesContainer = document.querySelector('.chat-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${isReceived ? 'received' : 'sent'}`;

      const time = new Date(message.sentAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });

      let contentHTML = '';
      if (message.mediaType === 'IMAGE') {
        contentHTML = `<img src="${message.mediaUrl}" alt="Shared image" class="message-image">`;
      } else {
        contentHTML = `<p>${message.content}</p>`;
      }

      messageDiv.innerHTML = `
        <div class="message-content">
          ${contentHTML}
          <span class="message-time">${time}</span>
          ${!isReceived ? '<span class="message-status"><i class="bi bi-check2"></i></span>' : ''}
        </div>
      `;

      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      if (!isReceived) {
        const status = messageDiv.querySelector('.message-status i');
        setTimeout(() => {
          status.className = 'bi bi-check2-all';
          setTimeout(() => {
            status.className = 'bi bi-check2-all text-primary';
          }, 1000);
        }, 1000);
      }
    }

    function updateChatHeader(name, imgSrc, isOnline) {
      const header = document.querySelector('.chat-header');
      const userImg = header.querySelector('img');
      const userName = header.querySelector('h6');
      const statusText = header.querySelector('small');
      const onlineIndicator = header.querySelector('.online-indicator');

      userImg.src = imgSrc;
      userName.textContent = name;

      if (isOnline) {
        statusText.textContent = 'Online';
        if (!onlineIndicator) {
          const indicator = document.createElement('span');
          indicator.className = 'online-indicator';
          userImg.parentElement.appendChild(indicator);
        }
      } else {
        statusText.textContent = 'Offline';
        if (onlineIndicator) {
          onlineIndicator.remove();
        }
      }
    }

    function showTypingIndicator() {
      const messagesContainer = document.querySelector('.chat-messages');
      const typingDiv = document.createElement('div');
      typingDiv.className = 'message received';
      typingDiv.innerHTML = `
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      setTimeout(() => typingDiv.remove(), 2000);
    }

    // Event listeners
    chatItems.forEach(item => {
      item.addEventListener('click', function() {
        chatItems.forEach(chat => chat.classList.remove('active'));
        this.classList.add('active');

        const userName = this.querySelector('h6').textContent;
        const userImg = this.querySelector('img').src;
        const isOnline = this.querySelector('.online-indicator') !== null;
        selectedChatId = this.dataset.chatId;

        updateChatHeader(userName, userImg, isOnline);
        connectWebSocket(selectedChatId);

        const unreadCount = this.querySelector('.unread-count');
        if (unreadCount) unreadCount.remove();
      });
    });

    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') sendMessage();
    });

    sendButton.addEventListener('click', sendMessage);

    attachButton.addEventListener('click', function() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.click();

      input.onchange = function(e) {
        currentFile = e.target.files[0];
        if (currentFile) {
          const reader = new FileReader();
          reader.onload = function(e) {
            // Show preview before sending
            const preview = document.createElement('div');
            preview.className = 'message-preview';
            preview.innerHTML = `
              <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px;">
              <button class="btn btn-sm btn-danger mt-2" id="cancelUpload">Cancel</button>
            `;
            document.querySelector('.chat-input-container').before(preview);

            document.getElementById('cancelUpload').addEventListener('click', () => {
              currentFile = null;
              preview.remove();
            });
          };
          reader.readAsDataURL(currentFile);
        }
      };
    });

    // Emoji picker
    function createEmojiPicker() {
      const emojiContainer = document.createElement('div');
      emojiContainer.className = 'emoji-picker';
      emojiContainer.style.cssText = `
        position: absolute;
        bottom: 100%;
        left: 0;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        padding: 1rem;
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        z-index: 1000;
      `;

      const emojis = ['😀', '😂', '😊', '😍', '🥰', '😎', '😇', '🤔', '😄', '😅', '😉', '😋', '😘', '🥳', '😮', '😢', '😡', '👍', '👎', '❤️', '🔥', '✨', '🎉', '👏', '🙏', '💯', '💪', '🤝', '🫡', '🙌'];

      emojis.forEach(emoji => {
        const emojiSpan = document.createElement('span');
        emojiSpan.textContent = emoji;
        emojiSpan.style.cssText = `
          font-size: 1.5rem;
          cursor: pointer;
          text-align: center;
          transition: transform 0.2s;
        `;
        emojiSpan.addEventListener('click', () => {
          messageInput.value += emoji;
          messageInput.focus();
        });
        emojiSpan.addEventListener('mouseover', () => {
          emojiSpan.style.transform = 'scale(1.2)';
        });
        emojiSpan.addEventListener('mouseout', () => {
          emojiSpan.style.transform = 'scale(1)';
        });
        emojiContainer.appendChild(emojiSpan);
      });

      return emojiContainer;
    }

    let emojiPicker = null;
    emojiButton.addEventListener('click', function() {
      if (emojiPicker) {
        emojiPicker.remove();
        emojiPicker = null;
      } else {
        emojiPicker = createEmojiPicker();
        this.parentElement.appendChild(emojiPicker);

        document.addEventListener('click', function closeEmojiPicker(e) {
          if (!emojiPicker.contains(e.target) && e.target !== emojiButton) {
            emojiPicker.remove();
            emojiPicker = null;
            document.removeEventListener('click', closeEmojiPicker);
          }
        });
      }
    });

    // Group chat functionality
    if (newGroupChatBtn) {
      newGroupChatBtn.addEventListener('click', createNewGroupChat);
    }

    function createNewGroupChat() {
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
                    <div class="selected-members border rounded p-2 mb-2" style="min-height: 50px;">
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

      // Load friends list
      fetchFriendsForGroup();
    }

    async function fetchFriendsForGroup() {
      try {
        const response = await fetch(`${BASE_URL}/friendship/friends`, {
          headers: {
            'Authorization': `Bearer ${authData.token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch friends');

        const friends = await response.json();
        const resultsContainer = document.getElementById('memberSearchResults');

        resultsContainer.innerHTML = friends.data.map(friend => `
          <div class="member-item d-flex align-items-center p-2 border-bottom" 
               data-id="${friend.userId}" data-name="${friend.firstName} ${friend.lastName}">
            <div class="position-relative">
              <img src="${friend.profilePictureUrl || '../assets/image/Test-profile-img.jpg'}" 
                   alt="Profile" class="rounded-circle me-2" style="width: 32px; height: 32px;">
            </div>
            <span>${friend.firstName} ${friend.lastName}</span>
            <button class="btn btn-sm btn-primary ms-auto add-member-btn">Add</button>
          </div>
        `).join('');

        setupGroupCreationListeners();
      } catch (error) {
        Toast.fire({
          icon: "error",
          title: error.message || "Failed to load friends"
        });
      }
    }

    function setupGroupCreationListeners() {
      document.querySelectorAll('.add-member-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const memberItem = this.closest('.member-item');
          const memberId = memberItem.dataset.id;
          const memberName = memberItem.dataset.name;

          if (document.querySelector(`.selected-member[data-id="${memberId}"]`)) return;

          const selectedMemberHTML = `
            <div class="selected-member badge bg-primary d-flex align-items-center p-2" data-id="${memberId}">
              ${memberName}
              <button type="button" class="btn-close btn-close-white ms-2 remove-member-btn" aria-label="Remove"></button>
            </div>
          `;

          document.getElementById('selectedMembersList').insertAdjacentHTML('beforeend', selectedMemberHTML);

          document.querySelector(`.selected-member[data-id="${memberId}"] .remove-member-btn`)
              .addEventListener('click', function() {
                this.closest('.selected-member').remove();
              });
        });
      });

      document.getElementById('searchMemberBtn').addEventListener('click', function() {
        const searchTerm = document.getElementById('memberSearch').value.toLowerCase();
        document.querySelectorAll('.member-item').forEach(item => {
          const name = item.dataset.name.toLowerCase();
          item.style.display = name.includes(searchTerm) ? 'flex' : 'none';
        });
      });

      document.getElementById('memberSearch').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') document.getElementById('searchMemberBtn').click();
      });

      document.getElementById('createGroupBtn').addEventListener('click', async function() {
        const groupName = document.getElementById('groupName').value.trim();
        const selectedMembers = document.querySelectorAll('.selected-member');
        const groupImage = document.getElementById('groupImage').files[0];

        if (!groupName) {
          Toast.fire({
            icon: "error",
            title: "Please enter a group name"
          });
          return;
        }

        if (selectedMembers.length < 1) {
          Toast.fire({
            icon: "error",
            title: "Please add at least 1 member"
          });
          return;
        }

        const memberIds = Array.from(selectedMembers).map(member => member.dataset.id);
        const formData = new FormData();

        formData.append('groupName', groupName);
        formData.append('participantIds', JSON.stringify(memberIds));
        if (groupImage) formData.append('groupImage', groupImage);

        try {
          const response = await fetch(`${BASE_URL}/chats/group`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authData.token}`
            },
            body: formData
          });

          if (!response.ok) throw new Error('Failed to create group');

          const groupChat = await response.json();
          createGroupInUI(groupChat.data);

          bootstrap.Modal.getInstance(document.getElementById('createGroupModal')).hide();
          Toast.fire({
            icon: "success",
            title: "Group created successfully!"
          });
        } catch (error) {
          Toast.fire({
            icon: "error",
            title: error.message || "Failed to create group"
          });
        }
      });
    }

    function createGroupInUI(groupChat) {
      const newGroupHTML = `
        <div class="chat-item" data-chat-id="${groupChat.chatId}">
          <div class="d-flex align-items-center">
            <div class="position-relative">
              <img src="${groupChat.groupImageUrl || '../assets/image/Test-profile-img.jpg'}" 
                   alt="Group" class="rounded-circle">
            </div>
            <div class="chat-info">
              <h6 class="mb-0">${groupChat.groupName}</h6>
              <p class="mb-0">You created this group</p>
            </div>
            <div class="chat-meta">
              <span class="time">now</span>
            </div>
          </div>
        </div>
      `;

      const groupChatsList = document.querySelector('#group-chats .chat-list');
      groupChatsList.insertAdjacentHTML('afterbegin', newGroupHTML);

      const newGroup = groupChatsList.querySelector('.chat-item:first-child');
      newGroup.addEventListener('click', function() {
        document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
        this.classList.add('active');
        selectedChatId = this.dataset.chatId;

        updateChatHeader(groupChat.groupName,
            groupChat.groupImageUrl || '../assets/image/Test-profile-img.jpg',
            false);
        connectWebSocket(selectedChatId);

        // Clear and load messages for this group
        const chatMessages = document.querySelector('.chat-messages');
        chatMessages.innerHTML = `
          <div class="message-date-divider">
            <span>Today</span>
          </div>
          <div class="d-flex justify-content-center my-4">
            <div class="text-center text-muted">
              <div class="mb-2">
                <i class="bi bi-people-fill fs-1"></i>
              </div>
              <p>Group created. Say hello!</p>
            </div>
          </div>
        `;
      });
    }

    // Call functionality
    function startCall(isVideo) {
      const channelName = selectedChatId.toString();

      agoraClient.join(null, channelName, null, (uid) => {
        if (isVideo) {
          const localStream = AgoraRTC.createStream({
            audio: true,
            video: true,
            uid: uid
          });

          localStream.init(() => {
            document.getElementById('local-video').srcObject = localStream;
            agoraClient.publish(localStream);
          });
        }

        agoraClient.on('stream-added', (evt) => {
          agoraClient.subscribe(evt.stream, (err) => console.log(err));
        });

        agoraClient.on('stream-subscribed', (evt) => {
          const remoteStream = evt.stream;
          document.getElementById('remote-video').srcObject = remoteStream;
        });

        // Show call UI
        document.getElementById('call-container').style.display = 'block';
        document.getElementById('call-title').textContent =
            `Call with ${document.querySelector('.chat-header h6').textContent}`;
      });
    }

    function endCall() {
      agoraClient.leave(() => {
        document.getElementById('call-container').style.display = 'none';
        const localVideo = document.getElementById('local-video');
        const remoteVideo = document.getElementById('remote-video');

        if (localVideo.srcObject) {
          localVideo.srcObject.getTracks().forEach(track => track.stop());
          localVideo.srcObject = null;
        }

        if (remoteVideo.srcObject) {
          remoteVideo.srcObject.getTracks().forEach(track => track.stop());
          remoteVideo.srcObject = null;
        }
      });
    }

    // Initialize call buttons
    document.querySelector('.chat-actions .bi-telephone').parentElement.addEventListener('click', () => {
      initializeAgoraCall();
      startCall(false);
    });

    document.querySelector('.chat-actions .bi-camera-video').parentElement.addEventListener('click', () => {
      initializeAgoraCall();
      startCall(true);
    });

    document.getElementById('endCallBtn').addEventListener('click', endCall);

    // Initialize scroll position
    document.querySelector('.chat-messages').scrollTop =
        document.querySelector('.chat-messages').scrollHeight;
  }
});