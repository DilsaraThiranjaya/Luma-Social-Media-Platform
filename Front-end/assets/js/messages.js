document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));

  // Chat list item click handler
  const chatItems = document.querySelectorAll('.chat-item');
  chatItems.forEach(item => {
    item.addEventListener('click', function() {
      // Remove active class from all items
      chatItems.forEach(chat => chat.classList.remove('active'));
      // Add active class to clicked item
      this.classList.add('active');

      // Update chat window header with selected chat info
      const userName = this.querySelector('h6').textContent;
      const userImg = this.querySelector('img').src;
      const isOnline = this.querySelector('.online-indicator') !== null;

      updateChatHeader(userName, userImg, isOnline);

      // Remove unread count if present
      const unreadCount = this.querySelector('.unread-count');
      if (unreadCount) {
        unreadCount.remove();
      }
    });
  });

  // Update chat header function
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

  // Message input handler
  const messageInput = document.querySelector('.chat-input-container input');
  const sendButton = document.querySelector('.chat-input-container .btn-primary');

  function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
      addMessage(message, true);
      messageInput.value = '';
      // Simulate reply after 2 seconds
      setTimeout(() => {
        showTypingIndicator();
        setTimeout(() => {
          const replies = [
            "Got it! Thanks for letting me know.",
            "That sounds great!",
            "I'll check and get back to you.",
            "Perfect! Let's proceed with that.",
            "Thanks for the update!"
          ];
          const randomReply = replies[Math.floor(Math.random() * replies.length)];
          addMessage(randomReply, false);
        }, 2000);
      }, 1000);
    }
  }

  messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  sendButton.addEventListener('click', sendMessage);

  // Add message to chat
  function addMessage(text, isSent) {
    const messagesContainer = document.querySelector('.chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;

    const time = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });

    messageDiv.innerHTML = `
      <div class="message-content">
        <p>${text}</p>
        <span class="message-time">${time}</span>
        ${isSent ? '<span class="message-status"><i class="bi bi-check2"></i></span>' : ''}
      </div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // If sent message, simulate message status changes
    if (isSent) {
      const status = messageDiv.querySelector('.message-status i');
      setTimeout(() => {
        status.className = 'bi bi-check2-all';
      }, 1000);
      setTimeout(() => {
        status.className = 'bi bi-check2-all text-primary';
      }, 2000);
    }
  }

  // Show typing indicator
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

    // Remove typing indicator after 2 seconds
    setTimeout(() => {
      typingDiv.remove();
    }, 2000);
  }

  // File attachment handler
  const attachButton = document.querySelector('.chat-input-container .bi-paperclip').parentElement;
  attachButton.addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();

    input.onchange = function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          addImageMessage(e.target.result, true);
        };
        reader.readAsDataURL(file);
      }
    };
  });

  // Add image message
  function addImageMessage(imgSrc, isSent) {
    const messagesContainer = document.querySelector('.chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;

    const time = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });

    messageDiv.innerHTML = `
      <div class="message-content">
        <img src="${imgSrc}" alt="Shared image" class="message-image">
        <span class="message-time">${time} </span>
        ${isSent ? '<span class="message-status"><i class="bi bi-check2"></i></span>' : ''}
      </div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // If sent message, simulate message status changes
    if (isSent) {
      const status = messageDiv.querySelector('.message-status i');
      setTimeout(() => {
        status.className = 'bi bi-check2-all';
      }, 1000);
      setTimeout(() => {
        status.className = 'bi bi-check2-all text-primary';
      }, 2000);
    }
  }

  // Emoji picker functionality
  const emojiButton = document.querySelector('.chat-input-container .bi-emoji-smile').parentElement;

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

      // Close emoji picker when clicking outside
      document.addEventListener('click', function closeEmojiPicker(e) {
        if (!emojiPicker.contains(e.target) && e.target !== emojiButton) {
          emojiPicker.remove();
          emojiPicker = null;
          document.removeEventListener('click', closeEmojiPicker);
        }
      });
    }
  });

  // Initialize chat window scroll position
  const messagesContainer = document.querySelector('.chat-messages');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Add this to your messages.js file

// Set up the new group chat button click event
const newGroupChatBtn = document.getElementById('newGroupChatBtn');
if (newGroupChatBtn) {
  newGroupChatBtn.addEventListener('click', createNewGroupChat);
}

