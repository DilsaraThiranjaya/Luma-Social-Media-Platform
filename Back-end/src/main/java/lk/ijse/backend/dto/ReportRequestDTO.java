package lk.ijse.backend.dto;

import lombok.Data;

@Data
public class ReportRequestDTO {
    private int postId;
    private int userId;
    private String type;
    private String priority;
    private String description;
}
