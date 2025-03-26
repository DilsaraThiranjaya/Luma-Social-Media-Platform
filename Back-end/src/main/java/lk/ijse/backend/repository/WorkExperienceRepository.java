package lk.ijse.backend.repository;

import lk.ijse.backend.entity.User;
import lk.ijse.backend.entity.WorkExperience;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkExperienceRepository extends JpaRepository<WorkExperience, Integer> {
    void deleteByUser(User user);

    List<WorkExperience> findByUser(User user);
}