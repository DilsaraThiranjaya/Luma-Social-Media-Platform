package lk.ijse.backend.controller;

import jakarta.validation.Valid;
import lk.ijse.backend.dto.NotificationDTO;
import lk.ijse.backend.dto.ResponseDTO;
import lk.ijse.backend.service.impl.NotificationServiceImpl;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/notifications")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {
    private final NotificationServiceImpl notificationService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> getNotifications(@RequestParam String userEmail) {
        log.info("Fetching notifications for user: {}", userEmail);

        try {
            List<NotificationDTO> notifications = notificationService.getNotifications(userEmail);
            log.info("Successfully fetched {} notifications", notifications.size());
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Notifications Retrieved Successfully!", notifications));
        } catch (Exception e) {
            log.error("Error fetching notifications: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @GetMapping(value = "/unread", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> getUnreadNotifications(@RequestParam String userEmail) {
        log.info("Fetching unread notifications for user: {}", userEmail);

        try {
            List<NotificationDTO> notifications = notificationService.getUnreadNotifications(userEmail);
            log.info("Successfully fetched {} unread notifications", notifications.size());
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Unread Notifications Retrieved Successfully!", notifications));
        } catch (Exception e) {
            log.error("Error fetching unread notifications: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PostMapping(value = "/mark-read/{notificationId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> markAsRead(@PathVariable Integer notificationId) {
        log.info("Marking notification as read: {}", notificationId);

        try {
            boolean success = notificationService.markAsRead(notificationId);
            if (success) {
                log.info("Successfully marked notification as read");
                return ResponseEntity.ok()
                        .body(new ResponseDTO(VarList.OK, "Notification Marked as Read!", null));
            } else {
                log.error("Failed to mark notification as read");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ResponseDTO(VarList.Bad_Request, "Failed to Mark Notification as Read!", null));
            }
        } catch (Exception e) {
            log.error("Error marking notification as read: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PostMapping(value = "/mark-all-read", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> markAllAsRead(@RequestParam String userEmail) {
        log.info("Marking all notifications as read for user: {}", userEmail);

        try {
            boolean success = notificationService.markAllAsRead(userEmail);
            if (success) {
                log.info("Successfully marked all notifications as read");
                return ResponseEntity.ok()
                        .body(new ResponseDTO(VarList.OK, "All Notifications Marked as Read!", null));
            } else {
                log.error("Failed to mark all notifications as read");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ResponseDTO(VarList.Bad_Request, "Failed to Mark All Notifications as Read!", null));
            }
        } catch (Exception e) {
            log.error("Error marking all notifications as read: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @DeleteMapping(value = "/{notificationId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> deleteNotification(@PathVariable Integer notificationId) {
        log.info("Deleting notification: {}", notificationId);

        try {
            boolean success = notificationService.deleteNotification(notificationId);
            if (success) {
                log.info("Successfully deleted notification");
                return ResponseEntity.ok()
                        .body(new ResponseDTO(VarList.OK, "Notification Deleted Successfully!", null));
            } else {
                log.error("Failed to delete notification");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ResponseDTO(VarList.Bad_Request, "Failed to Delete Notification!", null));
            }
        } catch (Exception e) {
            log.error("Error deleting notification: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }
}