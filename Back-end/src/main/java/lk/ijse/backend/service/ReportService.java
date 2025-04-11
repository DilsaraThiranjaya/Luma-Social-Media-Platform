package lk.ijse.backend.service;

import lk.ijse.backend.dto.ReportDTO;
import java.util.List;
import java.util.Map;

public interface ReportService {
    List<ReportDTO> getAllReports(String status, String search);
    void updateReportStatus(int reportId, String status);
    Map<String, Object> getReportStats();
    ReportDTO getReportById(int reportId);
    void updateResolutionNotes(int reportId, String notes);
}