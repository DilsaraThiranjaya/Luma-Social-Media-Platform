package lk.ijse.backend.repository;

import lk.ijse.backend.entity.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Integer> {
    @Query("SELECT DISTINCT c FROM Chat c " +
            "JOIN c.participants p " +
            "WHERE p.user.userId = :userId " +
            "ORDER BY c.createdAt DESC")
    List<Chat> findChatsByParticipant(int userId);

    @Query("SELECT c FROM Chat c " +
            "JOIN c.participants p1 " +
            "JOIN c.participants p2 " +
            "WHERE c.type = 'PRIVATE' " +
            "AND ((p1.user.userId = :user1Id AND p2.user.userId = :user2Id) " +
            "OR (p1.user.userId = :user2Id AND p2.user.userId = :user1Id))")
    Chat findPrivateChatBetweenUsers(int user1Id, int user2Id);

    @Query("SELECT c FROM Chat c JOIN c.participants p WHERE p.user.userId = :userId")
    Collection<Chat> findByUserId(@Param("userId") int userId);
}