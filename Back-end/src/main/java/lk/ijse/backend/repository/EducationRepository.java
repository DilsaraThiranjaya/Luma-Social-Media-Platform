package lk.ijse.backend.repository;

import lk.ijse.backend.entity.Education;
import lk.ijse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EducationRepository extends JpaRepository<Education, Integer> {
    void deleteByUser(User user);

    List<Education> findByUser(User user);
}