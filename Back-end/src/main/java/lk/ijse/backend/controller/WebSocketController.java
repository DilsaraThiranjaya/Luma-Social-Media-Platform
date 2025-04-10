//package lk.ijse.backend.controller;
//
//import lk.ijse.backend.dto.MessageDTO;
//import lk.ijse.backend.dto.MessageRequest;
//import lk.ijse.backend.dto.WebSocketMessageDTO;
//import lk.ijse.backend.service.ChatService;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.messaging.handler.annotation.MessageMapping;
//import org.springframework.messaging.handler.annotation.Payload;
//import org.springframework.messaging.simp.SimpMessagingTemplate;
//import org.springframework.stereotype.Controller;
//import org.springframework.web.bind.annotation.CrossOrigin;
//
//@Controller
//@RequiredArgsConstructor
//@Slf4j
//@CrossOrigin("*")
//public class WebSocketController {
//    private final SimpMessagingTemplate messagingTemplate;
//    private final ChatService chatService;
//
//    @MessageMapping("/message")
//    public void processMessage(@Payload WebSocketMessageDTO message) {
//        // Handle different types of messages
//        switch (message.getType()) {
//            case "CHAT":
//                handleChatMessage(message);
//                break;
//            case "TYPING":
//                handleTypingIndicator(message);
//                break;
//            case "CALL_REQUEST":
//                handleCallRequest(message);
//                break;
//            case "CALL_RESPONSE":
//                handleCallResponse(message);
//                break;
//        }
//    }
//
//    private void handleChatMessage(WebSocketMessageDTO message) {
//        // Save message to database and broadcast to recipients
//        MessageDTO savedMessage = chatService.sendMessage(
//                message.getSender(),
//                message.getChatId(),
//                (MessageRequest) message.getPayload()
//        );
//
//        // Broadcast to chat participants
//        messagingTemplate.convertAndSend(
//                "/topic/chat/" + message.getChatId(),
//                savedMessage
//        );
//    }
//
//    private void handleTypingIndicator(WebSocketMessageDTO message) {
//        // Broadcast typing indicator to chat participants
//        messagingTemplate.convertAndSend(
//                "/topic/chat/" + message.getChatId() + "/typing",
//                message
//        );
//    }
//
//    private void handleCallRequest(WebSocketMessageDTO message) {
//        // Forward call request to recipient
//        messagingTemplate.convertAndSendToUser(
//                message.getReceiver(),
//                "/queue/calls",
//                message
//        );
//    }
//
//    private void handleCallResponse(WebSocketMessageDTO message) {
//        // Forward call response to caller
//        messagingTemplate.convertAndSendToUser(
//                message.getReceiver(),
//                "/queue/calls",
//                message
//        );
//    }
//}