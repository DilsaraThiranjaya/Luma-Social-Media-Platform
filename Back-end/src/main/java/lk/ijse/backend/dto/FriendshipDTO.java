package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import lk.ijse.backend.entity.Friendship;
import lk.ijse.backend.entity.Friendship.FriendshipStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendshipDTO {
    private int user1Id;
    private int user2Id;
    private Friendship.FriendshipStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UserDTO user1;
    private UserDTO user2;
}