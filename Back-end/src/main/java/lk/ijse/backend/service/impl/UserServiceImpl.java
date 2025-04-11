package lk.ijse.backend.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lk.ijse.backend.dto.*;
import lk.ijse.backend.entity.Notification;
import lk.ijse.backend.entity.Report;
import lk.ijse.backend.entity.User;
import lk.ijse.backend.repository.ReportRepository;
import lk.ijse.backend.repository.UserRepository;
import lk.ijse.backend.service.NotificationService;
import lk.ijse.backend.service.UserService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserDetailsService, UserService {
    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final NotificationService notificationService;
    private final ModelMapper modelMapper;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email);

        if (user != null) {
            return new org.springframework.security.core.userdetails.User(
                    user.getEmail(),
                    user.getPassword(),
                    Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
            );
        }
        return null;
    }

    @Override
    public UserDTO loadUserDetailsByEmail(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email);
        if (user != null) {
            return modelMapper.map(user, UserDTO.class);
        }
        return null;
    }

    @Override
    public int saveUser(UserDTO userDTO) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            return VarList.Not_Acceptable;
        } else {
            BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
            userDTO.setPassword(passwordEncoder.encode(userDTO.getPassword()));
            userRepository.save(modelMapper.map(userDTO, User.class));
            return VarList.Created;
        }
    }

    @Override
    public int updateUser(UserDTO userDTO) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

            // Check if password is NOT already BCrypt-encrypted
            if (!userDTO.getPassword().startsWith("$2a$")) {  // BCrypt prefix
                userDTO.setPassword(passwordEncoder.encode(userDTO.getPassword()));
            }

            userRepository.save(modelMapper.map(userDTO, User.class));
            return VarList.Created;
        } else {
            return VarList.Not_Acceptable;
        }
    }

    @Override
    public int deleteUser(String email) {
        User user = userRepository.findByEmail(email);
        if (user != null) {
            userRepository.delete(user);
            return VarList.OK;
        }
        return VarList.Not_Found;
    }

    @Override
    public List<UserDTO> searchUsers(String query, int limit, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail);
        if (currentUser == null) {
            throw new UsernameNotFoundException("User not found");
        }

        String searchTerm = "%" + query.toLowerCase() + "%";
        return userRepository.searchPublicUsers(
                        searchTerm,
                        currentUser.getUserId(),
                        PageRequest.of(0, limit)
                ).stream()
                .map(user -> modelMapper.map(user, UserDTO.class))
                .collect(Collectors.toList());
    }

    @Transactional
    @Override
    public ReportDTO createReport(ReportRequestDTO reportRequest, String reporterEmail) {
        User reporter = userRepository.findByEmail(reporterEmail);
        if (reporter == null) {
            throw new EntityNotFoundException("User not found");
        }

        User reportedUser = userRepository.findByUserId(reportRequest.getUserId());
        if (reportedUser == null) {
            throw new EntityNotFoundException("User not found");
        }

        Report report = new Report();
        report.setType(Report.ReportType.valueOf(reportRequest.getType()));
        report.setPriority(Report.Priority.valueOf(reportRequest.getPriority()));
        report.setDescription(reportRequest.getDescription());
        report.setReporter(reporter);
        report.setReportedUser(reportedUser);
        report.setStatus(Report.ReportStatus.PENDING);

        Report savedReport = reportRepository.save(report);

        report.setReportId(savedReport.getReportId());

        // Send notification to admins
        userRepository.findByRole(User.Role.ADMIN).forEach(admin -> {
            if (admin.getUserId() != reporter.getUserId() && admin.getUserId() != reportedUser.getUserId()) {
                NotificationDTO notificationDTO = new NotificationDTO();
                notificationDTO.setTitle("New User Report!");
                notificationDTO.setContent(reporter.getFirstName() + " " + reporter.getLastName() + " has reported a user.");
                notificationDTO.setType(Notification.NotificationType.REPORT_UPDATE);
                notificationDTO.setActionUrl("/report-user");
                notificationDTO.setIsRead(false);
                notificationDTO.setUser(modelMapper.map(admin, UserDTO.class));
                notificationDTO.setSourceUser(modelMapper.map(reporter, UserDTO.class));
                notificationDTO.setReport(modelMapper.map(report, ReportDTO.class));

                notificationService.createNotification(notificationDTO);
            }
        });

        return convertToDTO(savedReport);
    }

    @Override
    public List<UserDTO> getAllUsers(String status, String search) {
        List<User> users;

        if (status != null && search != null) {
            users = userRepository.findByStatusAndEmailContainingOrFirstNameContainingOrLastNameContaining(
                    User.Status.valueOf(status.toUpperCase()),
                    search,
                    search,
                    search
            );
        } else if (status != null) {
            users = userRepository.findByStatus(User.Status.valueOf(status.toUpperCase()));
        } else if (search != null) {
            users = userRepository.findByEmailContainingOrFirstNameContainingOrLastNameContaining(
                    search,
                    search,
                    search
            );
        } else {
            users = userRepository.findAll();
        }

        return users.stream()
                .map(user -> modelMapper.map(user, UserDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public void updateUserStatus(int userId, String status) {
        User user = userRepository.findByUserId(userId);
        if (user == null) {
            throw new EntityNotFoundException("User not found");
        }

        user.setStatus(User.Status.valueOf(status.toUpperCase()));
        userRepository.save(user);
    }

    @Override
    public Map<String, Object> getUserStats() {
        Map<String, Object> stats = new HashMap<>();

        // Total users count
        long totalUsers = userRepository.count();
        stats.put("totalUsers", totalUsers);

        // Active users count
        long activeUsers = userRepository.countByStatus(User.Status.ACTIVE);
        stats.put("activeUsers", activeUsers);

        // Suspended users count
        long suspendedUsers = userRepository.countByStatus(User.Status.SUSPENDED);
        stats.put("suspendedUsers", suspendedUsers);

        // Recent users (last 30 days)
        long recentUsers = userRepository.countByCreatedAtAfter(
                LocalDateTime.now().minusDays(30)
        );
        stats.put("recentUsers", recentUsers);

        // Online users
        long onlineUsers = userRepository.countByIsOnlineTrue();
        stats.put("onlineUsers", onlineUsers);

        return stats;
    }

    @Override
    public void updateLastLoginTime(String email) {
        User user = userRepository.findByEmail(email);
        if (user != null) {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        }
    }

    private ReportDTO convertToDTO(Report savedReport) {
        ReportDTO reportDTO = modelMapper.map(savedReport, ReportDTO.class);
        reportDTO.setReporter(modelMapper.map(savedReport.getReporter(), UserDTO.class));
        reportDTO.setReportedUser(modelMapper.map(savedReport.getReportedUser(), UserDTO.class));
        return reportDTO;
    }
}

