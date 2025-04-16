package lk.ijse.backend.controller;

import lk.ijse.backend.dto.ChatDTO;
import lk.ijse.backend.dto.GroupCreateDTO;
import lk.ijse.backend.dto.MessageDTO;
import lk.ijse.backend.dto.ResponseDTO;
import lk.ijse.backend.service.ChatService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/chats")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class ChatController {
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public ResponseEntity<ResponseDTO> getUserChats(Authentication authentication) {
        log.info("Getting chats for user: {}", authentication.getName());
        try {
            int userId = Integer.parseInt(authentication.getName());
            List<ChatDTO> chats = chatService.getUserChats(userId);

            log.info("Chats retrieved successfully for user: {}", authentication.getName());
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Chats retrieved successfully", chats));
        } catch (Exception e) {
            log.error("Error retrieving user chats: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @GetMapping("/{chatId}")
    public ResponseEntity<ResponseDTO> getChat(@PathVariable int chatId, Authentication authentication) {
        log.info("Getting chat with ID: {}", chatId);
        try {
            int userId = Integer.parseInt(authentication.getName());
            ChatDTO chat = chatService.getChat(chatId, userId);

            log.info("Chat retrieved successfully with ID: {}", chatId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Chat retrieved successfully", chat));
        } catch (Exception e) {

            log.error("Error retrieving chat with ID: {}", chatId);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PostMapping("/private/{userId}")
    public ResponseEntity<ResponseDTO> createPrivateChat(@PathVariable int userId, Authentication authentication) {
        log.info("Creating private chat between user {} and user {}", authentication.getName(), userId);
        try {
            int currentUserId = Integer.parseInt(authentication.getName());
            ChatDTO chat = chatService.createPrivateChat(currentUserId, userId);

            log.info("Private chat created successfully between user {} and user {}", currentUserId, userId);
            return ResponseEntity.ok(new ResponseDTO(VarList.Created, "Private chat created successfully", chat));
        } catch (Exception e) {
            log.error("Error creating private chat: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PostMapping("/group")
    public ResponseEntity<ResponseDTO> createGroupChat(@RequestBody GroupCreateDTO createGroupChatDTO,
                                                       Authentication authentication) {
        log.info("Creating group chat: {}", createGroupChatDTO);
        try {
            int creatorId = Integer.parseInt(authentication.getName());
            ChatDTO chat = chatService.createGroupChat(createGroupChatDTO, creatorId);

            log.info("Group chat created successfully: {}", chat);
            return ResponseEntity.ok(new ResponseDTO(VarList.Created, "Group chat created successfully", chat));
        } catch (Exception e) {
            log.error("Error creating group chat: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PostMapping("/{chatId}/participants/{userId}")
    public ResponseEntity<ResponseDTO> addParticipant(@PathVariable int chatId, @PathVariable int userId) {
        log.info("Adding participant {} to chat {}", userId, chatId);
        try {
            chatService.addParticipant(chatId, userId);

            log.info("Participant added successfully to chat {}", chatId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Participant added successfully", null));
        } catch (Exception e) {
            log.error("Error adding participant: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @DeleteMapping("/{chatId}/participants/{userId}")
    public ResponseEntity<ResponseDTO> removeParticipant(@PathVariable int chatId, @PathVariable int userId) {
        log.info("Removing participant {} from chat {}", userId, chatId);
        try {
            chatService.removeParticipant(chatId, userId);

            log.info("Participant removed successfully from chat {}", chatId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Participant removed successfully", null));
        } catch (Exception e) {
            log.error("Error removing participant: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload MessageDTO message) {
        log.info("Received message: {}", message);
        MessageDTO savedMessage = chatService.sendMessage(message);
        messagingTemplate.convertAndSend("/topic/chat." + message.getChatId(), savedMessage);
    }

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<ResponseDTO> getChatMessages(@PathVariable int chatId, Authentication authentication) {
        log.info("Getting messages for chat {}", chatId);
        try {
            int userId = Integer.parseInt(authentication.getName());
            List<MessageDTO> messages = chatService.getChatMessages(chatId, userId);

            log.info("Messages retrieved successfully for chat {}", chatId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Messages retrieved successfully", messages));
        } catch (Exception e) {
            log.error("Error retrieving messages: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PostMapping("/{chatId}/messages/read")
    public ResponseEntity<ResponseDTO> markMessagesAsRead(@PathVariable int chatId, Authentication authentication) {
        log.info("Marking messages as read for chat {}", chatId);
        try {
            int userId = Integer.parseInt(authentication.getName());
            chatService.markMessagesAsRead(chatId, userId);

            log.info("Messages marked as read for chat {}", chatId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Messages marked as read", null));
        } catch (Exception e) {
            log.error("Error marking messages as read: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ResponseDTO> deleteMessage(@PathVariable int messageId, Authentication authentication) {
        log.info("Deleting message with ID: {}", messageId);
        try {
            int userId = Integer.parseInt(authentication.getName());
            chatService.deleteMessage(messageId, userId);

            log.info("Message deleted successfully with ID: {}", messageId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Message deleted successfully", null));
        } catch (Exception e) {
            log.error("Error deleting message: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }
}