// Function to create a new group chat
function createNewGroupChat() {
  // Create modal for group creation
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
                  <div class="d-flex flex-wrap gap-2" id="selectedMembersList">
                    <!-- Selected members will appear here -->
                  </div>
                </div>
                <div class="member-results border rounded p-2" style="max-height: 200px; overflow-y: auto;">
                  <div id="memberSearchResults">
                    <!-- Sample friends - In production, these would come from an API call -->
                    <div class="member-item d-flex align-items-center p-2 border-bottom" data-id="1" data-name="John Doe">
                      <div class="position-relative">
                        <img src="/assets/image/Test-profile-img.jpg" alt="Profile" class="rounded-circle me-2" style="width: 32px; height: 32px;">
                      </div>
                      <span>John Doe</span>
                      <button class="btn btn-sm btn-primary ms-auto add-member-btn">Add</button>
                    </div>
                    <div class="member-item d-flex align-items-center p-2 border-bottom" data-id="2" data-name="Jane Smith">
                      <div class="position-relative">
                        <img src="/assets/image/Test-profile-img.jpg" alt="Profile" class="rounded-circle me-2" style="width: 32px; height: 32px;">
                      </div>
                      <span>Jane Smith</span>
                      <button class="btn btn-sm btn-primary ms-auto add-member-btn">Add</button>
                    </div>
                    <div class="member-item d-flex align-items-center p-2" data-id="3" data-name="Mike Johnson">
                      <div class="position-relative">
                        <img src="/assets/image/Test-profile-img.jpg" alt="Profile" class="rounded-circle me-2" style="width: 32px; height: 32px;">
                      </div>
                      <span>Mike Johnson</span>
                      <button class="btn btn-sm btn-primary ms-auto add-member-btn">Add</button>
                    </div>
                  </div>
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

  // Append modal to body if it doesn't exist
  if (!document.getElementById('createGroupModal')) {
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // Initialize the modal
  const modal = new bootstrap.Modal(document.getElementById('createGroupModal'));
  modal.show();

  // Set up event listeners
  setupGroupCreationListeners();
}

// Set up event listeners for the group creation modal
function setupGroupCreationListeners() {
  // Add member to selected list
  document.querySelectorAll('.add-member-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const memberItem = this.closest('.member-item');
      const memberId = memberItem.dataset.id;
      const memberName = memberItem.dataset.name;

      // Check if member is already added
      if (document.querySelector(`.selected-member[data-id="${memberId}"]`)) return;

      const selectedMemberHTML = `
        <div class="selected-member badge bg-primary d-flex align-items-center p-2" data-id="${memberId}">
          ${memberName}
          <button type="button" class="btn-close btn-close-white ms-2 remove-member-btn" aria-label="Remove"></button>
        </div>
      `;

      document.getElementById('selectedMembersList').insertAdjacentHTML('beforeend', selectedMemberHTML);

      // Add remove event listener
      document.querySelector(`.selected-member[data-id="${memberId}"] .remove-member-btn`).addEventListener('click', function() {
        this.closest('.selected-member').remove();
      });
    });
  });

  // Search functionality (simplified - would connect to API in production)
  document.getElementById('searchMemberBtn').addEventListener('click', function() {
    const searchTerm = document.getElementById('memberSearch').value.toLowerCase();
    document.querySelectorAll('.member-item').forEach(item => {
      const name = item.dataset.name.toLowerCase();
      if (name.includes(searchTerm)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  });

  // Enter key in search box
  document.getElementById('memberSearch').addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
      document.getElementById('searchMemberBtn').click();
    }
  });

  // Create group button
  document.getElementById('createGroupBtn').addEventListener('click', function() {
    const groupName = document.getElementById('groupName').value.trim();
    const selectedMembers = document.querySelectorAll('.selected-member');

    // Validation
    if (!groupName) {
      alert('Please enter a group name');
      return;
    }

    if (selectedMembers.length < 2) {
      alert('Please add at least 2 members to create a group');
      return;
    }

    // Get member IDs
    const memberIds = Array.from(selectedMembers).map(member => member.dataset.id);

    // Create new group chat (this would typically be an API call)
    createGroupInUI(groupName, memberIds);

    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('createGroupModal')).hide();
  });
}

