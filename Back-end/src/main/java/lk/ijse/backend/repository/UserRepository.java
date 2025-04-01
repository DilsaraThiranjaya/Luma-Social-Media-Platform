package lk.ijse.backend.repository;


import lk.ijse.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.Optional;


public interface UserRepository extends JpaRepository<User,String> {

    User findByEmail(String email);


    boolean existsByEmail(String email);

    int deleteByEmail(String email);

    @Query("SELECT u FROM User u WHERE " +
            "LOWER(u.firstName) LIKE :firstName OR " +
            "LOWER(u.lastName) LIKE :lastName OR " +
            "LOWER(u.email) LIKE :email")
    Page<User> findByFirstNameLikeOrLastNameLikeOrEmailLike(String firstName, String lastName, String email, Pageable pageable);
}