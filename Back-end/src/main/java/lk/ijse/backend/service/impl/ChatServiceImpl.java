package lk.ijse.backend.service.impl;

import lk.ijse.backend.dto.*;
import lk.ijse.backend.entity.*;
import lk.ijse.backend.entity.Embeded.ChatParticipantId;
import lk.ijse.backend.repository.*;
import lk.ijse.backend.service.ChatService;
import lk.ijse.backend.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ChatParticipantRepository participantRepository;
    private final CloudinaryService cloudinaryService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ModelMapper modelMapper;

    @Transactional
    @Override
    public MessageDTO sendMessage(MessageDTO messageDTO) {
        Chat chat = chatRepository.findById(messageDTO.getChatId())
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        User sender = userRepository.findByUserId(messageDTO.getSender().getUserId());
        if (sender == null) throw new UsernameNotFoundException("User not found");

        Message message = new Message();
        message.setContent(messageDTO.getContent());
        message.setMediaType(messageDTO.getMediaType());
        message.setMediaUrl(messageDTO.getMediaUrl());
        message.setChat(chat);
        message.setSender(sender);
        message.setSentAt(LocalDateTime.now());

        Message savedMessage = messageRepository.save(message);
        MessageDTO result = modelMapper.map(savedMessage, MessageDTO.class);

        // Send via WebSocket
        messagingTemplate.convertAndSend("/topic/chat/" + chat.getChatId(), result);
        return result;
    }

    @Override
    public List<MessageDTO> getChatHistory(Integer chatId) {
        return messageRepository.findByChatChatIdOrderBySentAtAsc(chatId).stream()
                .map(m -> modelMapper.map(m, MessageDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public ChatDTO createPrivateChat(int user1Id, int user2Id) {
        Chat existingChat = chatRepository.findPrivateChatBetweenUsers(user1Id, user2Id);
        if(existingChat != null) return convertToDto(existingChat);

        Chat chat = new Chat();
        chat.setType(Chat.ChatType.PRIVATE);

        User user = userRepository.findByUserId(user1Id);
        if(user == null) throw new UsernameNotFoundException("User not found");

        chat.setCreatedBy(user);
        chat.setCreatedAt(LocalDateTime.now());

        Chat savedChat = chatRepository.save(chat);

        addParticipant(savedChat, user1Id);
        addParticipant(savedChat, user2Id);

        return convertToDto(savedChat);
    }

    @Override
    public ChatDTO createGroupChat(GroupCreateDTO groupDTO, int creatorId) throws IOException {
        Chat chat = new Chat();
        chat.setType(Chat.ChatType.GROUP);
        chat.setGroupName(groupDTO.getGroupName());

        User user = userRepository.findByUserId(creatorId);
        if(user == null) throw new UsernameNotFoundException("User not found");

        chat.setCreatedBy(user);

        if(groupDTO.getGroupImage() != null) {
            String imageUrl = cloudinaryService.uploadChatMedia(groupDTO.getGroupImage(), "IMAGE", creatorId);
            chat.setGroupImageUrl(imageUrl);
        }

        Chat savedChat = chatRepository.save(chat);

        groupDTO.getParticipantIds().forEach(userId -> addParticipant(savedChat, userId));
        addParticipant(savedChat, creatorId); // Add creator as participant

        return convertToDto(savedChat);
    }

    @Override
    public List<ChatDTO> getUserChats(int userId) {
        return chatRepository.findByUserId(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private void addParticipant(Chat chat, int userId) {
        ChatParticipant participant = new ChatParticipant();
        participant.setId(new ChatParticipantId(chat.getChatId(), userId));
        participant.setChat(chat);

        User user = userRepository.findByUserId(userId);
        if(user == null) throw new UsernameNotFoundException("User not found");

        participant.setUser(user);
        participantRepository.save(participant);
    }

    private ChatDTO convertToDto(Chat chat) {
        ChatDTO dto = modelMapper.map(chat, ChatDTO.class);
        dto.setParticipants(participantRepository.findByChatChatId(chat.getChatId()).stream()
                .map(p -> modelMapper.map(p.getUser(), UserDTO.class))
                .collect(Collectors.toList()));
        dto.setLastMessage(modelMapper.map(messageRepository.findLastMessageByChatId(chat.getChatId()), MessageDTO.class));
        return dto;
    }
}