package lk.ijse.backend.service;

import lk.ijse.backend.dto.AccountSettingsDTO;
import lk.ijse.backend.dto.EducationDTO;
import lk.ijse.backend.dto.UserDTO;
import lk.ijse.backend.dto.WorkExperienceDTO;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface AccountService {
    AccountSettingsDTO getSettings(String email);

    @Transactional
    int updateAccount(UserDTO userDTO, List<EducationDTO> educations,
                       List<WorkExperienceDTO> workExperiences);
}
