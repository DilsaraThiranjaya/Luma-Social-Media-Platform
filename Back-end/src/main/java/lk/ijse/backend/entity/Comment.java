package lk.ijse.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

@Entity
@Table(name = "comment")
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int commentId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    private LocalDateTime createdAt;
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @ManyToOne
    @JoinColumn(name = "parent_comment_id")
    @JsonBackReference("comment-replies")
    private Comment parentComment;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "post_id", nullable = false)
    @JsonBackReference("post-comments")
    private Post post;

    @OneToMany(mappedBy = "parentComment")
    @JsonManagedReference("comment-replies")
    private List<Comment> replies = new ArrayList<>();

//    @OneToMany(mappedBy = "comment", cascade = CascadeType.ALL)
//    @JsonManagedReference("comment-reactions")
//    private List<Reaction> reactions = new ArrayList<>();

    @OneToMany(mappedBy = "comment", cascade = CascadeType.ALL)
    @JsonManagedReference("comment-notifications")
    private List<Notification> notifications = new ArrayList<>();
}
