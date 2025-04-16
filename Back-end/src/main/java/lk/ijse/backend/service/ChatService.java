package lk.ijse.backend.service;

import lk.ijse.backend.dto.ChatDTO;
import lk.ijse.backend.dto.GroupCreateDTO;
import lk.ijse.backend.dto.MessageDTO;

import java.util.List;

public interface ChatService {
    List<ChatDTO> getUserChats(int userId);
    ChatDTO getChat(int chatId, int userId);
    ChatDTO createPrivateChat(int user1Id, int user2Id);
    ChatDTO createGroupChat(GroupCreateDTO createGroupChatDTO, int creatorId);
    void addParticipant(int chatId, int userId);
    void removeParticipant(int chatId, int userId);
    MessageDTO sendMessage(MessageDTO messageDTO);
    List<MessageDTO> getChatMessages(int chatId, int userId);
    void markMessagesAsRead(int chatId, int userId);
    void deleteMessage(int messageId, int userId);
}