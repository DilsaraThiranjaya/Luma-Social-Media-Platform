package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import jakarta.validation.constraints.Size;
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

    @NotNull(message = "Report type cannot be null")
    private ReportType type;

    @NotBlank(message = "Description cannot be blank")
    @Size(max = 1000, message = "Description must be less than or equal to 1000 characters")
    private String description;

    @NotNull(message = "Priority cannot be null")
    private Priority priority;

    private ReportStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    @Size(max = 1000, message = "Resolution notes must be less than or equal to 1000 characters")
    private String resolutionNotes;

    private UserDTO reporter;
    private UserDTO reportedUser;
    private PostDTO reportedPost;
    private MarketplaceItemDTO reportedItem;
    private UserDTO resolvedBy;
}