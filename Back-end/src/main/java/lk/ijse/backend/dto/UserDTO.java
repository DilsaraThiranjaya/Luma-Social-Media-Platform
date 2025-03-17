package lk.ijse.backend.dto;

import lk.ijse.backend.entity.User.Gender;
import lk.ijse.backend.entity.User.Role;
import lk.ijse.backend.entity.User.Status;
import lombok.*;
import org.hibernate.validator.constraints.URL;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Integer userId;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "First name is required")
    private String firstName;
    @NotBlank(message = "Last name is required")
    private String lastName;

    @Past(message = "Birthdate must be in the past")
    private LocalDate birthday;

    private Gender gender;

    @Pattern(regexp = "^[A-Za-z\\s]+,\\s*[A-Za-z\\s]+$", message = "Location should be valid")
    private String location;

    @Pattern(regexp = "^\\+?[0-9\\s-]{7,}$", message = "Invalid phone number format")
    private String phoneNumber;

    private Role role;
    private Status status;

    @URL(message = "Invalid profile picture URL")
    private String profilePictureUrl;

    @URL(message = "Invalid cover photo URL")
    private String coverPhotoUrl;

    @Size(max = 1000, message = "Bio cannot exceed 1000 characters")
    private String bio;

    // Read-only fields (should be ignored in requests)
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

    // Privacy and notification settings with defaults
    @Builder.Default
    private Boolean isOnline = false;

    @Builder.Default
    private Boolean isProfilePublic = true;

    @Builder.Default
    private Boolean isDisplayEmail = true;

    @Builder.Default
    private Boolean isDisplayPhone = true;

    @Builder.Default
    private Boolean isDisplayBirthdate = true;

    @Builder.Default
    private Boolean isShowActivity = true;

    @Builder.Default
    private Boolean isPostPublic = true;

    @Builder.Default
    private Boolean isShareAllowed = true;

    @Builder.Default
    private Boolean isPushNewFollowers = true;

    @Builder.Default
    private Boolean isPushMessages = true;

    @Builder.Default
    private Boolean isPushPostLikes = true;

    @Builder.Default
    private Boolean isPushPostComments = true;

    @Builder.Default
    private Boolean isPushPostShares = true;

    @Builder.Default
    private Boolean isPushReports = true;

    @Builder.Default
    private Boolean enable2fa = false;
}