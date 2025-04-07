package lk.ijse.backend.controller;

import jakarta.validation.Valid;
import lk.ijse.backend.dto.NotificationDTO;
import lk.ijse.backend.dto.ResponseDTO;
import lk.ijse.backend.entity.Notification.NotificationType;
import lk.ijse.backend.service.impl.NotificationServiceImpl;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/v1/notifications")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {
    private final NotificationServiceImpl notificationService;

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> getNotifications(
            @RequestParam(required = false) NotificationType type,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        log.info("Fetching notifications for user: {}, type: {}",
                userEmail, type);

        try {
            List<NotificationDTO> notifications = notificationService.getNotifications(userEmail);

            // Filter by type if specified
            if (type != null) {
                notifications = notifications.stream()
                        .filter(n -> n.getType() == type)
                        .toList();
            }

            log.info("Successfully fetched {} notifications", notifications.size());
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Notifications Retrieved Successfully!", notifications));
        } catch (Exception e) {
            log.error("Error fetching notifications: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping(value = "/unread", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> getUnreadNotifications(
            @RequestParam(required = false) NotificationType type,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        log.info("Fetching unread notifications for user: {}, type: {}", userEmail, type);

        try {
            List<NotificationDTO> notifications = notificationService.getUnreadNotifications(userEmail);

            // Filter by type if specified
            if (type != null) {
                notifications = notifications.stream()
                        .filter(n -> n.getType() == type)
                        .toList();
            }

            log.info("Successfully fetched {} unread notifications", notifications.size());
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Unread Notifications Retrieved Successfully!", notifications));
        } catch (Exception e) {
            log.error("Error fetching unread notifications: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping(value = "/count", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> getUnreadCount(Authentication authentication) {
        String userEmail = authentication.getName();
        log.info("Getting unread notification count for user: {}", userEmail);

        try {
            List<NotificationDTO> unreadNotifications = notificationService.getUnreadNotifications(userEmail);
            Map<String, Integer> counts = Map.of(
                    "total", unreadNotifications.size(),
                    "friendRequests", (int) unreadNotifications.stream()
                            .filter(n -> n.getType() == NotificationType.FRIEND_REQUEST).count(),
                    "messages", (int) unreadNotifications.stream()
                            .filter(n -> n.getType() == NotificationType.NEW_MESSAGE).count(),
                    "postInteractions", (int) unreadNotifications.stream()
                            .filter(n -> n.getType() == NotificationType.POST_LIKE ||
                                    n.getType() == NotificationType.POST_COMMENT ||
                                    n.getType() == NotificationType.POST_SHARE).count()
            );

            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Unread Count Retrieved Successfully!", counts));
        } catch (Exception e) {
            log.error("Error getting unread count: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
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

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping(value = "/mark-all-read", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> markAllAsRead(
            @RequestParam(required = false) NotificationType type,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();
        log.info("Marking all notifications as read for user: {}, type: {}", userEmail, type);

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

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
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

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> createNotification(@Valid @RequestBody NotificationDTO notificationDTO) {
        log.info("Creating notification for user: {}", notificationDTO.getUser().getEmail());

        try {
            NotificationDTO created = notificationService.createNotification(notificationDTO);

            log.info("Successfully created notification");
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ResponseDTO(VarList.Created, "Notification Created Successfully!", created));
        } catch (Exception e) {
            log.error("Error creating notification: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }
}