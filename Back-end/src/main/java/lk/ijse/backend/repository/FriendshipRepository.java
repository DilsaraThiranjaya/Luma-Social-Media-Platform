package lk.ijse.backend.repository;

import lk.ijse.backend.entity.Friendship;
import lk.ijse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Integer> {
    @Query("SELECT f FROM Friendship f WHERE " +
            "(f.id.user1Id = :userId OR f.id.user2Id = :userId) AND " +
            "f.status = 'ACCEPTED' AND " +
            "f.user1.status = 'ACTIVE' AND f.user2.status = 'ACTIVE'")
    List<Friendship> findAllFriendships(@Param("userId") int userId);

    @Query("SELECT f FROM Friendship f WHERE " +
            "f.id.user2Id = :userId AND " +
            "f.status = 'PENDING' AND " +
            "f.user1.status = 'ACTIVE' AND f.user2.status = 'ACTIVE'")
    List<Friendship> findPendingRequests(@Param("userId") int userId);

    @Query("SELECT f FROM Friendship f WHERE " +
            "((f.id.user1Id = :user1Id AND f.id.user2Id = :user2Id) OR " +
            "(f.id.user1Id = :user2Id AND f.id.user2Id = :user1Id)) AND " +
            "f.user1.status = 'ACTIVE' AND f.user2.status = 'ACTIVE'")
    Optional<Friendship> findByUsers(@Param("user1Id") int user1Id, @Param("user2Id") int user2Id);


    @Query("SELECT u FROM User u WHERE " +
            "u.status = 'ACTIVE' AND " +
            "u.userId NOT IN " +
            "(SELECT CASE WHEN f.id.user1Id = :userId THEN f.id.user2Id ELSE f.id.user1Id END " +
            "FROM Friendship f WHERE (f.id.user1Id = :userId OR f.id.user2Id = :userId)) " +
            "AND u.userId != :userId")
    List<User> findSuggestions(@Param("userId") int userId);

    @Query("SELECT f.status FROM Friendship f WHERE f.id.user1Id = :userId AND f.id.user2Id = :userId1")
    Friendship.FriendshipStatus findFriendshipStatusByUsers(@Param("userId") int userId, @Param("userId1") int userId1);
    
//    @Query("SELECT f FROM Friendship f WHERE " +
//            "(f.id.user1Id= :userId OR f.id.user2Id = :userId) AND " +
//            "f.status = 'ACCEPTED'")
//    List<Friendship> findAllFriendships(@Param("userId") int userId);
//
//    @Query("SELECT f FROM Friendship f WHERE " +
//            "f.id.user2Id = :userId AND f.status = 'PENDING'")
//    List<Friendship> findPendingRequests(@Param("userId") int userId);
//
//    @Query("SELECT f FROM Friendship f WHERE " +
//            "(f.id.user1Id= :user1Id AND f.id.user2Id = :user2Id) OR " +
//            "(f.id.user1Id= :user2Id AND f.id.user2Id = :user1Id)")
//    Optional<Friendship> findByUsers(@Param("user1Id") int user1Id, @Param("user2Id") int user2Id);
//
//    @Query("SELECT COUNT(f) FROM Friendship f WHERE " +
//            "(f.id.user1Id= :userId OR f.id.user2Id = :userId) AND " +
//            "f.status = 'ACCEPTED'")
//    int countFriendships(@Param("userId") int userId);
//
//    @Query("SELECT COUNT(f) FROM Friendship f WHERE " +
//            "f.id.user2Id = :userId AND f.status = 'PENDING'")
//    int countPendingRequests(@Param("userId") int userId);
//
//@Query("SELECT u FROM User u WHERE u.userId NOT IN (" +
//        "SELECT DISTINCT CASE " +
//        "  WHEN f.id.user1Id = :userId THEN f.id.user2Id " +
//        "  ELSE f.id.user1Id " +
//        "END " +
//        "FROM Friendship f " +
//        "WHERE (f.id.user1Id = :userId OR f.id.user2Id = :userId)) " +
//        "AND u.userId != :userId " +
//        "AND u.status = 'ACTIVE' ")
//    List<User> findSuggestions(@Param("userId") int userId);
}