package lk.ijse.backend.controller;

import io.jsonwebtoken.JwtException;
import jakarta.validation.Valid;
import lk.ijse.backend.dto.*;
import lk.ijse.backend.service.AccountService;
import lk.ijse.backend.service.UserService;
import lk.ijse.backend.util.EmailSender;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("api/v1/settings")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class SettingsController {
    private final UserService userService;
    private final AccountService accountService;
    private final EmailSender emailSender;

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/account")
    public ResponseEntity<ResponseDTO> getAccountSettings(Authentication authentication) {
        log.info("Received account settings fetch request for user: {}", authentication.getName());
        try {
            String email = authentication.getName();

            AccountSettingsDTO accountSettingsDTO = accountService.getSettings(email);

            if (accountSettingsDTO == null) {
                log.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

            log.info("Successfully retrieved account settings for user: {}", email);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Account data retrieved", accountSettingsDTO));
        } catch (Exception e) {
            log.error("Error retrieving account settings: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PutMapping(value = "/account", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> updateAccountSettings(@Valid @RequestBody AccountSettingsDTO accountSettingsDTO, Authentication authentication) {
        log.info("Received account settings update request for user: {}", authentication.getName());
        try {
            String email = authentication.getName();

            UserDTO userDTO = userService.loadUserDetailsByEmail(email);
            if (userDTO == null) {
                log.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

            userDTO.setFirstName(accountSettingsDTO.getFirstName());
            userDTO.setLastName(accountSettingsDTO.getLastName());
            userDTO.setGender(accountSettingsDTO.getGender());
            userDTO.setBirthday(accountSettingsDTO.getBirthday());
            userDTO.setEmail(accountSettingsDTO.getEmail());
            userDTO.setPhoneNumber(accountSettingsDTO.getPhoneNumber());
            userDTO.setLocation(accountSettingsDTO.getLocation());
            userDTO.setBio(accountSettingsDTO.getBio());

            int result = accountService.updateAccount(
                    userDTO,
                    accountSettingsDTO.getEducation(),
                    accountSettingsDTO.getWorkExperience()
            );

            switch (result) {
                case VarList.OK -> {
                    log.info("Successfully updated account settings for user: {}", email);
                    return ResponseEntity.ok()
                            .body(new ResponseDTO(VarList.OK, "Settings updated successfully", null));
                }
                default -> {
                    log.error("Failed to update settings for user: {}", email);
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(new ResponseDTO(VarList.Internal_Server_Error, "Error updating settings", null));
                }
            }
        } catch (Exception e) {
            log.error("Error updating account settings: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error updating settings", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping(value = "/sendOtpCode", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> sendOtpCode(@RequestBody Map<String, String> request) {
        log.info("Received senOtpCode request");
        String email = request.get("email");
        int otpCode = generateOTP();

        String emailTitle = "OTP Code";
        String emailContent = "Your One Time OTP Code: " + String.valueOf(otpCode);

        try {
            boolean isSent = emailSender.sendEmail(email, emailTitle, emailContent);
            if (!isSent) {
                log.error("Failed to send otp code to email: {}", email);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ResponseDTO(VarList.Unauthorized, "Failed to send otp code to email", null));
            }

            log.info("Email sent successfully");
            return ResponseEntity.status(HttpStatus.OK).body(new ResponseDTO(VarList.OK, "OTP Sent!", otpCode));

        } catch (Exception e) {
            log.error("Failed to send email: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ResponseDTO(VarList.Unauthorized, "Failed to send email", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PutMapping(value = "/security/changePassword", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> resetPassword(@RequestBody Map<String, String> request, Authentication authentication) {
        log.info("Received changePassword request");
        String email = authentication.getName();
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        try {
            UserDTO userDTO = userService.loadUserDetailsByEmail(email);
            if (userDTO == null) {
                log.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

            BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
            if (!passwordEncoder.matches(currentPassword, userDTO.getPassword())) {
                log.error("Invalid current password for email: {}", email);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ResponseDTO(VarList.Unauthorized, "Invalid Current Password!", null));
            }

            userDTO.setPassword(newPassword);
            int res = userService.updateUser(userDTO);

            switch (res) {
                case VarList.Created -> {
                    log.info("Password changed successfully");
                    return ResponseEntity.status(HttpStatus.OK).body(new ResponseDTO(VarList.OK, "Password Changed Successfully!", null));
                }
                case VarList.Not_Acceptable -> {
                    log.error("User not found for this email: {}", userDTO.getEmail());
                    return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE).body(new ResponseDTO(VarList.Not_Acceptable, "User Not Found!", null));
                }
                default -> {
                    log.error("Failed to change password with email: {}", userDTO.getEmail());
                    return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(new ResponseDTO(VarList.Bad_Gateway, "Failed to Change Password!", null));
                }
            }
        } catch (Exception e) {
            log.error("Failed to change password: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ResponseDTO(VarList.Unauthorized, "Failed to Change Password", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PutMapping(value = "/privacy", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> updatePrivacySettings(@Valid @RequestBody PrivacySettingsDTO privacySettingsDTO, Authentication authentication) {

        log.info("Received privacy settings update request for user: {}", authentication.getName());

        try {
            String email = authentication.getName();

            UserDTO userDTO = userService.loadUserDetailsByEmail(email);
            if (userDTO == null) {
                log.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

            userDTO.setIsProfilePublic(privacySettingsDTO.getIsProfilePublic());
            userDTO.setIsDisplayEmail(privacySettingsDTO.getIsDisplayEmail());
            userDTO.setIsDisplayPhone(privacySettingsDTO.getIsDisplayPhone());
            userDTO.setIsDisplayBirthdate(privacySettingsDTO.getIsDisplayBirthdate());
            userDTO.setIsShowActivity(privacySettingsDTO.getIsShowActivity());
            userDTO.setIsPostPublic(privacySettingsDTO.getIsPostPublic());
            userDTO.setIsShareAllowed(privacySettingsDTO.getIsShareAllowed());

            int res = userService.updateUser(userDTO);

            switch (res) {
                case VarList.Created -> {
                    log.info("Privacy settings updated successfully for user: {}", email);
                    return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Privacy settings updated successfully", null));
                }
                case VarList.Not_Acceptable -> {
                    log.error("User not found for this email: {}", userDTO.getEmail());
                    return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE).body(new ResponseDTO(VarList.Not_Acceptable, "User Not Found!", null));
                }
                default -> {
                    log.error("Failed to update privacy settings for user: {}", email);
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseDTO(VarList.Bad_Request, "Failed to update privacy settings!", null));
                }
            }
        } catch (Exception e) {
            log.error("Error updating privacy settings: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "An error occurred!", null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PutMapping(value = "/notifications", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> updateNotificationSettings(@Valid @RequestBody NotificationSettingsDTO notificationSettingsDTO, Authentication authentication) {

        log.info("Received notification settings update request for user: {}", authentication.getName());

        try {
            String email = authentication.getName();

            UserDTO userDTO = userService.loadUserDetailsByEmail(email);
            if (userDTO == null) {
                log.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

            userDTO.setIsPushNewFollowers(notificationSettingsDTO.getIsPushNewFollowers());
            userDTO.setIsPushMessages(notificationSettingsDTO.getIsPushMessages());
            userDTO.setIsPushPostLikes(notificationSettingsDTO.getIsPushPostLikes());
            userDTO.setIsPushPostComments(notificationSettingsDTO.getIsPushPostComments());
            userDTO.setIsPushPostShares(notificationSettingsDTO.getIsPushPostShares());
            userDTO.setIsPushReports(notificationSettingsDTO.getIsPushReports());

            int res = userService.updateUser(userDTO);

            switch (res) {
                case VarList.Created -> {
                    log.info("Notification settings updated successfully for user: {}", email);
                    return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Notification settings updated successfully", null));
                }
                case VarList.Not_Acceptable -> {
                    log.error("User not found for this email: {}", userDTO.getEmail());
                    return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE)
                            .body(new ResponseDTO(VarList.Not_Acceptable, "User Not Found!", null));
                }
                default -> {
                    log.error("Failed to update notification settings for user: {}", email);
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(new ResponseDTO(VarList.Bad_Request, "Failed to update notification settings!", null));
                }
            }
        } catch (Exception e) {
            log.error("Error updating notification settings: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "An error occurred!", null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PutMapping(value = "/security/2fa", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> updateTwoFactorAuth(@Valid @RequestBody TwoFactorDTO twoFactorDTO, Authentication authentication) {

        log.info("Received 2FA update request for user: {}", authentication.getName());

        try {
            String email = authentication.getName();

            UserDTO userDTO = userService.loadUserDetailsByEmail(email);
            if (userDTO == null) {
                log.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

            userDTO.setEnable2fa(twoFactorDTO.isEnabled());

            int res = userService.updateUser(userDTO);

            switch (res) {
                case VarList.Created -> {
                    log.info("2FA updated successfully for user: {}", email);
                    return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Two-Factor Authentication updated successfully", null));
                }
                case VarList.Not_Acceptable -> {
                    log.error("User not found for this email: {}", userDTO.getEmail());
                    return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE)
                            .body(new ResponseDTO(VarList.Not_Acceptable, "User Not Found!", null));
                }
                default -> {
                    log.error("Failed to update 2FA for user: {}", email);
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(new ResponseDTO(VarList.Bad_Request, "Failed to update Two-Factor Authentication!", null));
                }
            }
        } catch (Exception e) {
            log.error("Error updating 2FA settings: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "An error occurred!", null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/security/deactivate")
    public ResponseEntity<ResponseDTO> deactivateAccount(Authentication authentication) {
        log.info("Received account deactivation request for user: {}", authentication.getName());

        try {
            String email = authentication.getName();

            int res = userService.deleteUser(email);

            switch (res) {
                case VarList.OK -> {
                    log.info("Account deactivated successfully for user: {}", email);
                    return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Account deactivated successfully", null));
                }
                case VarList.Not_Found -> {
                    log.error("User not found for this email: {}", email);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
                }
                default -> {
                    log.error("Failed to deactivate account for user: {}", email);
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(new ResponseDTO(VarList.Bad_Request, "Failed to deactivate account!", null));
                }
            }
        } catch (Exception e) {
            log.error("Error deactivating account: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "An error occurred!", null));
        }
    }

    public static int generateOTP() {
        Random random = new Random();
        int otp = random.nextInt(900000) + 100000; // Generate a random number between 100000 and 999999
        return otp;
    }
}