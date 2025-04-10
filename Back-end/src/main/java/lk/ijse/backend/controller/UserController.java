package lk.ijse.backend.controller;

import lk.ijse.backend.dto.ResponseDTO;
import lk.ijse.backend.dto.UserDTO;
import lk.ijse.backend.service.UserService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/users")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin("*")
public class UserController {
    private final UserService userService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> getAllUsers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search
    ) {
        log.info("Received user fetch request");
        try {
            List<UserDTO> users = userService.getAllUsers(status, search);

            log.info("Successfully retrieved users");
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Users Retrieved Successfully!", users));
        } catch (Exception e) {
            log.error("Error fetching users: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{userId}/status")
    public ResponseEntity<ResponseDTO> updateUserStatus(
            @PathVariable int userId,
            @RequestParam String status
    ) {
        log.info("Received user status update request for user: {}", userId);
        try {
            userService.updateUserStatus(userId, status);

            log.info("Successfully updated user status for user: {}", userId);
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "User Status Updated Successfully!", null));
        } catch (Exception e) {
            log.error("Error updating user status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/stats")
    public ResponseEntity<ResponseDTO> getUserStats() {
        log.info("Received user stats fetch request");
        try {
            var stats = userService.getUserStats();

            log.info("Successfully retrieved user stats");
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "User Stats Retrieved Successfully!", stats));
        } catch (Exception e) {
            log.error("Error fetching user stats: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }
}