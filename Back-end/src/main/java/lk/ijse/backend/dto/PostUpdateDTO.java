package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Data
public class PostUpdateDTO {
    @Size(max = 5000, message = "Content must be less than or equal to 5000 characters")
    private String content;

    @NotNull
    private String privacy;

    private List<String> mediaToDelete = new ArrayList<>();
    private List<MultipartFile> newMedia = new ArrayList<>();
}