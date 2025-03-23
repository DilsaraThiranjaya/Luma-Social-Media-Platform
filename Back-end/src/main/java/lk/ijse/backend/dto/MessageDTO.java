package lk.ijse.backend.dto;

import lk.ijse.backend.entity.Message.MediaType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDTO {
    private int messageId;
    private String content;
    private MediaType mediaType;
    private String mediaUrl;
    private LocalDateTime sentAt;
    private LocalDateTime readAt;
    private int chatId;
    private UserDTO sender;

    // Simple nested DTO for minimal user info
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserDTO {
        private int userId;
        private String username;
        private String profilePicture;
    }
}