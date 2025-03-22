package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotNull;
import lk.ijse.backend.entity.Post.PrivacyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostShareDTO {
    @NotNull(message = "Original post ID is required")
    private Integer originalPostId;

    private String message;

    @NotNull(message = "Privacy level is required")
    private PrivacyLevel privacy;

    @NotNull(message = "User is required")
    private UserDTO user;
}