package lk.ijse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrivacySettingsDTO {
    private Boolean isProfilePublic;
    private Boolean isDisplayEmail;
    private Boolean isDisplayPhone;
    private Boolean isDisplayBirthdate;
    private Boolean isShowActivity;
    private Boolean isPostPublic;
    private Boolean isShareAllowed;
}