// Create the group in UI (in production, this would happen after API confirmation)
function createGroupInUI(groupName, memberIds) {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newGroupHTML = `
    <div class="chat-item">
      <div class="d-flex align-items-center">
        <div class="position-relative">
          <img src="/assets/image/Test-profile-img.jpg" alt="Group" class="rounded-circle">
        </div>
        <div class="chat-info">
          <h6 class="mb-0">${groupName}</h6>
          <p class="mb-0">You created this group</p>
        </div>
        <div class="chat-meta">
          <span class="time">now</span>
        </div>
      </div>
    </div>
  `;

  // Add to the group chats list
  const groupChatsList = document.querySelector('#group-chats .chat-list');
  groupChatsList.insertAdjacentHTML('afterbegin', newGroupHTML);

  // Add click event to the new group
  const newGroup = groupChatsList.querySelector('.chat-item:first-child');
  newGroup.addEventListener('click', function() {
    // Select the chat item
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    this.classList.add('active');

    // Update chat window (simplified)
    updateChatWindow(groupName, true);
  });

  // Show notification
  showNotification(`Group "${groupName}" created successfully!`);
}

// Update chat window when a group is selected
function updateChatWindow(groupName, isNew = false) {
  // Update header
  document.querySelector('.chat-header .chat-user-info h6').textContent = groupName;
  document.querySelector('.chat-header .chat-user-info small').textContent = 'Group Chat';

  // Clear messages if it's a new group
  if (isNew) {
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
  }
}

// Show notification
function showNotification(message) {
  const notificationHTML = `
    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 5">
      <div class="toast show align-items-center" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">
            ${message}
          </div>
          <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    </div>
  `;

  // Add notification to body
  const notificationElement = document.createElement('div');
  notificationElement.innerHTML = notificationHTML;
  document.body.appendChild(notificationElement);

  // Auto remove after 3 seconds
  setTimeout(() => {
    document.body.removeChild(notificationElement);
  }, 3000);
}
});

