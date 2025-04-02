package lk.ijse.backend.service;

import lk.ijse.backend.dto.UserDTO;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;

public interface UserService {
    int updateUser(UserDTO userDTO);

    int deleteUser(String email);

    UserDTO loadUserDetailsByEmail(String email) throws UsernameNotFoundException;

    int saveUser(UserDTO userDTO);

    List<UserDTO> searchUsers(String query, int limit, String currentUserEmail);
}
