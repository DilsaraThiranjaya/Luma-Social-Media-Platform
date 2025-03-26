//package lk.ijse.backend.service.impl;
//
//import lk.ijse.backend.dto.NotificationDTO;
//import lk.ijse.backend.entity.Notification;
//import lk.ijse.backend.entity.User;
//import lk.ijse.backend.repository.NotificationRepository;
//import lk.ijse.backend.repository.UserRepository;
//import lk.ijse.backend.service.NotificationService;
//import lombok.RequiredArgsConstructor;
//import org.modelmapper.ModelMapper;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.util.List;
//import java.util.stream.Collectors;
//
//@Service
//@Transactional
//@RequiredArgsConstructor
//public class NotificationServiceImpl implements NotificationService {
//    private final NotificationRepository notificationRepository;
//    private final UserRepository userRepository;
//    private final ModelMapper modelMapper;
//
//    @Override
//    public List<NotificationDTO> getNotifications(String userEmail) {
//        User user = userRepository.findByEmail(userEmail);
//        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
//        return notifications.stream()
//                .map(notification -> modelMapper.map(notification, NotificationDTO.class))
//                .collect(Collectors.toList());
//    }
//
//    @Override
//    public List<NotificationDTO> getUnreadNotifications(String userEmail) {
//        User user = userRepository.findByEmail(userEmail);
//        List<Notification> notifications = notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
//        return notifications.stream()
//                .map(notification -> modelMapper.map(notification, NotificationDTO.class))
//                .collect(Collectors.toList());
//    }
//
//    @Override
//    public boolean markAsRead(Integer notificationId) {
//        try {
//            Notification notification = notificationRepository.findById(notificationId).orElse(null);
//            if (notification != null) {
//                notification.setIsRead(true);
//                notificationRepository.save(notification);
//                return true;
//            }
//            return false;
//        } catch (Exception e) {
//            return false;
//        }
//    }
//
//    @Override
//    public boolean markAllAsRead(String userEmail) {
//        try {
//            User user = userRepository.findByEmail(userEmail);
//            List<Notification> notifications = notificationRepository.findByUserAndIsReadFalse(user);
//            notifications.forEach(notification -> notification.setIsRead(true));
//            notificationRepository.saveAll(notifications);
//            return true;
//        } catch (Exception e) {
//            return false;
//        }
//    }
//
//    @Override
//    public boolean deleteNotification(Integer notificationId) {
//        try {
//            notificationRepository.deleteById(notificationId);
//            return true;
//        } catch (Exception e) {
//            return false;
//        }
//    }
//}