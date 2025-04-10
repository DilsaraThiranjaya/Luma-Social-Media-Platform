//package lk.ijse.backend.service.impl;
//
//import lk.ijse.backend.dto.*;
//import lk.ijse.backend.entity.*;
//import lk.ijse.backend.repository.*;
//import lk.ijse.backend.service.ChatService;
//import lombok.RequiredArgsConstructor;
//import org.modelmapper.ModelMapper;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.time.LocalDateTime;
//import java.util.List;
//import java.util.stream.Collectors;
//
//@Service
//@Transactional
//@RequiredArgsConstructor
//public class ChatServiceImpl implements ChatService {
//    private final ChatRepository chatRepository;
//    private final UserRepository userRepository;
//    private final MessageRepository messageRepository;
//    private final ChatParticipantRepository participantRepository;
//    private final ModelMapper modelMapper;
//
//    @Override
//    public List<ChatDTO> getChats(String userEmail) {
//        User user = userRepository.findByEmail(userEmail);
//        List<Chat> chats = chatRepository.findChatsByParticipant(user.getUserId());
//
//        return chats.stream()
//                .map(chat -> {
//                    ChatDTO dto = modelMapper.map(chat, ChatDTO.class);
////                    // Get last message
////                    Message lastMessage = messageRepository.findFirstByChatOrderBySentAtDesc(chat);
////                    if (lastMessage != null) {
////                        dto.set(modelMapper.map(lastMessage, MessageDTO.class));
////                    }
////                    // Get unread count
////                    int unreadCount = messageRepository.countUnreadMessages(chat.getChatId(), user.getUserId());
////                    dto.setUnreadCount(unreadCount);
//                    return dto;
//                })
//                .collect(Collectors.toList());
//    }
//
//    @Override
//    public ChatDTO createPrivateChat(String userEmail, int targetUserId) {
//        User user1 = userRepository.findByEmail(userEmail);
//        User user2 = userRepository.findByUserId(targetUserId);
//
//        if (user1 == null || user2 == null) {
//            throw new RuntimeException("User not found");
//        }
//
//        // Check if chat already exists
//        Chat existingChat = chatRepository.findPrivateChatBetweenUsers(user1.getUserId(), user2.getUserId());
//        if (existingChat != null) {
//            return modelMapper.map(existingChat, ChatDTO.class);
//        }
//
//        // Create new chat
//        Chat chat = Chat.builder()
//                .type(Chat.ChatType.PRIVATE)
//                .createdBy(user1)
//                .createdAt(LocalDateTime.now())
//                .build();
//        chat = chatRepository.save(chat);
//
//        // Add participants
//        addParticipant(chat, user1);
//        addParticipant(chat, user2);
//
//        return modelMapper.map(chat, ChatDTO.class);
//    }
//
//    @Override
//    public ChatDTO createGroupChat(String userEmail, CreateGroupChatRequest request) {
//        User creator = userRepository.findByEmail(userEmail);
//
//        Chat chat = Chat.builder()
//                .type(Chat.ChatType.GROUP)
//                .groupName(request.getGroupName())
//                .groupImageUrl(request.getGroupImageUrl())
//                .createdBy(creator)
//                .createdAt(LocalDateTime.now())
//                .build();
//        chat = chatRepository.save(chat);
//
//        // Add creator as participant
//        addParticipant(chat, creator);
//
//        // Add other participants
//        for (Integer userId : request.getParticipantIds()) {
//            User participant = userRepository.findByUserId(userId);
//            if (participant == null) {
//                throw new RuntimeException("User not found");
//            }
//
//            addParticipant(chat, participant);
//        }
//
//        return modelMapper.map(chat, ChatDTO.class);
//    }
//
//    private void addParticipant(Chat chat, User user) {
//        ChatParticipant participant = new ChatParticipant();
//        ChatParticipant.ChatParticipantId id = new ChatParticipant.ChatParticipantId(chat.getChatId(), user.getUserId());
//        participant.setId(id);
//        participant.setChat(chat);
//        participant.setUser(user);
//        participant.setJoinedAt(LocalDateTime.now());
//        participantRepository.save(participant);
//    }
//
//    @Override
//    public MessageDTO sendMessage(String userEmail, int chatId, MessageRequest request) {
//        User sender = userRepository.findByEmail(userEmail);
//        Chat chat = chatRepository.findById(chatId)
//                .orElseThrow(() -> new RuntimeException("Chat not found"));
//
//        // Verify sender is participant
//        if (!participantRepository.existsByIdChatIdAndIdUserId(chatId, sender.getUserId())) {
//            throw new RuntimeException("User is not a participant in this chat");
//        }
//
//        Message message = Message.builder()
//                .chat(chat)
//                .sender(sender)
//                .content(request.getContent())
//                .mediaType(request.getMediaType() != null ? Message.MediaType.valueOf(request.getMediaType()) : null)
//                .mediaUrl(request.getMediaUrl())
//                .sentAt(LocalDateTime.now())
//                .build();
//
//        message = messageRepository.save(message);
//        return modelMapper.map(message, MessageDTO.class);
//    }
//
//    @Override
//    public List<MessageDTO> getMessages(String userEmail, int chatId) {
//        User user = userRepository.findByEmail(userEmail);
//        Chat chat = chatRepository.findById(chatId)
//                .orElseThrow(() -> new RuntimeException("Chat not found"));
//
//        // Verify user is participant
//        if (!participantRepository.existsByIdChatIdAndIdUserId(chatId, user.getUserId())) {
//            throw new RuntimeException("User is not a participant in this chat");
//        }
//
//        List<Message> messages = messageRepository.findByChatOrderBySentAtDesc(chat);
//        return messages.stream()
//                .map(message -> modelMapper.map(message, MessageDTO.class))
//                .collect(Collectors.toList());
//    }
//
//    @Override
//    public void markMessagesAsRead(String userEmail, int chatId) {
//        User user = userRepository.findByEmail(userEmail);
//        messageRepository.markMessagesAsRead(chatId, user.getUserId(), LocalDateTime.now());
//    }
//}