package lk.ijse.backend.service.impl;

import jakarta.transaction.Transactional;
import lk.ijse.backend.dto.MessageDTO;
import lk.ijse.backend.entity.Chat;
import lk.ijse.backend.entity.Message;
import lk.ijse.backend.entity.User;
import lk.ijse.backend.repository.ChatRepository;
import lk.ijse.backend.repository.MessageRepository;
import lk.ijse.backend.repository.UserRepository;
import lk.ijse.backend.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {
    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
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
}
