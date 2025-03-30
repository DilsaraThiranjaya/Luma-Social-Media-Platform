package lk.ijse.backend.repository;

import lk.ijse.backend.entity.Post;
import lk.ijse.backend.entity.Reaction;
import lk.ijse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReactionRepository extends JpaRepository<Reaction, Integer> {
    Reaction findByUserAndPost(User user, Post post);

    @Modifying
    @Query("DELETE FROM Reaction r WHERE r.user = :user AND r.post = :post")
    void deleteByUserAndPost(@Param("user") User user, @Param("post") Post post);
}