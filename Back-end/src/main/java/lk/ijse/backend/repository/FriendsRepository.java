package lk.ijse.backend.repository;

import lk.ijse.backend.entity.Friendship;
import lk.ijse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface FriendsRepository extends JpaRepository<Friendship, Integer> {
    List<Friendship> findByUser2AndStatus(User user, Friendship.FriendshipStatus status);
    List<Friendship> findByUser1OrUser2AndStatus(User user1, User user2, Friendship.FriendshipStatus status);
    boolean existsByUser1AndUser2(User user1, User user2);

    @Query("SELECT CASE WHEN f.user1 = :user1 THEN f.user2 ELSE f.user1 END " +
            "FROM Friendship f " +
            "WHERE (f.user1 = :user1 OR f.user2 = :user1) " +
            "AND f.status = 'ACCEPTED'")
    List<User> findFriendsByUser(User user1);

    @Query("SELECT f FROM Friendship f WHERE " +
            "(f.user1 = :user1 AND f.user2 = :user2) OR " +
            "(f.user1 = :user2 AND f.user2 = :user1)")
    Friendship findByUsers(User user1, User user2);
}