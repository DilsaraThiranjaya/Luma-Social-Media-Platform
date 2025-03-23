package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentDTO {
    private Integer commentId;

    @NotBlank(message = "Content cannot be empty")
    private String content;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @NotNull(message = "User must be specified")
    private UserDTO user;

    private CommentDTO parentComment;
    private List<CommentDTO> replies;
    private List<ReactionDTO> reactions;
}