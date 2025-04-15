package lk.ijse.backend.service;


import jakarta.transaction.Transactional;
import lk.ijse.backend.dto.ChatDTO;
import lk.ijse.backend.dto.GroupCreateDTO;
import lk.ijse.backend.dto.MessageDTO;

import java.io.IOException;
import java.util.List;

public interface ChatService {
    ChatDTO createPrivateChat(String email, int userId);

    ChatDTO createGroupChat(GroupCreateDTO groupDTO, int creatorId) throws IOException;

    List<ChatDTO> getUserChats(String userId);

    @Transactional
    MessageDTO sendMessage(MessageDTO messageDTO);

    List<MessageDTO> getChatHistory(Integer chatId);

}