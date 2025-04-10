//package lk.ijse.backend.controller;
//
//import lk.ijse.backend.dto.*;
//import lk.ijse.backend.service.ChatService;
//import lk.ijse.backend.util.VarList;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.http.MediaType;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.access.prepost.PreAuthorize;
//import org.springframework.security.core.Authentication;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.List;
//
//@RestController
//@RequestMapping("api/v1/chats")
//@RequiredArgsConstructor
//@Slf4j
//@CrossOrigin("*")
//public class ChatController {
//    private final ChatService chatService;
//
//    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
//    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> getChats(Authentication authentication) {
//        try {
//            String userEmail = authentication.getName();
//            List<ChatDTO> chats = chatService.getChats(userEmail);
//            return ResponseEntity.ok()
//                    .body(new ResponseDTO(VarList.OK, "Chats Retrieved Successfully!", chats));
//        } catch (Exception e) {
//            return ResponseEntity.internalServerError()
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
//        }
//    }
//
//    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
//    @PostMapping(value = "/private", produces = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> createPrivateChat(
//            @RequestParam int targetUserId,
//            Authentication authentication
//    ) {
//        try {
//            String userEmail = authentication.getName();
//            ChatDTO chat = chatService.createPrivateChat(userEmail, targetUserId);
//            return ResponseEntity.ok()
//                    .body(new ResponseDTO(VarList.OK, "Private Chat Created Successfully!", chat));
//        } catch (Exception e) {
//            return ResponseEntity.internalServerError()
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
//        }
//    }
//
//    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
//    @PostMapping(value = "/group", produces = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> createGroupChat(
//            @RequestBody CreateGroupChatRequest request,
//            Authentication authentication
//    ) {
//        try {
//            String userEmail = authentication.getName();
//            ChatDTO chat = chatService.createGroupChat(userEmail, request);
//            return ResponseEntity.ok()
//                    .body(new ResponseDTO(VarList.OK, "Group Chat Created Successfully!", chat));
//        } catch (Exception e) {
//            return ResponseEntity.internalServerError()
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
//        }
//    }
//
//    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
//    @PostMapping(value = "/{chatId}/messages", produces = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> sendMessage(
//            @PathVariable int chatId,
//            @RequestBody MessageRequest request,
//            Authentication authentication
//    ) {
//        try {
//            String userEmail = authentication.getName();
//            MessageDTO message = chatService.sendMessage(userEmail, chatId, request);
//            return ResponseEntity.ok()
//                    .body(new ResponseDTO(VarList.OK, "Message Sent Successfully!", message));
//        } catch (Exception e) {
//            return ResponseEntity.internalServerError()
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
//        }
//    }
//
//    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
//    @GetMapping(value = "/{chatId}/messages", produces = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> getMessages(
//            @PathVariable int chatId,
//            Authentication authentication
//    ) {
//        try {
//            String userEmail = authentication.getName();
//            List<MessageDTO> messages = chatService.getMessages(userEmail, chatId);
//            return ResponseEntity.ok()
//                    .body(new ResponseDTO(VarList.OK, "Messages Retrieved Successfully!", messages));
//        } catch (Exception e) {
//            return ResponseEntity.internalServerError()
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
//        }
//    }
//
//    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
//    @PutMapping(value = "/{chatId}/messages/read", produces = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> markMessagesAsRead(
//            @PathVariable int chatId,
//            Authentication authentication
//    ) {
//        try {
//            String userEmail = authentication.getName();
//            chatService.markMessagesAsRead(userEmail, chatId);
//            return ResponseEntity.ok()
//                    .body(new ResponseDTO(VarList.OK, "Messages Marked as Read!", null));
//        } catch (Exception e) {
//            return ResponseEntity.internalServerError()
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
//        }
//    }
//}