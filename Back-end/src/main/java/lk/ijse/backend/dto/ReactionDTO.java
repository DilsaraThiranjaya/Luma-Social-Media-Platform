package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import lk.ijse.backend.entity.Reaction.ReactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReactionDTO {
    private int reactionId;

    @NotNull(message = "Reaction type cannot be null")
    private ReactionType type;

    @Null
    private LocalDateTime createdAt;

    @NotNull(message = "User cannot be null")
    private UserDTO user;

    private PostDTO post;
    private CommentDTO comment;
}