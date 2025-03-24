package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
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
    private FriendshipIdDTO id;

    @NotNull(message = "User1 cannot be null")
    private UserDTO user1;

    @NotNull(message = "User2 cannot be null")
    private UserDTO user2;

    @NotNull(message = "Status cannot be null")
    private FriendshipStatus status;

    @Null
    private LocalDateTime createdAt;

    @Null
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FriendshipIdDTO implements Serializable {
        private int user1Id;
        private int user2Id;
    }
}