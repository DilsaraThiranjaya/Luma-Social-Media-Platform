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
@Table(name = "report")
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int reportId;

    @Enumerated(EnumType.STRING)
    private ReportType type;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Priority priority = Priority.LOW;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING;

    @CreationTimestamp
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    @ManyToOne
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @ManyToOne
    @JoinColumn(name = "reported_user_id")
    private User reportedUser;

    @ManyToOne
    @JoinColumn(name = "reported_post_id")
    @JsonBackReference("post-reports")
    private Post reportedPost;

    @ManyToOne
    @JoinColumn(name = "reported_item_id")
    private MarketplaceItem reportedItem;

    @ManyToOne
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    public enum ReportType { SPAM, HARASSMENT, INAPPROPRIATE, OTHER }
    public enum Priority { HIGH, MEDIUM, LOW }
    public enum ReportStatus { PENDING, RESOLVED, ESCALATED }
}
