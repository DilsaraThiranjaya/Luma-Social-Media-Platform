package lk.ijse.backend.service;

import lk.ijse.backend.dto.DashboardStatsDTO;
import lk.ijse.backend.dto.ReportDTO;
import lk.ijse.backend.dto.UserDTO;

import java.util.List;
import java.util.Map;

public interface AdminService {
    DashboardStatsDTO getDashboardStats();
    Map<String, Object> getUserGrowth(String period);
    Map<String, Object> getUserDemographics();
    List<ReportDTO> getRecentReports();
    List<UserDTO> getNewUsers();
}
