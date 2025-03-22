package lk.ijse.backend.repository;

import lk.ijse.backend.entity.Education;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EducationRepository extends JpaRepository<Education, Integer> {
}