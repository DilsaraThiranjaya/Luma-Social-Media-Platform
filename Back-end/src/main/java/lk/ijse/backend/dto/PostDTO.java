package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import jakarta.validation.constraints.Size;
import lk.ijse.backend.entity.Post;
import lk.ijse.backend.entity.Post.PrivacyLevel;
import lk.ijse.backend.entity.Post.Status;
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
public class PostDTO {
    private int postId;

    @Size(max = 5000, message = "Content must be less than or equal to 5000 characters")
    private String content;

    private LocalDateTime createdAt;

    @Builder.Default
    private PrivacyLevel privacy = PrivacyLevel.PUBLIC;

    @Builder.Default
    private Status status = Status.ACTIVE;

    private UserDTO user;

    private List<PostMediaDTO> media = new ArrayList<>();

    private List<CommentDTO> comments = new ArrayList<>();

    private List<ReactionDTO> reactions = new ArrayList<>();

    private List<PostDTO> shares = new ArrayList<>();
}