package lk.ijse.backend.repository;

import lk.ijse.backend.entity.Post;
import lk.ijse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Integer> {
    @Query("SELECT p FROM Post p WHERE p.user = :user OR p.user IN " +
            "(SELECT f.user2 FROM Friendship f WHERE f.user1 = :user AND f.status = 'ACCEPTED') " +
            "ORDER BY p.createdAt DESC")
    List<Post> findTimelinePostsByUser(@Param("user") User user);
}