package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
public class EventDTO {

    private int eventId;

    @NotBlank(message = "Event name cannot be blank")
    @Size(max = 255, message = "Event name must be less than or equal to 255 characters")
    private String name;

    @NotNull(message = "Start date cannot be null")
    private LocalDate startDate;

    @NotNull(message = "End date cannot be null")
    private LocalDate endDate;

    @NotBlank(message = "Location cannot be blank")
    @Pattern(regexp = "^[A-Za-z\\s]+,\\s*[A-Za-z\\s]+$", message = "Location should be valid")
    private String location;

    private UserDTO user;
}