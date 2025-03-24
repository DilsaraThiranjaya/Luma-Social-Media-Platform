package lk.ijse.backend.controller;

import io.jsonwebtoken.JwtException;
import jakarta.validation.Valid;
import lk.ijse.backend.dto.*;
import lk.ijse.backend.service.impl.SettingsServiceImpl;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/v1/settings")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class SettingsController {
    private final SettingsServiceImpl settingsService;

    @PreAuthorize("hasAuthority('USER')")
    @PutMapping(value = "/account", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> updateAccountSettings(@Valid @RequestBody UserDTO userDTO, Authentication authentication) {
        log.info("Received account settings update request for user: {}", authentication.getName());

        try {
            if (!authentication.getName().equals(userDTO.getEmail())) {
                log.error("Unauthorized attempt to update settings for user: {}", userDTO.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ResponseDTO(VarList.Unauthorized, "Unauthorized access", null));
            }

            int result = settingsService.updateAccountSettings(userDTO);
            switch (result) {
                case VarList.Created -> {
                    log.info("Successfully updated account settings for user: {}", userDTO.getEmail());
                    return ResponseEntity.ok()
                            .body(new ResponseDTO(VarList.OK, "Settings updated successfully", null));
                }
                case VarList.Not_Found -> {
                    log.error("User not found: {}", userDTO.getEmail());
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(new ResponseDTO(VarList.Not_Found, "User not found", null));
                }
                default -> {
                    log.error("Failed to update settings for user: {}", userDTO.getEmail());
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

    @PreAuthorize("hasAuthority('USER')")
    @PutMapping(value = "/privacy", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> updatePrivacySettings(@RequestBody PrivacySettingsDTO settings, Authentication authentication) {
        log.info("Received privacy settings update request for user: {}", authentication.getName());

        try {
            int result = settingsService.updatePrivacySettings(authentication.getName(), settings);
            if (result == VarList.Created) {
                log.info("Successfully updated privacy settings for user: {}", authentication.getName());
                return ResponseEntity.ok()
                        .body(new ResponseDTO(VarList.OK, "Privacy settings updated successfully", null));
            } else {
                log.error("Failed to update privacy settings for user: {}", authentication.getName());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ResponseDTO(VarList.Internal_Server_Error, "Error updating privacy settings", null));
            }
        } catch (Exception e) {
            log.error("Error updating privacy settings: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error updating privacy settings", e.getMessage()));
        }
    }

    @PreAuthorize("hasAuthority('USER')")
    @PutMapping(value = "/notifications", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> updateNotificationSettings(@RequestBody NotificationSettingsDTO settings, Authentication authentication) {
        log.info("Received notification settings update request for user: {}", authentication.getName());

        try {
            int result = settingsService.updateNotificationSettings(authentication.getName(), settings);
            if (result == VarList.Created) {
                log.info("Successfully updated notification settings for user: {}", authentication.getName());
                return ResponseEntity.ok()
                        .body(new ResponseDTO(VarList.OK, "Notification settings updated successfully", null));
            } else {
                log.error("Failed to update notification settings for user: {}", authentication.getName());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ResponseDTO(VarList.Internal_Server_Error, "Error updating notification settings", null));
            }
        } catch (Exception e) {
            log.error("Error updating notification settings: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error updating notification settings", e.getMessage()));
        }
    }

    @PreAuthorize("hasAuthority('USER')")
    @PutMapping(value = "/security/password", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> updatePassword(@RequestBody PasswordUpdateDTO passwordUpdate, Authentication authentication) {
        log.info("Received password update request for user: {}", authentication.getName());

        try {
            int result = settingsService.updatePassword(authentication.getName(), passwordUpdate);
            switch (result) {
                case VarList.Created -> {
                    log.info("Successfully updated password for user: {}", authentication.getName());
                    return ResponseEntity.ok()
                            .body(new ResponseDTO(VarList.OK, "Password updated successfully", null));
                }
                case VarList.Not_Acceptable -> {
                    log.error("Invalid current password for user: {}", authentication.getName());
                    return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE)
                            .body(new ResponseDTO(VarList.Not_Acceptable, "Current password is incorrect", null));
                }
                default -> {
                    log.error("Failed to update password for user: {}", authentication.getName());
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(new ResponseDTO(VarList.Internal_Server_Error, "Error updating password", null));
                }
            }
        } catch (Exception e) {
            log.error("Error updating password: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error updating password", e.getMessage()));
        }
    }

    @PreAuthorize("hasAuthority('USER')")
    @PutMapping(value = "/security/2fa", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> toggle2FA(@RequestBody TwoFactorDTO twoFactorDTO, Authentication authentication) {
        log.info("Received 2FA toggle request for user: {}", authentication.getName());

        try {
            int result = settingsService.toggle2FA(authentication.getName(), twoFactorDTO.isEnabled());
            if (result == VarList.Created) {
                log.info("Successfully toggled 2FA for user: {}", authentication.getName());
                return ResponseEntity.ok()
                        .body(new ResponseDTO(VarList.OK, "2FA settings updated successfully", null));
            } else {
                log.error("Failed to toggle 2FA for user: {}", authentication.getName());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ResponseDTO(VarList.Internal_Server_Error, "Error updating 2FA settings", null));
            }
        } catch (Exception e) {
            log.error("Error toggling 2FA: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error updating 2FA settings", e.getMessage()));
        }
    }

    @PreAuthorize("hasAuthority('USER')")
    @DeleteMapping(value = "/deactivate", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> deactivateAccount(Authentication authentication) {
        log.info("Received account deactivation request for user: {}", authentication.getName());

        try {
            int result = settingsService.deactivateAccount(authentication.getName());
            if (result == VarList.Created) {
                log.info("Successfully deactivated account for user: {}", authentication.getName());
                return ResponseEntity.ok()
                        .body(new ResponseDTO(VarList.OK, "Account deactivated successfully", null));
            } else {
                log.error("Failed to deactivate account for user: {}", authentication.getName());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ResponseDTO(VarList.Internal_Server_Error, "Error deactivating account", null));
            }
        } catch (Exception e) {
            log.error("Error deactivating account: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error deactivating account", e.getMessage()));
        }
    }
}