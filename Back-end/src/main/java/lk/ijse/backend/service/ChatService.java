//package lk.ijse.backend.service;
//
//import lk.ijse.backend.dto.ChatDTO;
//import lk.ijse.backend.dto.CreateGroupChatRequest;
//import lk.ijse.backend.dto.MessageDTO;
//import lk.ijse.backend.dto.MessageRequest;
//
//import java.util.List;
//
//public interface ChatService {
//    List<ChatDTO> getChats(String userEmail);
//    ChatDTO createPrivateChat(String userEmail, int targetUserId);
//    ChatDTO createGroupChat(String userEmail, CreateGroupChatRequest request);
//    MessageDTO sendMessage(String userEmail, int chatId, MessageRequest request);
//    List<MessageDTO> getMessages(String userEmail, int chatId);
//    void markMessagesAsRead(String userEmail, int chatId);
//}