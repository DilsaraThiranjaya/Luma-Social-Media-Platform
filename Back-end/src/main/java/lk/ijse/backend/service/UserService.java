package lk.ijse.backend.service;

import lk.ijse.backend.dto.UserDTO;

import java.util.List;

public interface UserService {
    UserDTO updateUser(String email, UserDTO userDTO);
    void deleteUser(String email);
    UserDTO searchUser(String email);
    List<UserDTO> getAllUsers();
    int saveUser(UserDTO userDTO);
}
