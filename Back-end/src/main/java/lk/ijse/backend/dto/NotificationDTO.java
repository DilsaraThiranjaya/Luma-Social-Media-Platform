package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import lk.ijse.backend.entity.Notification.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    private int notificationId;

    @NotNull(message = "Notification type cannot be null")
    private NotificationType type;
    private Boolean isRead;

    @Null
    private LocalDateTime createdAt;

    @NotNull(message = "User cannot be null")
    private UserDTO user;

    private UserDTO sourceUser;

    private PostDTO post;

    private CommentDTO comment;

    private MessageDTO message;

    private ReportDTO report;
}