package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkExperienceDTO {
    private int workId;

    @NotBlank(message = "Company name is required")
    private String company;

    @NotBlank(message = "Job title is required")
    private String jobTitle;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;
    private String description;

    @Null
    private LocalDateTime createdAt;

    @NotNull(message = "User must be specified")
    private UserDTO user;
}