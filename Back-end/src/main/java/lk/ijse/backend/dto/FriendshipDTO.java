package lk.ijse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FriendshipDTO {
    private Integer friendshipId;
    private String user1Email;
    private String user2Email;
    private String status;
    private String createdAt;
    private String updatedAt;
}