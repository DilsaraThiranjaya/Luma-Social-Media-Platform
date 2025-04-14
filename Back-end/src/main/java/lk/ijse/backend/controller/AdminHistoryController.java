package lk.ijse.backend.controller;

import lk.ijse.backend.dto.AdminActionDTO;
import lk.ijse.backend.dto.ResponseDTO;
import lk.ijse.backend.entity.AdminAction;
import lk.ijse.backend.service.AdminService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("api/v1/admin-actions")
@RequiredArgsConstructor
@Slf4j
public class AdminHistoryController {
    private final AdminService adminService;
    private final ModelMapper modelMapper;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<ResponseDTO> getAllAdminActions() {
        log.info("Getting all admin actions");
        try {
            List<AdminAction> actions = adminService.getAllAdminActions();
            List<AdminActionDTO> dtos = actions.stream()
                    .map(action -> modelMapper.map(action, AdminActionDTO.class))
                    .collect(Collectors.toList());

            log.info("Successfully retrieved all admin actions");
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Success", dtos));
        } catch (Exception e) {
            log.error("Error retrieving actions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error retrieving actions", null));
        }
    }
}