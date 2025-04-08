package lk.ijse.backend.controller;

import lk.ijse.backend.dto.DashboardStatsDTO;
import lk.ijse.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/v1/dashboard")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin("*")
public class DashboardController {
    private final AdminService adminService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(value = "/stats", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        log.info("Fetching dashboard statistics");
        DashboardStatsDTO stats = adminService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(value = "/user-growth", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getUserGrowth(@RequestParam String period) {
        log.info("Fetching user growth data for period: {}", period);
        return ResponseEntity.ok(adminService.getUserGrowth(period));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(value = "/user-demographics", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getUserDemographics() {
        log.info("Fetching user demographics data");
        return ResponseEntity.ok(adminService.getUserDemographics());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(value = "/recent-reports", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getRecentReports() {
        log.info("Fetching recent reports");
        return ResponseEntity.ok(adminService.getRecentReports());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(value = "/new-users", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getNewUsers() {
        log.info("Fetching new users");
        return ResponseEntity.ok(adminService.getNewUsers());
    }
}