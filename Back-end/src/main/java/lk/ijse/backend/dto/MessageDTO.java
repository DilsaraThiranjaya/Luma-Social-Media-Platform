package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import jakarta.validation.constraints.Size;
import lk.ijse.backend.entity.Message.MediaType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDTO {
    private int messageId;

    @Size(max = 1000, message = "Content must be less than or equal to 1000 characters")
    private String content;

    private MediaType mediaType;

    @URL(message = "Invalid media URL")
    private String mediaUrl;

    private LocalDateTime sentAt;
    private LocalDateTime readAt;

    private int chatId;

    @NotNull(message = "Sender cannot be null")
    private UserDTO sender;
}