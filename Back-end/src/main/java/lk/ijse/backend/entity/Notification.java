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
@Table(name = "notification")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int notificationId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @Builder.Default
    private Boolean isRead = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private String actionUrl;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "source_user_id")
    private User sourceUser;

    @ManyToOne
    @JoinColumn(name = "post_id")
    @JsonBackReference("post-notifications")
    private Post post;

    @ManyToOne
    @JoinColumn(name = "comment_id")
    @JsonBackReference("comment-notifications")
    private Comment comment;

    @ManyToOne
    @JoinColumn(name = "message_id")
    private Message message;

    @ManyToOne
    @JoinColumn(name = "report_id")
    private Report report;

    public enum NotificationType {
        FRIEND_REQUEST,
        POST_LIKE,
        POST_COMMENT,
        POST_SHARE,
        NEW_MESSAGE,
        REPORT_UPDATE
    }
}
