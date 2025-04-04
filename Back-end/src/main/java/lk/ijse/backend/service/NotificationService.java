package lk.ijse.backend.service;

import lk.ijse.backend.dto.NotificationDTO;
import lk.ijse.backend.dto.UserDTO;
import lk.ijse.backend.entity.Notification;

import java.util.List;

public interface NotificationService {
    List<NotificationDTO> getNotifications(String userEmail);
    List<NotificationDTO> getUnreadNotifications(String userEmail);
    boolean markAsRead(int notificationId);
    boolean markAllAsRead(String userEmail);
    boolean deleteNotification(int notificationId);
    NotificationDTO createNotification(UserDTO user, Notification.NotificationType type, String title, String message, String actionUrl);
}