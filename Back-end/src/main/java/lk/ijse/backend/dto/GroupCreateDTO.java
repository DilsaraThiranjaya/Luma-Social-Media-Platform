package lk.ijse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupCreateDTO {
    private String groupName;
    private List<Integer> participantIds;
    private MultipartFile groupImage;
}
