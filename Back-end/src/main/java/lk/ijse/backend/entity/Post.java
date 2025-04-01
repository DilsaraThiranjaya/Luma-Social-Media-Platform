package lk.ijse.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

@Entity
@Table(name = "post")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int postId;

    @Column(columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PrivacyLevel privacy = PrivacyLevel.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

//    @ManyToOne
//    @JoinColumn(name = "parent_post_id")
//    @JsonBackReference("post-shares")
//    private Post parentPost;

//    @OneToMany(mappedBy = "parentPost")
//    @JsonManagedReference("post-shares")
//    private List<Post> shares = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL,orphanRemoval = true )
    @JsonManagedReference("post-media")
    private List<PostMedia> media = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL)
    @JsonManagedReference("post-comments")
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL)
    @JsonManagedReference("post-reactions")
    private List<Reaction> reactions = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL)
    @JsonManagedReference("post-notifications")
    private List<Notification> notifications = new ArrayList<>();

    @OneToMany(mappedBy = "reportedPost", cascade = CascadeType.ALL)
    @JsonManagedReference("post-reports")
    private List<Report> reports = new ArrayList<>();

    @OneToMany(mappedBy = "targetPost", cascade = CascadeType.ALL)
    @JsonManagedReference("post-admin-actions")
    private List<AdminAction> adminActions = new ArrayList<>();

    public enum PrivacyLevel { PUBLIC, FRIENDS, PRIVATE }

    public enum Status { ACTIVE, INACTIVE }

    public void addMedia(PostMedia mediaItem) {
        media.add(mediaItem);
        mediaItem.setPost(this);
    }

    public void removeMedia(PostMedia mediaItem) {
        media.remove(mediaItem);
        mediaItem.setPost(null);
    }
}
