package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lk.ijse.backend.entity.PostMedia;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostMediaDTO {
    private Integer mediaId;

    @NotBlank(message = "Media URL cannot be empty")
    private String mediaUrl;

    @NotNull(message = "Media type must be specified")
    private PostMedia.MediaType mediaType;
}