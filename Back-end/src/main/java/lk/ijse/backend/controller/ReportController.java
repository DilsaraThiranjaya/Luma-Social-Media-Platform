package lk.ijse.backend.controller;

import lk.ijse.backend.dto.ReportDTO;
import lk.ijse.backend.dto.ResponseDTO;
import lk.ijse.backend.dto.UserDTO;
import lk.ijse.backend.entity.AdminAction;
import lk.ijse.backend.service.AdminService;
import lk.ijse.backend.service.ReportService;
import lk.ijse.backend.service.UserService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/v1/reports")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin("*")
public class ReportController {
    private final ReportService reportService;
    private final UserService userService;
    private final AdminService adminService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> getAllReports(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search
    ) {
        log.info("Fetching reports with status: {}, search: {}", status, search);
        try {
            List<ReportDTO> reports = reportService.getAllReports(status, search);

            log.info("Fetched {} reports", reports.size());
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Reports Retrieved Successfully!", reports));
        } catch (Exception e) {
            log.error("Error fetching reports: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{reportId}/status")
    public ResponseEntity<ResponseDTO> updateReportStatus(
            @PathVariable int reportId,
            @RequestParam String status,
            Authentication authentication
    ) {
        log.info("Updating report status for report ID: {}", reportId);
        try {
            String email = authentication.getName();
            UserDTO user = userService.loadUserDetailsByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ResponseDTO(VarList.Unauthorized, "Unauthorized", null));
            }

            ReportDTO reportDTO = reportService.getReportById(reportId);
            if (reportDTO == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ResponseDTO(VarList.Not_Found, "Report not found", null));
            }

            if (status.equals("RESOLVED")) {
                if (reportDTO.getReportedPost() != null) {
                    adminService.createAdminAction(user.getUserId(), AdminAction.ActionType.REPORT_RESOLUTION, null, reportDTO.getReportedPost().getPostId(), null);
                } else {
                    adminService.createAdminAction(user.getUserId(), AdminAction.ActionType.REPORT_RESOLUTION, reportDTO.getReportedUser().getUserId(), null, null);
                }
            } else {
                if (reportDTO.getReportedPost() != null) {
                    adminService.createAdminAction(user.getUserId(), AdminAction.ActionType.REPORT_ESCALATION, null, reportDTO.getReportedPost().getPostId(), null);
                } else {
                    adminService.createAdminAction(user.getUserId(), AdminAction.ActionType.REPORT_ESCALATION, reportDTO.getReportedUser().getUserId(), null, null);
                }
            }

            reportService.updateReportStatus(reportId, status, email);

            log.info("Report status updated for report ID: {}", reportId);
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Report Status Updated Successfully!", null));
        } catch (Exception e) {
            log.error("Error updating report status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/stats")
    public ResponseEntity<ResponseDTO> getReportStats() {
        log.info("Fetching report stats");
        try {
            Map<String, Object> stats = reportService.getReportStats();

            log.info("Fetched report stats: {}", stats);
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Report Stats Retrieved Successfully!", stats));
        } catch (Exception e) {
            log.error("Error fetching report stats: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{reportId}")
    public ResponseEntity<ResponseDTO> getReportById(@PathVariable int reportId) {
        log.info("Fetching report with ID: {}", reportId);
        try {
            ReportDTO report = reportService.getReportById(reportId);

            log.info("Fetched report with ID: {}", reportId);
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Report Retrieved Successfully!", report));
        } catch (Exception e) {
            log.error("Error fetching report: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{reportId}/notes")
    public ResponseEntity<ResponseDTO> updateResolutionNotes(
            @PathVariable int reportId,
            @RequestBody String notes
    ) {
        log.info("Updating resolution notes for report ID: {}", reportId);
        try {
            reportService.updateResolutionNotes(reportId, notes);

            log.info("Resolution notes updated for report ID: {}", reportId);
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Resolution Notes Updated Successfully!", null));
        } catch (Exception e) {
            log.error("Error updating resolution notes: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }
}