// // WebSocket connection
// let stompClient = null;
// let currentUser = null;
// let currentChat = null;
//
// // Agora client
// let agoraClient = null;
// let localAudioTrack = null;
// let localVideoTrack = null;
// let remoteAudioTrack = null;
// let remoteVideoTrack = null;
//
// // Connect to WebSocket
// function connectWebSocket() {
//   const socket = new SockJS('/ws');
//   stompClient = Stomp.over(socket);
//
//   stompClient.connect({}, function(frame) {
//     console.log('Connected to WebSocket');
//
//     // Subscribe to personal notifications
//     stompClient.subscribe('/user/queue/notifications', onNotification);
//
//     // Subscribe to call notifications
//     stompClient.subscribe('/user/queue/calls', onCallNotification);
//
//     // Subscribe to chat messages if there's an active chat
//     if (currentChat) {
//       subscribeToChat(currentChat.chatId);
//     }
//   });
// }
//
// // Subscribe to chat messages
// function subscribeToChat(chatId) {
//   // Unsubscribe from previous chat if any
//   if (currentChat && currentChat.subscription) {
//     currentChat.subscription.unsubscribe();
//   }
//
//   // Subscribe to new chat messages
//   const messageSubscription = stompClient.subscribe(
//       `/topic/chat/${chatId}`,
//       onChatMessage
//   );
//
//   // Subscribe to typing indicators
//   const typingSubscription = stompClient.subscribe(
//       `/topic/chat/${chatId}/typing`,
//       onTypingIndicator
//   );
//
//   currentChat = {
//     chatId: chatId,
//     subscription: messageSubscription,
//     typingSubscription: typingSubscription
//   };
// }
//
// // Handle incoming chat messages
// function onChatMessage(payload) {
//   const message = JSON.parse(payload.body);
//   addMessage(message.content, message.sender.userId === currentUser.userId);
// }
//
// // Handle typing indicators
// function onTypingIndicator(payload) {
//   const data = JSON.parse(payload.body);
//   if (data.sender !== currentUser.email) {
//     showTypingIndicator();
//   }
// }
//
// // Initialize Agora client
// async function initializeAgoraClient() {
//   agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
//
//   // Listen for remote user publishing tracks
//   agoraClient.on("user-published", async (user, mediaType) => {
//     await agoraClient.subscribe(user, mediaType);
//
//     if (mediaType === "video") {
//       remoteVideoTrack = user.videoTrack;
//       remoteVideoTrack.play("remote-video-container");
//     }
//
//     if (mediaType === "audio") {
//       remoteAudioTrack = user.audioTrack;
//       remoteAudioTrack.play();
//     }
//   });
// }
//
// // Start a call
// async function startCall(type, receiver) {
//   try {
//     // Get token from backend
//     const response = await fetch('/api/v1/calls/token', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         channelName: `chat_${currentChat.chatId}`,
//         type: type,
//         chatId: currentChat.chatId,
//         receiver: receiver
//       })
//     });
//
//     const data = await response.json();
//
//     if (data.status === "200") {
//       const callData = data.data;
//
//       // Initialize Agora client if not already initialized
//       if (!agoraClient) {
//         await initializeAgoraClient();
//       }
//
//       // Join channel
//       await agoraClient.join(
//           callData.appId,
//           callData.channelName,
//           callData.token,
//           callData.uid
//       );
//
//       // Create and publish local tracks
//       if (type === "video") {
//         [localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
//         await agoraClient.publish([localAudioTrack, localVideoTrack]);
//         localVideoTrack.play("local-video-container");
//       } else {
//         localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
//         await agoraClient.publish([localAudioTrack]);
//       }
//
//       // Show call interface
//       showCallInterface(type);
//
//       // Notify other user
//       stompClient.send("/app/message", {}, JSON.stringify({
//         type: "CALL_REQUEST",
//         payload: callData,
//         sender: currentUser.email,
//         receiver: receiver,
//         chatId: currentChat.chatId
//       }));
//     }
//   } catch (error) {
//     console.error("Error starting call:", error);
//     Swal.fire({
//       icon: 'error',
//       title: 'Call Failed',
//       text: 'Failed to start the call. Please try again.'
//     });
//   }
// }
//
// // End call
// async function endCall() {
//   // Stop and close tracks
//   if (localAudioTrack) {
//     localAudioTrack.stop();
//     localAudioTrack.close();
//   }
//   if (localVideoTrack) {
//     localVideoTrack.stop();
//     localVideoTrack.close();
//   }
//
//   // Leave channel
//   await agoraClient.leave();
//
//   // Hide call interface
//   hideCallInterface();
// }
//
// // Show call interface
// function showCallInterface(type) {
//   const callContainer = document.createElement('div');
//   callContainer.id = 'call-container';
//   callContainer.innerHTML = `
//         <div class="call-header">
//             <h5>${type === 'video' ? 'Video Call' : 'Voice Call'}</h5>
//             <button class="btn btn-danger" onclick="endCall()">
//                 <i class="bi bi-telephone-x"></i> End Call
//             </button>
//         </div>
//         ${type === 'video' ? `
//             <div class="video-container">
//                 <div id="remote-video-container"></div>
//                 <div id="local-video-container"></div>
//             </div>
//         ` : `
//             <div class="audio-call-container">
//                 <div class="user-avatar">
//                     <img src="${currentChat.participant.profilePictureUrl}" alt="User">
//                 </div>
//                 <h6>${currentChat.participant.firstName} ${currentChat.participant.lastName}</h6>
//                 <p>Voice Call</p>
//             </div>
//         `}
//     `;
//
//   document.body.appendChild(callContainer);
// }
//
// // Hide call interface
// function hideCallInterface() {
//   const callContainer = document.getElementById('call-container');
//   if (callContainer) {
//     callContainer.remove();
//   }
// }
//
// // Initialize the chat
// document.addEventListener('DOMContentLoaded', function() {
//   // Connect to WebSocket
//   connectWebSocket();
//
//   // Initialize tooltips
//   const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
//   tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
//
//   // Add event listeners for call buttons
//   document.querySelector('[title="Voice Call"]').addEventListener('click', () => {
//     startCall('audio', currentChat.participant.email);
//   });
//
//   document.querySelector('[title="Video Call"]').addEventListener('click', () => {
//     startCall('video', currentChat.participant.email);
//   });
//
//   // Other existing event listeners...
// });