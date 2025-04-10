package lk.ijse.backend.service;

import lk.ijse.backend.dto.ReportDTO;
import lk.ijse.backend.dto.ReportRequestDTO;
import lk.ijse.backend.dto.UserDTO;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;
import java.util.Map;

public interface UserService {
    int updateUser(UserDTO userDTO);
    int deleteUser(String email);
    UserDTO loadUserDetailsByEmail(String email) throws UsernameNotFoundException;
    int saveUser(UserDTO userDTO);
    List<UserDTO> searchUsers(String query, int limit, String currentUserEmail);
    ReportDTO createReport(ReportRequestDTO reportRequest, String reporterEmail);

    List<UserDTO> getAllUsers(String status, String search);

    void updateUserStatus(int userId, String status);

    Map<String, Object> getUserStats();
}
