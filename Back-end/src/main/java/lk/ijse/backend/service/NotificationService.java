package lk.ijse.backend.service;

import lk.ijse.backend.dto.NotificationDTO;
import java.util.List;

public interface NotificationService {
    List<NotificationDTO> getNotifications(String userEmail);
    List<NotificationDTO> getUnreadNotifications(String userEmail);
    boolean markAsRead(Integer notificationId);
    boolean markAllAsRead(String userEmail);
    boolean deleteNotification(Integer notificationId);
}