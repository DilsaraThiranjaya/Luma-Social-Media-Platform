package lk.ijse.backend.dto;

import lombok.Data;
import lk.ijse.backend.entity.Reaction.ReactionType;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PostResponseDTO {
    private int postId;
    private String content;
    private String privacy;
    private LocalDateTime createdAt;
    private UserDTO user;
    private List<PostMediaDTO> media;
    private List<ReactionDTO> reactions;
    private List<CommentDTO> comments;
    private int shares;
    private boolean liked;
    private ReactionType reactionType;
}
