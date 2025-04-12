package lk.ijse.backend.service.impl;

import lk.ijse.backend.dto.PostDTO;
import lk.ijse.backend.dto.ReportDTO;
import lk.ijse.backend.dto.UserDTO;
import lk.ijse.backend.entity.Post;
import lk.ijse.backend.entity.Report;
import lk.ijse.backend.entity.User;
import lk.ijse.backend.repository.ReportRepository;
import lk.ijse.backend.repository.UserRepository;
import lk.ijse.backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {
    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    public List<ReportDTO> getAllReports(String status, String search) {
        List<Report> reports;

        if (status != null) {
            reports = reportRepository.findByStatus(Report.ReportStatus.valueOf(status.toUpperCase()));
        } else if (search != null) {
            reports = reportRepository.findByDescriptionContaining(search);
        } else {
            reports = reportRepository.findAll();
        }

        return reports.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void updateReportStatus(int reportId, String status, String email) {
        User user = userRepository.findByEmail(email);

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        Report.ReportStatus newStatus = Report.ReportStatus.valueOf(status.toUpperCase());
        report.setStatus(newStatus);

        if (newStatus == Report.ReportStatus.RESOLVED) {
            report.setResolvedBy(user);
            report.setResolvedAt(LocalDateTime.now());
        }

        reportRepository.save(report);
    }

    @Override
    public Map<String, Object> getReportStats() {
        Map<String, Object> stats = new HashMap<>();

        // Add type distribution
        Map<String, Long> typeDistribution = new HashMap<>();
        typeDistribution.put("SPAM", reportRepository.countByType(Report.ReportType.SPAM));
        typeDistribution.put("HARASSMENT", reportRepository.countByType(Report.ReportType.HARASSMENT));
        typeDistribution.put("INAPPROPRIATE", reportRepository.countByType(Report.ReportType.INAPPROPRIATE));
        typeDistribution.put("OTHER", reportRepository.countByType(Report.ReportType.OTHER));
        stats.put("typeDistribution", typeDistribution);

        // Add other stats
        stats.put("totalReports", reportRepository.count());
        stats.put("pendingReports", reportRepository.countByStatus(Report.ReportStatus.PENDING));
        stats.put("resolvedReports", reportRepository.countByStatus(Report.ReportStatus.RESOLVED));
        stats.put("escalatedReports", reportRepository.countByStatus(Report.ReportStatus.ESCALATED));

        return stats;
    }

    @Override
    public ReportDTO getReportById(int reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        return convertToDTO(report);
    }

    @Override
    public void updateResolutionNotes(int reportId, String notes) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        report.setResolutionNotes(notes);
        reportRepository.save(report);
    }

    private ReportDTO convertToDTO(Report report) {
        ReportDTO reportDTO = new ReportDTO();
        reportDTO.setReportId(report.getReportId());
        reportDTO.setType(report.getType());
        reportDTO.setPriority(report.getPriority());
        reportDTO.setDescription(report.getDescription());
        reportDTO.setStatus(report.getStatus());
        reportDTO.setResolvedAt(report.getResolvedAt());
        reportDTO.setCreatedAt(report.getCreatedAt());
        reportDTO.setReporter(convertToBasicUserDTO(report.getReporter()));

        if (report.getReportedUser() != null) {
            reportDTO.setReportedUser(convertToBasicUserDTO(report.getReportedUser()));
        }
        if (report.getReportedPost() != null) {
            reportDTO.setReportedPost(convertToBasicPostDTO(report.getReportedPost()));
        }
        if (report.getResolvedBy() != null) {
            reportDTO.setResolvedBy(convertToBasicUserDTO(report.getResolvedBy()));
        }

        reportDTO.setResolutionNotes(report.getResolutionNotes());

        return reportDTO;
    }

    private UserDTO convertToBasicUserDTO(User user) {
        if (user == null) return null;

        return UserDTO.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .profilePictureUrl(user.getProfilePictureUrl())
                .build();
    }

    private PostDTO convertToBasicPostDTO(Post post) {
        if (post == null) return null;

        return PostDTO.builder()
                .postId(post.getPostId())
                .content(post.getContent())
                .user(convertToBasicUserDTO(post.getUser()))
                .build();
    }
}