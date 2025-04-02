package lk.ijse.backend.dto;

import jakarta.validation.constraints.*;
import lk.ijse.backend.entity.Friendship.FriendshipStatus;
import lk.ijse.backend.entity.User;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProfileInfoDTO {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @Past(message = "Birthdate must be in the past")
    private LocalDate birthday;

    private User.Gender gender;

    @Pattern(regexp = "^[A-Za-z\\s]+,\\s*[A-Za-z\\s]+$", message = "Location should be valid")
    private String location;

    @Pattern(regexp = "^\\+?[0-9\\s-]{7,}$", message = "Invalid phone number format")
    private String phoneNumber;

    @URL(message = "Invalid profile picture URL")
    private String profilePictureUrl;

    @URL(message = "Invalid cover photo URL")
    private String coverPhotoUrl;

    @Size(max = 1000, message = "Bio cannot exceed 1000 characters")
    private String bio;

    private LocalDateTime createdAt;
    private Boolean isDisplayEmail;
    private Boolean isDisplayPhone;
    private Boolean isDisplayBirthdate;

    private int postCount;
    private int followerCount;
    private int followingCount;

    private FriendshipStatus friendshipStatus;

    private List<EducationDTO> education;

    private List<WorkExperienceDTO> workExperience;
}
