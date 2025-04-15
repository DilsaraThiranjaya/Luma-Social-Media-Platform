package lk.ijse.backend.controller;

import lk.ijse.backend.dto.*;
import lk.ijse.backend.entity.Message;
import lk.ijse.backend.service.ChatService;
import lk.ijse.backend.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("api/v1/chats")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin("*")
public class ChatController {
    private final ChatService chatService;
    private final CloudinaryService cloudinaryService;

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<List<MessageDTO>> getChatMessages(@PathVariable Integer chatId) {
        log.info("Getting messages for chat: {}", chatId);
        return ResponseEntity.ok(chatService.getChatHistory(chatId));
    }

    @PostMapping(value = "/message", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MessageDTO> sendMessage(
            @RequestParam("file") MultipartFile file,
            @RequestParam String content,
            @RequestParam Integer chatId,
            @RequestParam Integer senderId) {
        log.info("Sending message: {}", content);

        MessageDTO messageDTO = new MessageDTO();
        messageDTO.setContent(content);
        messageDTO.setChatId(chatId);

        UserDTO userDTO = new UserDTO();
        userDTO.setUserId(senderId);

        messageDTO.setSender(userDTO);

        if(file != null && !file.isEmpty()) {
            String fileUrl = null;
            try {
                fileUrl = cloudinaryService.uploadChatMedia(file, "IMAGE", senderId);
            } catch (IOException e) {
                return ResponseEntity.badRequest().build();
            }
            messageDTO.setMediaUrl(fileUrl);
            messageDTO.setMediaType(Message.MediaType.IMAGE);
        }
        return ResponseEntity.ok(chatService.sendMessage(messageDTO));
    }

    @PostMapping("/private")
    public ResponseEntity<ChatDTO> createPrivateChat(@RequestParam Integer userId, Authentication authentication) {
        String email = authentication.getName();
        log.info("Creating private chat between {} and {}", userId, email);
        return ResponseEntity.ok(chatService.createPrivateChat(email, userId));
    }

    @PostMapping(value = "/group", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ChatDTO> createGroupChat(@ModelAttribute GroupCreateDTO groupDTO,
                                                   @RequestParam Integer creatorId) {
        log.info("Creating group chat: {}", groupDTO);
        try {
            return ResponseEntity.ok(chatService.createGroupChat(groupDTO, creatorId));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/chats")
    public ResponseEntity<List<ChatDTO>> getUserChats(Authentication authentication) {
        String email = authentication.getName();

        log.info("Getting chats for user: {}", email);
        return ResponseEntity.ok(chatService.getUserChats(email));
    }
}