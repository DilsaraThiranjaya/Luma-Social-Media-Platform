package lk.ijse.backend.repository;

import lk.ijse.backend.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Integer> {
    @Query("SELECT p FROM Post p WHERE "
            + "p.status = 'ACTIVE' AND ("
            + "  p.user.userId = :userId"
            + ") "
            + "ORDER BY p.createdAt DESC")
    Page<Post> findUsersVisiblePostsByUserId(@Param("userId") int userId, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE "
            + "p.status = 'ACTIVE' AND ("
            + "  (p.privacy = 'PUBLIC') OR "
            + "  (p.privacy = 'FRIENDS' AND EXISTS ("
            + "    SELECT f FROM Friendship f WHERE "
            + "    ((f.id.user1Id = p.user.userId OR f.id.user2Id = p.user.userId) AND "
            + "     (f.id.user1Id = :userId OR f.id.user2Id = :userId)) AND "
            + "    f.status = 'ACCEPTED')) OR "
            + "  p.user.userId = :userId"
            + ") "
            + "ORDER BY p.createdAt DESC")
    Page<Post> findAllVisiblePostsByUserId(@Param("userId") int userId, Pageable pageable);
}