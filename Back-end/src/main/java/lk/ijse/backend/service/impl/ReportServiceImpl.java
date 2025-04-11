package lk.ijse.backend.service.impl;

import lk.ijse.backend.dto.PostDTO;
import lk.ijse.backend.dto.ReportDTO;
import lk.ijse.backend.dto.UserDTO;
import lk.ijse.backend.entity.Report;
import lk.ijse.backend.repository.ReportRepository;
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
                .map(report -> convertToDTO(report))
                .collect(Collectors.toList());
    }

    @Override
    public void updateReportStatus(int reportId, String status) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        Report.ReportStatus newStatus = Report.ReportStatus.valueOf(status.toUpperCase());
        report.setStatus(newStatus);

        if (newStatus == Report.ReportStatus.RESOLVED) {
            report.setResolvedAt(LocalDateTime.now());
        }

        reportRepository.save(report);
    }

    @Override
    public Map<String, Object> getReportStats() {
        Map<String, Object> stats = new HashMap<>();

        // Total reports
        long totalReports = reportRepository.count();
        stats.put("totalReports", totalReports);

        // Reports by status
        long pendingReports = reportRepository.countByStatus(Report.ReportStatus.PENDING);
        stats.put("pendingReports", pendingReports);

        long resolvedReports = reportRepository.countByStatus(Report.ReportStatus.RESOLVED);
        stats.put("resolvedReports", resolvedReports);

        long escalatedReports = reportRepository.countByStatus(Report.ReportStatus.ESCALATED);
        stats.put("escalatedReports", escalatedReports);

        // Reports by type
        long spamReports = reportRepository.countByType(Report.ReportType.SPAM);
        stats.put("spamReports", spamReports);

        long harassmentReports = reportRepository.countByType(Report.ReportType.HARASSMENT);
        stats.put("harassmentReports", harassmentReports);

        long inappropriateReports = reportRepository.countByType(Report.ReportType.INAPPROPRIATE);
        stats.put("inappropriateReports", inappropriateReports);

        long otherReports = reportRepository.countByType(Report.ReportType.OTHER);
        stats.put("otherReports", otherReports);

        // Recent reports (last 24 hours)
        long recentReports = reportRepository.countByCreatedAtAfter(
                LocalDateTime.now().minusHours(24)
        );
        stats.put("recentReports", recentReports);

        return stats;
    }

    @Override
    public ReportDTO getReportById(int reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        return modelMapper.map(report, ReportDTO.class);
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
        reportDTO.setReporter(modelMapper.map(report.getReporter(), UserDTO.class));
        reportDTO.setReportedUser(modelMapper.map(report.getReportedUser(), UserDTO.class));
        reportDTO.setReportedPost(modelMapper.map(report.getReportedPost(), PostDTO.class));
        reportDTO.setResolvedBy(modelMapper.map(report.getResolvedBy(), UserDTO.class));
        reportDTO.setResolutionNotes(report.getResolutionNotes());
        return reportDTO;
    }
}