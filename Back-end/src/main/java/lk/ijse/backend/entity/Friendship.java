package lk.ijse.backend.entity;

import jakarta.persistence.*;
import lk.ijse.backend.entity.Embeded.FriendshipId;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

@Entity
@Table(name = "friendship")
public class Friendship {
    @EmbeddedId
    private FriendshipId id;

    @ManyToOne
    @JoinColumn(name = "user1_id", insertable = false, updatable = false)
    private User user1;

    @ManyToOne
    @JoinColumn(name = "user2_id", insertable = false, updatable = false)
    private User user2;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private FriendshipStatus status = FriendshipStatus.PENDING;

    @CreationTimestamp
    private LocalDateTime createdAt;
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum FriendshipStatus { PENDING, ACCEPTED, BLOCKED }
}

