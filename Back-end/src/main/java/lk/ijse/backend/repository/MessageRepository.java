//package lk.ijse.backend.repository;
//
//import lk.ijse.backend.entity.Chat;
//import lk.ijse.backend.entity.Message;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.jpa.repository.Modifying;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.stereotype.Repository;
//
//import java.time.LocalDateTime;
//import java.util.List;
//
//@Repository
//public interface MessageRepository extends JpaRepository<Message, Integer> {
//    List<Message> findByChatOrderBySentAtDesc(Chat chat);
//    Message findFirstByChatOrderBySentAtDesc(Chat chat);
//
//    @Query("SELECT COUNT(m) FROM Message m " +
//            "WHERE m.chat.chatId = :chatId " +
//            "AND m.sender.userId != :userId " +
//            "AND m.readAt IS NULL")
//    int countUnreadMessages(int chatId, int userId);
//
//    @Modifying
//    @Query("UPDATE Message m SET m.readAt = :now " +
//            "WHERE m.chat.chatId = :chatId " +
//            "AND m.sender.userId != :userId " +
//            "AND m.readAt IS NULL")
//    void markMessagesAsRead(int chatId, int userId, LocalDateTime now);
//}