package lk.ijse.backend.dto;

import jakarta.validation.constraints.*;
import lk.ijse.backend.entity.MarketplaceItem.Category;
import lk.ijse.backend.entity.MarketplaceItem.Condition;
import lk.ijse.backend.entity.MarketplaceItem.ItemStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceItemDTO {
    private int itemId;

    @NotBlank(message = "Title cannot be blank")
    @Size(max = 255, message = "Title must be less than or equal to 255 characters")
    private String title;

    @Size(max = 1000, message = "Description must be less than or equal to 1000 characters")
    private String description;

    @NotBlank(message = "Price cannot be blank")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    @NotNull(message = "Category cannot be null")
    private Category category;

    @NotNull(message = "Condition cannot be null")
    private Condition condition;

    @NotNull(message = "Status cannot be null")
    private ItemStatus status;

    @Null
    private LocalDateTime createdAt;

    @NotNull(message = "Seller cannot be null")
    private UserDTO seller;

    private List<MarketplaceMessageDTO> messages;

    private List<ReportDTO> reports;

    private List<AdminActionDTO> adminActions;
}