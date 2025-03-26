package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EducationDTO {

    private int educationId;

    @NotBlank(message = "Institution cannot be blank")
    @Size(max = 255, message = "Institution must be less than or equal to 255 characters")
    private String institution;

    @NotBlank(message = "Field of study cannot be blank")
    @Size(max = 255, message = "Field of study must be less than or equal to 255 characters")
    private String fieldOfStudy;

    @NotNull(message = "Start date cannot be null")
    private LocalDate startDate;

    private LocalDate endDate;
}