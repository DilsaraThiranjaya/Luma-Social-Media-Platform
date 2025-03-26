package lk.ijse.backend.service;

import lk.ijse.backend.dto.UserDTO;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;

public interface UserService {
    int updateUser(UserDTO userDTO);

    void deleteUser(String email);
    UserDTO searchUser(String email);
    List<UserDTO> getAllUsers();

    UserDTO loadUserDetailsByEmail(String email) throws UsernameNotFoundException;

    int saveUser(UserDTO userDTO);
}
