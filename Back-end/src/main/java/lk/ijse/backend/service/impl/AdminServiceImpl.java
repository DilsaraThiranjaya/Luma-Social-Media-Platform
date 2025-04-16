package lk.ijse.backend.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lk.ijse.backend.dto.*;
import lk.ijse.backend.entity.*;
import lk.ijse.backend.repository.*;
import lk.ijse.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ReportRepository reportRepository;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;
    private final AdminActionRepository adminActionRepository;
    private final ModelMapper modelMapper;

    @Override
    public DashboardStatsDTO getDashboardStats() {
        // Get current counts
        long totalUsers = userRepository.count();
        long totalPosts = postRepository.count();
        long activeReports = reportRepository.countByStatus(Report.ReportStatus.PENDING);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysAgo = now.minusDays(30);
        LocalDateTime sixtyDaysAgo = now.minusDays(60);

        // Current period counts (last 30 days)
        long currentUsers = userRepository.countByCreatedAtBetween(thirtyDaysAgo, now);
        long currentPosts = postRepository.countByCreatedAtBetween(thirtyDaysAgo, now);
        long currentReports = reportRepository.countByCreatedAtBetween(thirtyDaysAgo, now);

        // Previous period counts (30-60 days ago)
        long previousUsers = userRepository.countByCreatedAtBetween(sixtyDaysAgo, thirtyDaysAgo);
        long previousPosts = postRepository.countByCreatedAtBetween(sixtyDaysAgo, thirtyDaysAgo);
        long previousReports = reportRepository.countByCreatedAtBetween(sixtyDaysAgo, thirtyDaysAgo);

        // Calculate growth rates
        double userGrowthRate = calculateGrowthRate(previousUsers, currentUsers);
        double postGrowthRate = calculateGrowthRate(previousPosts, currentPosts);
        double reportGrowthRate = calculateGrowthRate(previousReports, currentReports);

        // Report decrease rate is negative of growth rate (if reports decreased)
        double reportDecreaseRate = -reportGrowthRate;

        // User activity (active users in last 30 days)
        long activeUsers = userRepository.countActiveUsersSince(thirtyDaysAgo);
        double userActivity = totalUsers > 0 ? (activeUsers / (double) totalUsers) * 100 : 0;

        // Activity growth rate (current vs previous period)
        long currentActivity = reactionRepository.countByCreatedAtBetween(thirtyDaysAgo, now)
                + commentRepository.countByCreatedAtBetween(thirtyDaysAgo, now);
        long previousActivity = reactionRepository.countByCreatedAtBetween(sixtyDaysAgo, thirtyDaysAgo)
                + commentRepository.countByCreatedAtBetween(sixtyDaysAgo, thirtyDaysAgo);
        double activityGrowthRate = calculateGrowthRate(previousActivity, currentActivity);

        return DashboardStatsDTO.builder()
                .totalUsers(totalUsers)
                .totalPosts(totalPosts)
                .activeReports(activeReports)
                .userActivity(userActivity)
                .userGrowthRate(userGrowthRate)
                .postGrowthRate(postGrowthRate)
                .reportDecreaseRate(reportDecreaseRate)
                .activityGrowthRate(activityGrowthRate)
                .build();
    }

    @Override
    public Map<String, Object> getUserGrowth(String period) {
        LocalDateTime startDate;
        LocalDateTime now = LocalDateTime.now();
        List<String> labels;
        List<Long> data;

        switch (period.toLowerCase()) {
            case "weekly":
                startDate = now.minusWeeks(1);
                labels = getDayLabels(7);
                data = getUserCountsByDay(startDate);
                break;
            case "monthly":
                startDate = now.minusMonths(6);
                labels = getMonthLabels(6);
                data = getUserCountsByMonth(startDate);
                break;
            case "yearly":
                startDate = now.minusYears(5);
                labels = getYearLabels(6);
                data = getUserCountsByYear(startDate);
                break;
            default:
                throw new IllegalArgumentException("Invalid period: " + period);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("labels", labels);
        result.put("data", data);
        return result;
    }

    @Override
    public Map<String, Object> getUserDemographics() {
        List<String> labels = Arrays.asList("18-24", "25-34", "35-44", "45+");
        List<Long> data = new ArrayList<>();

        LocalDate now = LocalDate.now();
        data.add(userRepository.countByBirthdayBetween(
                now.minusYears(24), now.minusYears(18)));
        data.add(userRepository.countByBirthdayBetween(
                now.minusYears(34), now.minusYears(25)));
        data.add(userRepository.countByBirthdayBetween(
                now.minusYears(44), now.minusYears(35)));
        data.add(userRepository.countByBirthdayBefore(now.minusYears(45)));

        Map<String, Object> result = new HashMap<>();
        result.put("labels", labels);
        result.put("data", data);
        return result;
    }

    @Override
    public List<ReportDTO> getRecentReports() {
        return reportRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(report -> convertToDTO(report))
                .collect(Collectors.toList());
    }

    @Override
    public List<UserDTO> getNewUsers() {
        return userRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(user -> modelMapper.map(user, UserDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public void createAdminAction(Integer adminId, AdminAction.ActionType actionType,
                                  Integer targetUserId, Integer targetPostId, Integer targetItemId) {

        User admin = userRepository.findByUserId(adminId);
        if (admin == null) {
            throw new EntityNotFoundException("Admin user not found: " + adminId);
        }
        if (admin.getRole() != User.Role.ADMIN) {
            throw new IllegalArgumentException("User with id " + adminId + " is not authorized as an admin");
        }

        // Determine and validate targets based on action type
        User targetUser = null;
        Post targetPost = null;
        MarketplaceItem targetItem = null;

        String description = null;

        switch (actionType) {
            case USER_BAN:
                validateTargets(actionType, targetUserId, targetPostId, targetItemId);
                targetUser = userRepository.findByUserId(targetUserId);
                description = "User " + targetUser.getFirstName() + " " + targetUser.getLastName() + " has been banned.";
                if (targetUser == null) {
                    throw new EntityNotFoundException("Target user not found: " + targetUserId);
                }
                break;
            case USER_UNBAN:
                validateTargets(actionType, targetUserId, targetPostId, targetItemId);
                targetUser = userRepository.findByUserId(targetUserId);
                description = "User " + targetUser.getFirstName() + " " + targetUser.getLastName() + " has been unbanned.";
                if (targetUser == null) {
                    throw new EntityNotFoundException("Target user not found: " + targetUserId);
                }
                break;
            case POST_BAN:
                validateTargets(actionType, targetUserId, targetPostId, targetItemId);
                targetPost = postRepository.findById(targetPostId)
                        .orElseThrow(() -> new EntityNotFoundException("Target post not found: " + targetPostId));
                description = "Post " + targetPost.getPostId() + " has been banned.";
                break;
            case POST_UNBAN:
                validateTargets(actionType, targetUserId, targetPostId, targetItemId);
                targetPost = postRepository.findById(targetPostId)
                        .orElseThrow(() -> new EntityNotFoundException("Target post not found: " + targetPostId));
                description = "Post " + targetPost.getPostId() + " has been unbanned.";
                break;
            case POST_REMOVE:
                validateTargets(actionType, targetUserId, targetPostId, targetItemId);
                targetPost = postRepository.findById(targetPostId)
                        .orElseThrow(() -> new EntityNotFoundException("Target post not found: " + targetPostId));
                description = "Post " + targetPost.getPostId() + " has been removed.";
                break;
            case ITEM_REMOVE:
//                validateTargets(actionType, targetUserId, targetPostId, targetItemId);
//                targetItem = marketplaceItemRepository.findById(targetItemId)
//                        .orElseThrow(() -> new EntityNotFoundException("Target item not found: " + targetItemId));
                break;
            case REPORT_ESCALATION:
                validateReportTargets(targetUserId, targetPostId, targetItemId);
                if (targetUserId != null) {
                    targetUser = userRepository.findByUserId(targetUserId);
                    if (targetUser == null) {
                        throw new EntityNotFoundException("Target user not found");
                    }
                    description = "User " + targetUser.getFirstName() + " " + targetUser.getLastName() + " report has been escalated.";
                } else {
                    targetPost = postRepository.findById(targetPostId).orElseThrow(() -> new EntityNotFoundException("Target post not found"));
                    description = "Post " + targetPost.getPostId() + " report has been escalated.";
                }
                break;
            case REPORT_RESOLUTION:
                validateReportTargets(targetUserId, targetPostId, targetItemId);
                if (targetUserId != null) {
                    targetUser = userRepository.findByUserId(targetUserId);
                    if (targetUser == null) {
                        throw new EntityNotFoundException("Target user not found");
                    }
                    description = "User " + targetUser.getFirstName() + " " + targetUser.getLastName() + " report has been resolved.";
                } else {
                    targetPost = postRepository.findById(targetPostId).orElseThrow(() -> new EntityNotFoundException("Target post not found"));
                    description = "Post " + targetPost.getPostId() + " report has been resolved.";
                }
                break;
            default:
                throw new IllegalArgumentException("Unsupported action type: " + actionType);
        }

        // Build and save the admin action
        AdminAction adminAction = AdminAction.builder()
                .actionType(actionType)
                .description(description)
                .admin(admin)
                .targetUser(targetUser)
                .targetPost(targetPost)
                .targetItem(targetItem)
                .build();

        adminActionRepository.save(adminAction);
    }

    @Override
    public List<AdminActionDTO> getAllAdminActions() {
        List<AdminAction> performedAt = adminActionRepository.findAll(Sort.by(Sort.Direction.DESC, "performedAt"));
        return convertToDTO(performedAt);
    }

    private List<AdminActionDTO> convertToDTO(List<AdminAction> performedAt) {
        List<AdminActionDTO> adminActionDTOS = new ArrayList<>();

        for (AdminAction adminAction : performedAt) {
            AdminActionDTO adminActionDTO = new AdminActionDTO();
            adminActionDTO.setActionId(adminAction.getActionId());
            adminActionDTO.setActionType(adminAction.getActionType());
            adminActionDTO.setDescription(adminAction.getDescription());
            adminActionDTO.setPerformedAt(adminAction.getPerformedAt().toString());

            UserDTO admin = new UserDTO();
            admin.setUserId(adminAction.getAdmin().getUserId());
            admin.setFirstName(adminAction.getAdmin().getFirstName());
            admin.setLastName(adminAction.getAdmin().getLastName());
            admin.setProfilePictureUrl(adminAction.getAdmin().getProfilePictureUrl());
            adminActionDTO.setAdmin(admin);

            if (adminAction.getTargetUser() != null) {
                UserDTO targetUser = new UserDTO();
                targetUser.setUserId(adminAction.getTargetUser().getUserId());
                targetUser.setFirstName(adminAction.getTargetUser().getFirstName());
                targetUser.setLastName(adminAction.getTargetUser().getLastName());
                targetUser.setProfilePictureUrl(adminAction.getTargetUser().getProfilePictureUrl());
                adminActionDTO.setTargetUser(targetUser);
            }

            if (adminAction.getTargetPost() != null) {
                PostDTO targetPost = new PostDTO();
                targetPost.setPostId(adminAction.getTargetPost().getPostId());
                adminActionDTO.setTargetPost(targetPost);
            }

            adminActionDTOS.add(adminActionDTO);
        }

        return adminActionDTOS;
    }

    private void validateTargets(AdminAction.ActionType actionType, Integer targetUserId, Integer targetPostId, Integer targetItemId) {
        switch (actionType) {
            case USER_BAN:
            case USER_UNBAN:
                if (targetUserId == null)
                    throw new IllegalArgumentException("Target user ID is required for USER_BAN");
                if (targetPostId != null || targetItemId != null)
                    throw new IllegalArgumentException("USER_BAN must specify only a user target");
                break;
            case POST_BAN:
            case POST_UNBAN:
            case POST_REMOVE:
                if (targetPostId == null)
                    throw new IllegalArgumentException("Target post ID is required for " + actionType);
                if (targetUserId != null || targetItemId != null)
                    throw new IllegalArgumentException(actionType + " must specify only a post target");
                break;
            case ITEM_REMOVE:
                if (targetItemId == null)
                    throw new IllegalArgumentException("Target item ID is required for ITEM_REMOVE");
                if (targetUserId != null || targetPostId != null)
                    throw new IllegalArgumentException("ITEM_REMOVE must specify only an item target");
                break;
        }
    }

    private void validateReportTargets(Integer targetUserId, Integer targetPostId, Integer targetItemId) {
        int targetCount = 0;
        if (targetUserId != null) targetCount++;
        if (targetPostId != null) targetCount++;
        if (targetItemId != null) targetCount++;

        if (targetCount != 1) {
            throw new IllegalArgumentException("Report actions require exactly one target (user, post, or item)");
        }
    }

    private double calculateGrowthRate(long previous, long current) {
        if (previous == 0) return 100.0;
        return ((double) (current - previous) / previous) * 100;
    }

    private double calculateActivityGrowthRate(LocalDateTime since) {
        long previousPeriodActivity = reactionRepository.countCreatedBefore(since) +
                commentRepository.countCreatedBefore(since);
        long currentPeriodActivity = reactionRepository.count() +
                commentRepository.count();
        return calculateGrowthRate(previousPeriodActivity, currentPeriodActivity);
    }

    private List<String> getDayLabels(int days) {
        List<String> labels = new ArrayList<>();
        LocalDate date = LocalDate.now();
        for (int i = days - 1; i >= 0; i--) {
            labels.add(date.minusDays(i).getDayOfWeek().toString().substring(0, 3));
        }
        return labels;
    }

    private List<String> getMonthLabels(int months) {
        List<String> labels = new ArrayList<>();
        LocalDate date = LocalDate.now();
        for (int i = months - 1; i >= 0; i--) {
            labels.add(date.minusMonths(i).getMonth().toString().substring(0, 3));
        }
        return labels;
    }

    private List<String> getYearLabels(int years) {
        List<String> labels = new ArrayList<>();
        LocalDate date = LocalDate.now();
        for (int i = years - 1; i >= 0; i--) {
            labels.add(String.valueOf(date.minusYears(i).getYear()));
        }
        return labels;
    }

    private List<Long> getUserCountsByDay(LocalDateTime startDate) {
        List<Long> counts = new ArrayList<>();
        LocalDateTime date = startDate;
        while (!date.isAfter(LocalDateTime.now())) {
            counts.add(userRepository.countByCreatedAtBetween(
                    date, date.plusDays(1)));
            date = date.plusDays(1);
        }
        return counts;
    }

    private List<Long> getUserCountsByMonth(LocalDateTime startDate) {
        List<Long> counts = new ArrayList<>();
        LocalDateTime date = startDate;
        while (!date.isAfter(LocalDateTime.now())) {
            counts.add(userRepository.countByCreatedAtBetween(
                    date, date.plusMonths(1)));
            date = date.plusMonths(1);
        }
        return counts;
    }

    private List<Long> getUserCountsByYear(LocalDateTime startDate) {
        List<Long> counts = new ArrayList<>();
        LocalDateTime date = startDate;
        while (!date.isAfter(LocalDateTime.now())) {
            counts.add(userRepository.countByCreatedAtBetween(
                    date, date.plusYears(1)));
            date = date.plusYears(1);
        }
        return counts;
    }

    private ReportDTO convertToDTO(Report report) {
        ReportDTO reportDTO = modelMapper.map(report, ReportDTO.class);
        reportDTO.setReporter(modelMapper.map(report.getReporter(), UserDTO.class));

        if (report.getReportedUser() != null) {
            UserDTO reportedUser = new UserDTO();
            reportedUser.setUserId(report.getReportedUser().getUserId());
            reportDTO.setReportedUser(reportedUser);
        }

        if (report.getReportedPost() != null) {
            PostDTO reportedPost = new PostDTO();
            reportedPost.setPostId(report.getReportedPost().getPostId());
            reportDTO.setReportedPost(reportedPost);
        }

        return reportDTO;
    }
}
