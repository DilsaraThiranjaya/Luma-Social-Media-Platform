package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import jakarta.validation.constraints.Size;
import lk.ijse.backend.entity.Post.PrivacyLevel;
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

    @NotBlank(message = "Content cannot be blank")
    @Size(max = 5000, message = "Content must be less than or equal to 5000 characters")
    private String content;

    @Null
    private LocalDateTime createdAt;

    @NotNull(message = "Privacy level cannot be null")
    private PrivacyLevel privacy;

    @NotNull(message = "User cannot be null")
    private UserDTO user;

    private List<PostMediaDTO> media = new ArrayList<>();

    private List<CommentDTO> comments = new ArrayList<>();

    private List<ReactionDTO> reactions = new ArrayList<>();

    private EventDTO event;
}