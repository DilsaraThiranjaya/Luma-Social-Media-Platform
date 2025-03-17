package lk.ijse.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

@Entity
@Table(name = "marketplace_item")
public class MarketplaceItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int itemId;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Category category = Category.OTHER;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "item_condition")
    private Condition condition = Condition.NEW;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ItemStatus status = ItemStatus.AVAILABLE;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL)
    private List<MarketplaceMessage> messages = new ArrayList<>();

    @OneToMany(mappedBy = "reportedItem", cascade = CascadeType.ALL)
    private List<Report> reports = new ArrayList<>();

    @OneToMany(mappedBy = "targetItem", cascade = CascadeType.ALL)
    private List<AdminAction> adminActions = new ArrayList<>();

    public enum Category { ELECTRONICS, CLOTHING, FURNITURE, BOOKS, OTHER }
    public enum Condition { NEW, LIKE_NEW, USED_GOOD, USED_FAIR }
    public enum ItemStatus { AVAILABLE, PENDING, SOLD }
}
