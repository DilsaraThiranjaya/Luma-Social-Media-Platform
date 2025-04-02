package lk.ijse.backend.service;

import lk.ijse.backend.dto.*;

import java.util.List;

public interface AccountService {
    AccountSettingsDTO getSettings(String email);
    ProfileInfoDTO getProfileInfo(String email);
    int updateAccount(UserDTO userDTO, List<EducationDTO> educations, List<WorkExperienceDTO> workExperiences);

    ProfileInfoDTO getUserProfileInfo(int userId, String email);
}
