package lk.ijse.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

@Entity
@Table(name = "reaction")
public class Reaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int reactionId;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReactionType type = ReactionType.LIKE;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "post_id")
    @JsonBackReference("post-reactions")
    private Post post;

    @ManyToOne
    @JoinColumn(name = "comment_id")
    @JsonBackReference("comment-reactions")
    private Comment comment;

    public enum ReactionType { LIKE, LOVE, HAHA, WOW, SAD, ANGRY }
}
