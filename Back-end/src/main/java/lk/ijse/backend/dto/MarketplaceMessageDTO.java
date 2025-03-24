package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import jakarta.validation.constraints.Size;
import lk.ijse.backend.entity.MarketplaceMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceMessageDTO {
    private int mkMsgId;

    @Size(max = 1000, message = "Content must be less than or equal to 1000 characters")
    private String content;

    @Null
    private LocalDateTime createdAt;
    private LocalDateTime readAt;

    @NotNull(message = "Marketplace item cannot be null")
    private MarketplaceItemDTO item;

    @NotNull(message = "Sender cannot be null")
    private UserDTO sender;

    private MarketplaceMessageDTO parentMessage;

    private List<MarketplaceMessageDTO> replies;
}