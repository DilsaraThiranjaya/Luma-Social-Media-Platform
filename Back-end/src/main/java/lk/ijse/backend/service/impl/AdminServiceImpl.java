package lk.ijse.backend.service.impl;

import lk.ijse.backend.dto.DashboardStatsDTO;
import lk.ijse.backend.dto.PostDTO;
import lk.ijse.backend.dto.ReportDTO;
import lk.ijse.backend.dto.UserDTO;
import lk.ijse.backend.entity.Report;
import lk.ijse.backend.repository.*;
import lk.ijse.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
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
