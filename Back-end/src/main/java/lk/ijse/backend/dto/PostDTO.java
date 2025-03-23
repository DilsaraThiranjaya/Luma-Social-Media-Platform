package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lk.ijse.backend.entity.Post;
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
public class PostDTO {
    private Integer postId;

    @NotBlank(message = "Content cannot be empty")
    private String content;

    private LocalDateTime createdAt;

    @NotNull(message = "Privacy level must be specified")
    private Post.PrivacyLevel privacy;

    @NotNull(message = "User must be specified")
    private UserDTO user;

    private List<PostMediaDTO> media;
    private List<CommentDTO> comments;
    private List<ReactionDTO> reactions;
}