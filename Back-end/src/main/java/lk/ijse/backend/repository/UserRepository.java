package lk.ijse.backend.repository;


import lk.ijse.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;


public interface UserRepository extends JpaRepository<User,String> {

    User findByEmail(String email);

    boolean existsByEmail(String email);

    int deleteByEmail(String email);

    @Query("SELECT u FROM User u WHERE " +
            "(LOWER(u.firstName) LIKE :query OR " +
            "LOWER(u.lastName) LIKE :query OR " +
            "LOWER(u.email) LIKE :query) AND " +
            "u.isProfilePublic = true AND " +
            "u.userId <> :currentUserId")
    Page<User> searchPublicUsers(@Param("query") String query, @Param("currentUserId") int currentUserId, Pageable pageable
    );

    @Query("SELECT u FROM User u WHERE u.userId = :userId")
    User findByUserId(int userId);
}