package lk.ijse.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
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

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FriendshipId implements Serializable {
        @Column(name = "user1_id")
        private int user1Id;

        @Column(name = "user2_id")
        private int user2Id;
    }

    public enum FriendshipStatus { PENDING, ACCEPTED, BLOCKED }
}
