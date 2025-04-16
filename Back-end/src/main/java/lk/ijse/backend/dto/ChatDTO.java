package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import jakarta.validation.constraints.Size;
import lk.ijse.backend.entity.Chat;
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
public class ChatDTO {

    private int chatId;

    @NotNull(message = "Chat type cannot be null")
    private Chat.ChatType type;

    @Size(max = 255, message = "Group name must be less than or equal to 255 characters")
    private String groupName;

    @URL(message = "Invalid group image URL")
    private String groupImageUrl;

    @NotNull(message = "Created by cannot be null")
    private UserDTO createdBy;

    private int unreadCount;

    private List<UserDTO> participants;
    private LocalDateTime createdAt;
    private MessageDTO lastMessage;
}
