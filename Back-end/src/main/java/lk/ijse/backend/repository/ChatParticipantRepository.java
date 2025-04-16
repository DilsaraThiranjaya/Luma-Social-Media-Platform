package lk.ijse.backend.repository;

import lk.ijse.backend.entity.Chat;
import lk.ijse.backend.entity.ChatParticipant;
import lk.ijse.backend.entity.Embeded.ChatParticipantId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, ChatParticipantId> {
    boolean existsByIdChatIdAndIdUserId(int chatId, int userId);

    List<ChatParticipant> findByChatChatId(Integer chatId);

    Collection<ChatParticipant> findByChat(Chat chat);
}