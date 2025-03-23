package lk.ijse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsDTO {
    private Boolean isPushNewFollowers;
    private Boolean isPushMessages;
    private Boolean isPushPostLikes;
    private Boolean isPushPostComments;
    private Boolean isPushPostShares;
    private Boolean isPushReports;
}