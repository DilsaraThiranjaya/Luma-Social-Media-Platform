package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lk.ijse.backend.entity.PostMedia.MediaType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostMediaDTO {
    private int mediaId;

    @NotBlank(message = "Media URL cannot be blank")
    @URL(message = "Invalid media URL")
    private String mediaUrl;

    @NotNull(message = "Media type cannot be null")
    private MediaType mediaType;
}