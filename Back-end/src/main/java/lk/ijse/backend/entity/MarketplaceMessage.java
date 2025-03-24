package lk.ijse.backend.entity;

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
@Table(name = "marketplace_message")
public class MarketplaceMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int mkMsgId;

    @Column(columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    private LocalDateTime createdAt;
    private LocalDateTime readAt;

    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private MarketplaceItem item;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne
    @JoinColumn(name = "parent_message_id")
    private MarketplaceMessage parentMessage;

    @OneToMany(mappedBy = "parentMessage")
    private List<MarketplaceMessage> replies = new ArrayList<>();
}
