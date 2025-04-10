package lk.ijse.backend.repository;

import lk.ijse.backend.entity.Post;
import lk.ijse.backend.entity.PostMedia;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Integer> {
    @Query("SELECT p FROM Post p WHERE "
            + "p.status = 'ACTIVE' AND ("
            + "  p.user.userId = :userId"
            + ") "
            + "ORDER BY p.createdAt DESC")
    Page<Post> findUsersVisiblePostsByUserId(@Param("userId") int userId, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE "
            + "p.user.userId = :profileOwnerId AND "
            + "p.status = 'ACTIVE' AND ("
            + "  (p.privacy = 'PUBLIC' AND NOT EXISTS ("
            + "    SELECT b FROM Friendship b WHERE "
            + "    ((b.id.user1Id = p.user.userId AND b.id.user2Id = :userId) OR "
            + "     (b.id.user2Id = p.user.userId AND b.id.user1Id = :userId)) AND "
            + "    b.status = 'BLOCKED')) OR "
            + "  (p.privacy = 'FRIENDS' AND EXISTS ("
            + "    SELECT f FROM Friendship f WHERE "
            + "    ((f.id.user1Id = p.user.userId AND f.id.user2Id = :userId) OR "
            + "     (f.id.user2Id = p.user.userId AND f.id.user1Id = :userId)) AND "
            + "    f.status = 'ACCEPTED') AND NOT EXISTS ("
            + "    SELECT b FROM Friendship b WHERE "
            + "    ((b.id.user1Id = p.user.userId AND b.id.user2Id = :userId) OR "
            + "     (b.id.user2Id = p.user.userId AND b.id.user1Id = :userId)) AND "
            + "    b.status = 'BLOCKED'))"
            + ") "
            + "ORDER BY p.createdAt DESC")
    Page<Post> findOtherUsersVisiblePostsByUserId(@Param("profileOwnerId") int profileOwnerId, @Param("userId") int currentUserId, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE "
            + "p.status = 'ACTIVE' AND p.user.status = 'ACTIVE' AND p.user.isProfilePublic = true AND ("
            + "  (p.privacy = 'PUBLIC' AND NOT EXISTS (SELECT f FROM Friendship f WHERE " +
            "    ((f.id.user1Id = p.user.userId AND f.id.user2Id = :userId) OR " +
            "     (f.id.user2Id = p.user.userId AND f.id.user1Id = :userId)) AND " +
            "    f.status = 'BLOCKED')) OR "
            + "  (p.privacy = 'FRIENDS' AND EXISTS ("
            + "    SELECT f FROM Friendship f WHERE "
            + "    ((f.id.user1Id = p.user.userId AND f.id.user2Id = :userId) OR "
            + "     (f.id.user2Id = p.user.userId AND f.id.user1Id = :userId)) AND "
            + "    f.status = 'ACCEPTED') AND NOT EXISTS (SELECT f FROM Friendship f WHERE " +
            "    ((f.id.user1Id = p.user.userId AND f.id.user2Id = :userId) OR " +
            "     (f.id.user2Id = p.user.userId AND f.id.user1Id = :userId)) AND " +
            "    f.status = 'BLOCKED')) OR "
            + "  p.user.userId = :userId"
            + ") "
            + "ORDER BY p.createdAt DESC")
    Page<Post> findAllVisiblePostsByUserId(@Param("userId") int userId, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE " +
            "LOWER(p.content) LIKE LOWER(CONCAT('%', :searchTerm, '%')) AND " +
            "p.status = 'ACTIVE' AND p.user.status = 'ACTIVE' AND " +
            "p.privacy = :privacy AND " +
            "p.user.isProfilePublic = true AND " +
            "(p.user.userId <> :currentUserId OR p.user.userId = :currentUserId) AND " +
            "NOT EXISTS (SELECT f FROM Friendship f WHERE " +
            "    ((f.id.user1Id = p.user.userId AND f.id.user2Id = :currentUserId) OR " +
            "     (f.id.user2Id = p.user.userId AND f.id.user1Id = :currentUserId)) AND " +
            "    f.status = 'BLOCKED') " +
            "ORDER BY p.createdAt DESC")
    Page<Post> findByContentLikeAndPrivacyAndUserIsProfilePublicTrue(
            @Param("searchTerm") String searchTerm,
            @Param("privacy") Post.PrivacyLevel privacy,
            @Param("currentUserId") int currentUserId,
            Pageable pageable);

    @Query("SELECT COUNT(p) FROM Post p WHERE p.createdAt < :date")
    long countCreatedBefore(@Param("date") LocalDateTime date);

    List<Post> findByStatus(Post.Status status);
    List<Post> findByMediaMediaType(PostMedia.MediaType mediaType);
    List<Post> findByContentContaining(String content);

    long countByStatus(Post.Status status);
    long countByMediaMediaType(PostMedia.MediaType mediaType);
    long countByCreatedAtAfter(LocalDateTime date);

    long countByCreatedAtBetween(LocalDateTime sixtyDaysAgo, LocalDateTime thirtyDaysAgo);
}