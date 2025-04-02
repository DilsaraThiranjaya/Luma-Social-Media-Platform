package lk.ijse.backend.repository;

import lk.ijse.backend.entity.Friendship;
import lk.ijse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface FriendshipRepository extends JpaRepository<Friendship, Integer> {

    @Query("SELECT CASE WHEN f.user1 = :user1 THEN f.user2 ELSE f.user1 END " +
            "FROM Friendship f " +
            "WHERE (f.user1 = :user1 OR f.user2 = :user1) " +
            "AND f.status = 'ACCEPTED'")
    List<User> findFriendsByUser(User user1);

    @Query("SELECT f FROM Friendship f WHERE " +
            "(f.user1 = :user1 AND f.user2 = :user2) OR " +
            "(f.user1 = :user2 AND f.user2 = :user1)")
    Friendship findByUsers(int user1, int user2);
}