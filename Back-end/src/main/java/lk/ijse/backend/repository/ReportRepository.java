package lk.ijse.backend.repository;

import lk.ijse.backend.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Integer> {
    long countByStatus(Report.ReportStatus status);

    @Query("SELECT COUNT(r) FROM Report r WHERE r.createdAt < :date")
    long countCreatedBefore(@Param("date") LocalDateTime date);

    List<Report> findTop5ByOrderByCreatedAtDesc();

    long countByCreatedAtBetween(LocalDateTime sixtyDaysAgo, LocalDateTime thirtyDaysAgo);
}
