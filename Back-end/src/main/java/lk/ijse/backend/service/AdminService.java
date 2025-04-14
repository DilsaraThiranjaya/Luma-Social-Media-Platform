package lk.ijse.backend.service;

import lk.ijse.backend.dto.DashboardStatsDTO;
import lk.ijse.backend.dto.ReportDTO;
import lk.ijse.backend.dto.UserDTO;
import lk.ijse.backend.entity.AdminAction;

import java.util.List;
import java.util.Map;

public interface AdminService {
    DashboardStatsDTO getDashboardStats();
    Map<String, Object> getUserGrowth(String period);
    Map<String, Object> getUserDemographics();
    List<ReportDTO> getRecentReports();
    List<UserDTO> getNewUsers();
    void createAdminAction(Integer adminId, AdminAction.ActionType actionType,
                           Integer targetUserId, Integer targetPostId, Integer targetItemId);
    List<AdminAction> getAllAdminActions();
}
