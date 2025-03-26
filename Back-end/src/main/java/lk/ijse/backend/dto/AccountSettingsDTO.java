package lk.ijse.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lk.ijse.backend.entity.User;
import lombok.Builder;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDate;
import java.util.List;

@Data
public class AccountSettingsDTO {
    @Email(message = "Invalid email format")
    private String email;

    private String firstName;
    private String lastName;

    @Past(message = "Birthdate must be in the past")
    private LocalDate birthday;

    private User.Gender gender;

    @Pattern(regexp = "^[A-Za-z\\s]+,\\s*[A-Za-z\\s]+$", message = "Location should be valid")
    private String location;

    @Pattern(regexp = "^\\+?[0-9\\s-]{7,}$", message = "Invalid phone number format")
    private String phoneNumber;

    @Size(max = 1000, message = "Bio cannot exceed 1000 characters")
    private String bio;
    
    private Boolean isOnline;
    private Boolean isProfilePublic;
    private Boolean isDisplayEmail;
    private Boolean isDisplayPhone;
    private Boolean isDisplayBirthdate;
    private Boolean isShowActivity;
    private Boolean isPostPublic;
    private Boolean isShareAllowed;
    private Boolean isPushNewFollowers;
    private Boolean isPushMessages;
    private Boolean isPushPostLikes;
    private Boolean isPushPostComments;
    private Boolean isPushPostShares;
    private Boolean isPushReports;
    private Boolean enable2fa;

    private List<EducationDTO> education;

    private List<WorkExperienceDTO> workExperience;
}