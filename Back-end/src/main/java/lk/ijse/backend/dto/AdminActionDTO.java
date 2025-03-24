package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminActionDTO {

    private int actionId;

    @NotNull(message = "Action type cannot be null")
    private ActionType actionType;

    @Size(max = 1000, message = "Description must be less than or equal to 1000 characters")
    private String description;

    @Null
    private LocalDateTime performedAt;

    @NotNull(message = "Admin cannot be null")
    private UserDTO admin;

    private UserDTO targetUser;
    private PostDTO targetPost;
    private MarketplaceItemDTO targetItem;

    public enum ActionType {
        USER_BAN, POST_REMOVE, ITEM_REMOVE,
        REPORT_ESCALATION, REPORT_RESOLUTION
    }
}