package lk.ijse.backend.repository;


import lk.ijse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface UserRepository extends JpaRepository<User,String> {

    User findByEmail(String email);


    boolean existsByEmail(String email);

    int deleteByEmail(String email);

}