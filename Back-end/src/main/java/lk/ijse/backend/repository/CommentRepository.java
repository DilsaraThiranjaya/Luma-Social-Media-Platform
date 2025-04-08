package lk.ijse.backend.repository;

import lk.ijse.backend.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface CommentRepository extends JpaRepository<Comment, Integer> {
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.createdAt < :date")
    long countCreatedBefore(@Param("date") LocalDateTime date);

}
