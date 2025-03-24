package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;


@AllArgsConstructor
@NoArgsConstructor
@Data
@Component
public class ResponseDTO {
    @NotNull(message = "Code is required")
    private int code;
    private String message;
    private Object data;
}
