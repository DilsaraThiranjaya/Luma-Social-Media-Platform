package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotNull;
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
    private Integer notificationId;

    @NotNull(message = "Notification type must be specified")
    private NotificationType type;

    private Boolean isRead;
    private LocalDateTime createdAt;

    @NotNull(message = "User must be specified")
    private UserDTO user;

    private UserDTO sourceUser;
    private PostDTO post;
    private CommentDTO comment;
    private MessageDTO message;
    private ReportDTO report;
}