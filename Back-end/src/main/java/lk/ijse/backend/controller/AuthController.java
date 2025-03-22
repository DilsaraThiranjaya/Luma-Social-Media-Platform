package lk.ijse.backend.controller;

import io.jsonwebtoken.JwtException;
import jakarta.validation.Valid;
import lk.ijse.backend.dto.ResponseDTO;
import lk.ijse.backend.dto.UserDTO;
import lk.ijse.backend.jwtmodels.AuthRequest;
import lk.ijse.backend.jwtmodels.AuthResponse;
import lk.ijse.backend.service.impl.UserServiceImpl;
import lk.ijse.backend.util.EmailSender;
import lk.ijse.backend.util.JwtUtil;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("api/v1/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserServiceImpl userService;
    private final EmailSender emailSender;

    @PostMapping(value = "/authenticate", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> authenticate(@Valid @RequestBody AuthRequest authRequest) {
        log.info("Received sign-in request for email: {}", authRequest.getEmail());

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(authRequest.getEmail(), authRequest.getPassword()));
        } catch (Exception e) {
            log.error("Authentication failed for email: {}", authRequest.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ResponseDTO(VarList.Unauthorized, "Invalid Credentials!", e.getMessage()));
        }

        UserDTO loadedUser = userService.loadUserDetailsByEmail(authRequest.getEmail());
        if (loadedUser == null) {
            log.error("User not found for email: {}", authRequest.getEmail());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
        }

        String token = jwtUtil.generateToken(loadedUser);
        if (token == null || token.isEmpty()) {
            log.error("Token generation failed for email: {}", authRequest.getEmail());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ResponseDTO(VarList.Conflict, "Authorization Failure! Please Try Again", null));
        }

        AuthResponse authResponse = new AuthResponse();
        authResponse.setEmail(loadedUser.getEmail());
        authResponse.setToken(token);

        log.info("User successfully signed in with email: {}", authRequest.getEmail());
        return ResponseEntity.status(HttpStatus.OK).body(new ResponseDTO(VarList.OK, "User Successfully Logged In!", authResponse));
    }


    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> register(@Valid @RequestBody UserDTO userDTO) {
        log.info("Received sign-up request for email: {}", userDTO.getEmail());

        try {
            int res = userService.saveUser(userDTO);
            switch (res) {
                case VarList.Created -> {
                    UserDTO savedUser = userService.loadUserDetailsByEmail(userDTO.getEmail());

                    if (savedUser == null) {
                        log.error("User not found for email: {}", userDTO.getEmail());
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(VarList.Not_Found, "Authorization Failure! Please Try Again", null));
                    }

                    String token = jwtUtil.generateToken(savedUser);
                    AuthResponse authResponse = new AuthResponse();
                    authResponse.setEmail(userDTO.getEmail());
                    authResponse.setToken(token);

                    log.info("User successfully signed up with email: {}", userDTO.getEmail());
                    return ResponseEntity.status(HttpStatus.CREATED).body(new ResponseDTO(VarList.Created, "User Successfully Registered!", authResponse));
                }
                case VarList.Not_Acceptable -> {
                    log.error("User already exists with email: {}", userDTO.getEmail());
                    return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE).body(new ResponseDTO(VarList.Not_Acceptable, "Email Already Used!", null));
                }
                default -> {
                    log.error("Failed to sign up user with email: {}", userDTO.getEmail());
                    return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(new ResponseDTO(VarList.Bad_Gateway, "Failed to Register!", null));
                }
            }
        } catch (Exception e) {
            log.error("Failed to sign up user with email: {}", userDTO.getEmail());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ResponseDTO(VarList.Internal_Server_Error, "Failed to Register!", e.getMessage()));
        }
    }

    @PostMapping(value = "/refreshToken", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> refreshToken(@RequestBody Map<String, String> request) {
        log.info("Received token refresh request");
        String refreshToken = request.get("refreshToken");

        try {
            String extractedEmail = jwtUtil.getUsernameFromToken(refreshToken);

            UserDetails userDetails = userService.loadUserByUsername(extractedEmail);
            if (userDetails == null) {
                log.error("User not found for email: {}", extractedEmail);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

            if (!jwtUtil.validateToken(refreshToken, userDetails)) {
                log.error("Invalid refresh token for email: {}", extractedEmail);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ResponseDTO(VarList.Unauthorized, "Invalid Token!", null));
            }

            UserDTO userDTO = userService.loadUserDetailsByEmail(extractedEmail);
            if (userDTO == null) {
                log.error("User not found for email: {}", extractedEmail);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

            String newAccessToken = jwtUtil.generateToken(userDTO);
            AuthResponse authResponse = new AuthResponse();
            authResponse.setEmail(userDTO.getEmail());
            authResponse.setToken(newAccessToken);

            log.info("New access token generated for email: {}", extractedEmail);
            return ResponseEntity.ok().body(new ResponseDTO(VarList.OK, "Access Token Refreshed!", authResponse));

        } catch (JwtException | IllegalArgumentException e) {
            log.error("Token validation error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ResponseDTO(VarList.Unauthorized, "Invalid Token", e.getMessage()));
        }
    }

    @PostMapping(value = "/sendOtpCode", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> sendOtpCode(@RequestBody Map<String, String> request) {
        log.info("Received senOtpCode request");
        String email = request.get("email");
        int otpCode = generateOTP();

        String emailTitle = "OTP Code";
        String emailContent = "Your One Time OTP Code: " + String.valueOf(otpCode);


        try {
            UserDetails userDetails = userService.loadUserByUsername(email);
            if (userDetails == null) {
                log.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

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

    @PostMapping(value = "/resetPassword", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> resetPassword(@RequestBody Map<String, String> request) {
        log.info("Received resetPassword request");
        String email = request.get("email");
        String password = request.get("password");

        try {
            UserDTO userDTO = userService.loadUserDetailsByEmail(email);
            if (userDTO == null) {
                log.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

            userDTO.setPassword(password);
            int res = userService.updateUser(userDTO);

            switch (res) {
                case VarList.Created -> {
                    log.info("Password rested successfully");
                    return ResponseEntity.status(HttpStatus.OK).body(new ResponseDTO(VarList.OK, "Password Rested Successfully!", null));
                }
                case VarList.Not_Acceptable -> {
                    log.error("User not found for this email: {}", userDTO.getEmail());
                    return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE).body(new ResponseDTO(VarList.Not_Acceptable, "User Not Found!", null));
                }
                default -> {
                    log.error("Failed to reset password with email: {}", userDTO.getEmail());
                    return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(new ResponseDTO(VarList.Bad_Gateway, "Failed to Reset Password!", null));
                }
            }
        } catch (Exception e) {
            log.error("Failed to reset password: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ResponseDTO(VarList.Unauthorized, "Failed to Reset Password", e.getMessage()));
        }
    }

    @PostMapping(value = "/requestAdminAccess", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> requestAdminAccess(@RequestBody Map<String, String> request) {
        log.info("Received admin access request");
        String email = request.get("email");
        String reason = request.get("reason");

        try {
            UserDTO userDTO = userService.loadUserDetailsByEmail(email);
            if (userDTO == null) {
                log.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

            // Send email to admin
            String adminEmail = "sahanlearnersofficial@gmail.com";
            String adminSubject = "New Admin Access Request";
            String adminContent = String.format(
                    "User %s (%s) is requesting admin access.\n\nReason: %s",
                    userDTO.getFirstName() + " " + userDTO.getLastName(),
                    email,
                    reason
            );
            emailSender.sendEmail(adminEmail, adminSubject, adminContent);

            // Send confirmation email to user
            String userSubject = "Admin Access Request Received";
            String userContent = "Your admin access request has been received and is under review.";
            emailSender.sendEmail(email, userSubject, userContent);

            log.info("Admin access request processed successfully");
            return ResponseEntity.status(HttpStatus.OK)
                    .body(new ResponseDTO(VarList.OK, "Request submitted successfully!", null));

        } catch (Exception e) {
            log.error("Failed to process admin access request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Failed to submit request", e.getMessage()));
        }
    }

    public static int generateOTP() {
        Random random = new Random();
        int otp = random.nextInt(900000) + 100000; // Generate a random number between 100000 and 999999
        return otp;
    }
}
