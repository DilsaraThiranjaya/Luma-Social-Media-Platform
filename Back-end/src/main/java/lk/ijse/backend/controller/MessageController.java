package lk.ijse.backend.controller;

import lk.ijse.backend.dto.MessageDTO;
import lk.ijse.backend.dto.UserDTO;
import lk.ijse.backend.entity.Message;
import lk.ijse.backend.service.CloudinaryService;
import lk.ijse.backend.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("api/v1/messages")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService messageService;
    private final CloudinaryService cloudinaryService;

    @GetMapping("/{chatId}")
    public ResponseEntity<List<MessageDTO>> getChatMessages(@PathVariable Integer chatId) {
        log.info("Getting messages for chat: {}", chatId);
        return ResponseEntity.ok(messageService.getChatHistory(chatId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
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
        return ResponseEntity.ok(messageService.sendMessage(messageDTO));
    }
}