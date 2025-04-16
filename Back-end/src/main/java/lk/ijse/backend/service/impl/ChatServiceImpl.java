package lk.ijse.backend.service.impl;

import lk.ijse.backend.dto.ChatDTO;
import lk.ijse.backend.dto.GroupCreateDTO;
import lk.ijse.backend.dto.MessageDTO;
import lk.ijse.backend.entity.Chat;
import lk.ijse.backend.entity.ChatParticipant;
import lk.ijse.backend.entity.Embeded.ChatParticipantId;
import lk.ijse.backend.entity.Message;
import lk.ijse.backend.entity.User;
import lk.ijse.backend.repository.ChatParticipantRepository;
import lk.ijse.backend.repository.ChatRepository;
import lk.ijse.backend.repository.MessageRepository;
import lk.ijse.backend.repository.UserRepository;
import lk.ijse.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {
    private final ChatRepository chatRepository;
    private final ChatParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    public List<ChatDTO> getUserChats(int userId) {
        return chatRepository.findChatsByParticipant(userId).stream()
                .map(chat -> {
                    ChatDTO dto = modelMapper.map(chat, ChatDTO.class);
                    Message lastMessage = messageRepository.findLastMessageByChatId(chat.getChatId());
                    if (lastMessage != null) {
                        dto.setLastMessage(modelMapper.map(lastMessage, MessageDTO.class));
                    }
                    dto.setUnreadCount(messageRepository.findUnreadMessages(chat.getChatId(), userId).size());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public ChatDTO getChat(int chatId, int userId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        // Verify user is a participant
        boolean isParticipant = chat.getParticipants().stream()
                .anyMatch(p -> p.getUser().getUserId() == userId);
        if (!isParticipant) {
            throw new RuntimeException("User is not a participant in this chat");
        }

        ChatDTO dto = modelMapper.map(chat, ChatDTO.class);
        dto.setUnreadCount(messageRepository.findUnreadMessages(chatId, userId).size());
        return dto;
    }

    @Override
    public ChatDTO createPrivateChat(int user1Id, int user2Id) {
        // Check if chat already exists
        Chat existingChat = chatRepository.findPrivateChatBetweenUsers(user1Id, user2Id);
        if (existingChat != null) {
            return modelMapper.map(existingChat, ChatDTO.class);
        }

        User user1 = userRepository.findByUserId(user1Id);
        if (user1 == null) {
            throw new RuntimeException("User 1 not found");
        }
        User user2 = userRepository.findByUserId(user2Id);
        if (user2 == null) {
            throw new RuntimeException("User 2 not found");
        }

        Chat chat = Chat.builder()
                .type(Chat.ChatType.PRIVATE)
                .createdAt(LocalDateTime.now())
                .createdBy(user1)
                .build();

        chat = chatRepository.save(chat);

        // Add participants
        ChatParticipant participant1 = new ChatParticipant();
        participant1.setId(new ChatParticipantId(chat.getChatId(), user1Id));
        participant1.setChat(chat);
        participant1.setUser(user1);
        participant1.setJoinedAt(LocalDateTime.now());

        ChatParticipant participant2 = new ChatParticipant();
        participant2.setId(new ChatParticipantId(chat.getChatId(), user2Id));
        participant2.setChat(chat);
        participant2.setUser(user2);
        participant2.setJoinedAt(LocalDateTime.now());

        participantRepository.saveAll(List.of(participant1, participant2));

        return modelMapper.map(chat, ChatDTO.class);
    }

    @Override
    public ChatDTO createGroupChat(GroupCreateDTO createGroupChatDTO, int creatorId) {
        User creator = userRepository.findByUserId(creatorId);
        if (creator == null) {
            throw new RuntimeException("User not found");
        }

        Chat chat = Chat.builder()
                .type(Chat.ChatType.GROUP)
                .groupName(createGroupChatDTO.getGroupName())
                .groupImageUrl(String.valueOf(createGroupChatDTO.getGroupImage()))
                .createdAt(LocalDateTime.now())
                .createdBy(creator)
                .build();

        chat = chatRepository.save(chat);

        // Add creator as participant
        ChatParticipant creatorParticipant = new ChatParticipant();
        creatorParticipant.setId(new ChatParticipantId(chat.getChatId(), creatorId));
        creatorParticipant.setChat(chat);
        creatorParticipant.setUser(creator);
        creatorParticipant.setJoinedAt(LocalDateTime.now());
        participantRepository.save(creatorParticipant);

        // Add other participants
        for (Integer participantId : createGroupChatDTO.getParticipantIds()) {
            if (participantId != creatorId) {
                User participant = userRepository.findByUserId(participantId);
                if (participant == null) {
                    throw new RuntimeException("User not found");
                }

                ChatParticipant chatParticipant = new ChatParticipant();
                chatParticipant.setId(new ChatParticipantId(chat.getChatId(), participantId));
                chatParticipant.setChat(chat);
                chatParticipant.setUser(participant);
                chatParticipant.setJoinedAt(LocalDateTime.now());
                participantRepository.save(chatParticipant);
            }
        }

        return modelMapper.map(chat, ChatDTO.class);
    }

    @Override
    public void addParticipant(int chatId, int userId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        if (chat.getType() != Chat.ChatType.GROUP) {
            throw new RuntimeException("Cannot add participant to private chat");
        }

        User user = userRepository.findByUserId(userId);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        ChatParticipant participant = new ChatParticipant();
        participant.setId(new ChatParticipantId(chatId, userId));
        participant.setChat(chat);
        participant.setUser(user);
        participant.setJoinedAt(LocalDateTime.now());

        participantRepository.save(participant);
    }

    @Override
    public void removeParticipant(int chatId, int userId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        if (chat.getType() != Chat.ChatType.GROUP) {
            throw new RuntimeException("Cannot remove participant from private chat");
        }

        ChatParticipantId id = new ChatParticipantId(chatId, userId);
        participantRepository.deleteById(id);
    }

    @Override
    public MessageDTO sendMessage(MessageDTO messageDTO) {
        Chat chat = chatRepository.findById(messageDTO.getChatId())
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        User sender = userRepository.findByUserId(messageDTO.getSender().getUserId());
        if (sender == null) {
            throw new RuntimeException("Sender not found");
        }

        Message message = Message.builder()
                .content(messageDTO.getContent())
                .mediaType(messageDTO.getMediaType() != null ? messageDTO.getMediaType() : null)
                .mediaUrl(messageDTO.getMediaUrl())
                .sentAt(LocalDateTime.now())
                .chat(chat)
                .sender(sender)
                .build();

        message = messageRepository.save(message);
        return modelMapper.map(message, MessageDTO.class);
    }

    @Override
    public List<MessageDTO> getChatMessages(int chatId, int userId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        // Verify user is a participant
        boolean isParticipant = participantRepository.findByChat(chat).stream()
                .anyMatch(p -> p.getUser().getUserId() == userId);
        if (!isParticipant) {
            throw new RuntimeException("User is not a participant in this chat");
        }

        return messageRepository.findByChatOrderBySentAtDesc(chat).stream()
                .map(message -> modelMapper.map(message, MessageDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public void markMessagesAsRead(int chatId, int userId) {
        List<Message> unreadMessages = messageRepository.findUnreadMessages(chatId, userId);
        unreadMessages.forEach(message -> message.setReadAt(LocalDateTime.now()));
        messageRepository.saveAll(unreadMessages);
    }

    @Override
    public void deleteMessage(int messageId, int userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (message.getSender().getUserId() != userId) {
            throw new RuntimeException("Cannot delete message: not the sender");
        }

        messageRepository.deleteById(messageId);
    }
}