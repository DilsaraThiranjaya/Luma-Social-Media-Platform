package lk.ijse.backend.dto;

import lk.ijse.backend.entity.AdminAction;
import lk.ijse.backend.entity.User;
import lombok.Data;

@Data
public class AdminActionDTO {
    private int actionId;
    private AdminAction.ActionType actionType;
    private String description;
    private String performedAt;
    private UserDTO admin;
    private UserDTO targetUser;
    private PostDTO targetPost;
    private MarketplaceItemDTO targetItem;
}
