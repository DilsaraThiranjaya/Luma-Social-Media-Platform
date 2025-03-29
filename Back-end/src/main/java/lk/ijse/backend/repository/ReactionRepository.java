package lk.ijse.backend.repository;

import lk.ijse.backend.entity.Post;
import lk.ijse.backend.entity.Reaction;
import lk.ijse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReactionRepository extends JpaRepository<Reaction, Integer> {
    Reaction findByUserAndPost(User user, Post post);
}