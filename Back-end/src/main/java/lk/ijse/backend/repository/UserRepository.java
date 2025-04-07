package lk.ijse.backend.repository;


import lk.ijse.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserRepository extends JpaRepository<User,String> {

    User findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE " +
            "(LOWER(u.firstName) LIKE :query OR " +
            "LOWER(u.lastName) LIKE :query OR " +
            "LOWER(u.email) LIKE :query) AND " +
            "u.status = 'ACTIVE' AND " +
            "u.isProfilePublic = true AND " +
            "u.userId <> :currentUserId AND " +
            "NOT EXISTS (SELECT f FROM Friendship f WHERE " +
            "    ((f.id.user1Id = u.userId AND f.id.user2Id = :currentUserId) OR " +
            "     (f.id.user2Id = u.userId AND f.id.user1Id = :currentUserId)) AND " +
            "    f.status = 'BLOCKED') ")
    Page<User> searchPublicUsers(
            @Param("query") String query,
            @Param("currentUserId") int currentUserId,
            Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.userId = :userId")
    User findByUserId(int userId);

    List<User> findByRole(User.Role role);
}