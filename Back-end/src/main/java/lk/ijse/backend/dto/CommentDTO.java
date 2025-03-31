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
import java.util.ArrayList;
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

    private UserDTO user;
    private PostDTO post;
    private int parentCommentId;
    private List<CommentDTO> replies = new ArrayList<>();
    private List<ReactionDTO> reactions = new ArrayList<>();
    private boolean liked;
    private String reactionType;
}
