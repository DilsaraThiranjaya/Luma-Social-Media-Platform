package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import jakarta.validation.constraints.Size;
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

    private int commentId;

    @NotBlank(message = "Content cannot be blank")
    @Size(max = 1000, message = "Content must be less than or equal to 1000 characters")
    private String content;

    @Null
    private LocalDateTime createdAt;

    @Null
    private LocalDateTime updatedAt;

    private CommentDTO parentComment;

    @NotNull(message = "User cannot be null")
    private UserDTO user;

    @NotNull(message = "Post cannot be null")
    private PostDTO post;

    private List<CommentDTO> replies;
    private List<ReactionDTO> reactions;
    private List<NotificationDTO> notifications;
}