package lk.ijse.backend.repository;

import lk.ijse.backend.entity.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, ChatParticipant.ChatParticipantId> {
    boolean existsByIdChatIdAndIdUserId(int chatId, int userId);
}