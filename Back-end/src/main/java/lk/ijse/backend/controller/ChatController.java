package lk.ijse.backend.controller;

import lk.ijse.backend.dto.*;
import lk.ijse.backend.service.ChatService;
import lk.ijse.backend.service.MessageService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("api/v1/chats")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin("*")
public class ChatController {
    private final ChatService chatService;
    private final MessageService messageService;

    @PostMapping("/private")
    public ResponseEntity<ChatDTO> createPrivateChat(@RequestParam Integer user1Id,
                                                     @RequestParam Integer user2Id) {
        log.info("Creating private chat between {} and {}", user1Id, user2Id);
        return ResponseEntity.ok(chatService.createPrivateChat(user1Id, user2Id));
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

    @GetMapping("/{userId}/chats")
    public ResponseEntity<List<ChatDTO>> getUserChats(@PathVariable Integer userId) {
        log.info("Getting chats for user: {}", userId);
        return ResponseEntity.ok(chatService.getUserChats(userId));
    }
}