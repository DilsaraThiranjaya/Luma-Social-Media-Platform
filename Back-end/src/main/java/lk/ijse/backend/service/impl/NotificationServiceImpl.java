package lk.ijse.backend.service.impl;

import lk.ijse.backend.dto.*;
import lk.ijse.backend.entity.Notification;
import lk.ijse.backend.entity.User;
import lk.ijse.backend.repository.NotificationRepository;
import lk.ijse.backend.repository.UserRepository;
import lk.ijse.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    public List<NotificationDTO> getNotifications(String userEmail) {
        User user = userRepository.findByEmail(userEmail);
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        return notifications.stream()
                .map(notification -> convertToDTO(notification))
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDTO> getUnreadNotifications(String userEmail) {
        User user = userRepository.findByEmail(userEmail);
        List<Notification> notifications = notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
        return notifications.stream()
                .map(notification -> convertToDTO(notification))
                .collect(Collectors.toList());
    }

    @Override
    public boolean markAsRead(int notificationId) {
        try {
            Notification notification = notificationRepository.findById(notificationId).orElse(null);
            if (notification != null) {
                notification.setIsRead(true);
                notificationRepository.save(notification);
                return true;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public boolean markAllAsRead(String userEmail) {
        try {
            User user = userRepository.findByEmail(userEmail);
            List<Notification> notifications = notificationRepository.findByUserAndIsReadFalse(user);
            notifications.forEach(notification -> notification.setIsRead(true));
            notificationRepository.saveAll(notifications);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public boolean deleteNotification(int notificationId) {
        try {
            notificationRepository.deleteById(notificationId);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public NotificationDTO createNotification(NotificationDTO notificationDTO) {
        // Check user preferences before creating notification
        boolean shouldCreate = false;

        switch (notificationDTO.getType()) {
            case FRIEND_REQUEST:
                shouldCreate = notificationDTO.getUser().getIsPushNewFollowers();
                break;
            case NEW_MESSAGE:
                shouldCreate = notificationDTO.getUser().getIsPushMessages();
                break;
            case POST_LIKE:
                shouldCreate = notificationDTO.getUser().getIsPushPostLikes();
                break;
            case POST_COMMENT:
                shouldCreate = notificationDTO.getUser().getIsPushPostComments();
                break;
            case POST_SHARE:
                shouldCreate = notificationDTO.getUser().getIsPushPostShares();
                break;
            case REPORT_UPDATE:
                shouldCreate = notificationDTO.getUser().getIsPushReports();
                break;
        }

        if (shouldCreate) {
            Notification saved = notificationRepository.save(modelMapper.map(notificationDTO, Notification.class));

            return convertToDTO(saved);
        }
        return null;
    }

    public static NotificationDTO convertToDTO(Notification notification) {
        if (notification == null) {
            return null;
        }

        NotificationDTO dto = new NotificationDTO();

        dto.setNotificationId(notification.getNotificationId());
        dto.setTitle(notification.getTitle());
        dto.setContent(notification.getContent());
        dto.setType(notification.getType());
        dto.setIsRead(notification.getIsRead());
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setActionUrl(notification.getActionUrl());

        if (notification.getUser() != null) {
            UserDTO userDTO = new UserDTO();
            userDTO.setUserId(notification.getUser().getUserId());
            userDTO.setEmail(notification.getUser().getEmail());
            dto.setUser(userDTO);
        }

        if (notification.getSourceUser() != null) {
            UserDTO sourceUserDTO = new UserDTO();
            sourceUserDTO.setUserId(notification.getSourceUser().getUserId());
            sourceUserDTO.setEmail(notification.getSourceUser().getEmail());
            sourceUserDTO.setFirstName(notification.getSourceUser().getFirstName());
            sourceUserDTO.setLastName(notification.getSourceUser().getLastName());
            sourceUserDTO.setProfilePictureUrl(notification.getSourceUser().getProfilePictureUrl());
            dto.setSourceUser(sourceUserDTO);
        }

        if (notification.getPost() != null) {
            PostDTO postDTO = new PostDTO();
            postDTO.setPostId(notification.getPost().getPostId());
            dto.setPost(postDTO);
        }

        if (notification.getComment() != null) {
            CommentDTO commentDTO = new CommentDTO();
            commentDTO.setCommentId(notification.getComment().getCommentId());
            dto.setComment(commentDTO);
        }

        if (notification.getMessage() != null) {
            MessageDTO messageDTO = new MessageDTO();
            messageDTO.setMessageId(notification.getMessage().getMessageId());
            dto.setMessage(messageDTO);
        }

        if (notification.getReport() != null) {
            ReportDTO reportDTO = new ReportDTO();
            reportDTO.setReportId(notification.getReport().getReportId());
            dto.setReport(reportDTO);
        }

        return dto;
    }
}