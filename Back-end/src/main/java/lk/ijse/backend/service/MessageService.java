package lk.ijse.backend.service;

import jakarta.transaction.Transactional;
import lk.ijse.backend.dto.MessageDTO;

import java.util.List;

public interface MessageService {
    @Transactional
    MessageDTO sendMessage(MessageDTO messageDTO);

    List<MessageDTO> getChatHistory(Integer chatId);
}
