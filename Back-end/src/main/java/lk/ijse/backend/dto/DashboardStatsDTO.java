package lk.ijse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDTO {
    private long totalUsers;
    private long totalPosts;
    private long activeReports;
    private double userActivity;
    private double userGrowthRate;
    private double postGrowthRate;
    private double reportDecreaseRate;
    private double activityGrowthRate;
}