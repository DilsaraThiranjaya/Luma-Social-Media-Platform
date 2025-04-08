package lk.ijse.backend.repository;


import lk.ijse.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

    @Query("SELECT COUNT(DISTINCT u) FROM User u " +
            "WHERE EXISTS (" +
            "    SELECT 1 FROM Post p WHERE p.user = u AND p.createdAt >= :since" +
            ") OR EXISTS (" +
            "    SELECT 1 FROM Comment c WHERE c.user = u AND c.createdAt >= :since" +
            ") OR EXISTS (" +
            "    SELECT 1 FROM Reaction r WHERE r.user = u AND r.createdAt >= :since" +
            ")")
    long countActiveUsersSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt < :date")
    long countCreatedBefore(@Param("date") LocalDateTime date);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt BETWEEN :start AND :end")
    long countByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(u) FROM User u WHERE u.birthday BETWEEN :start AND :end")
    long countByBirthdayBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT COUNT(u) FROM User u WHERE u.birthday < :date")
    long countByBirthdayBefore(@Param("date") LocalDate date);

    List<User> findTop5ByOrderByCreatedAtDesc();

}