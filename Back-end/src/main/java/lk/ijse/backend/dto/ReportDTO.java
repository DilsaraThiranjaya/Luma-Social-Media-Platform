package lk.ijse.backend.dto;

import lk.ijse.backend.entity.Report.ReportType;
import lk.ijse.backend.entity.Report.Priority;
import lk.ijse.backend.entity.Report.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportDTO {
    private int reportId;
    private ReportType type;
    private String description;
    private Priority priority;
    private ReportStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private String resolutionNotes;

    private int reporterId;
    private String reporterUsername;

    private Integer reportedUserId;
    private Integer reportedPostId;
    private Integer reportedItemId;

    private Integer resolvedById;
    private String resolvedByUsername;
}