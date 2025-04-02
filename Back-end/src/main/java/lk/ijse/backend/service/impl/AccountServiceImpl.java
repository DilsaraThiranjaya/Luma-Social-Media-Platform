package lk.ijse.backend.service.impl;

import lk.ijse.backend.dto.*;
import lk.ijse.backend.entity.Education;
import lk.ijse.backend.entity.User;
import lk.ijse.backend.entity.WorkExperience;
import lk.ijse.backend.repository.EducationRepository;
import lk.ijse.backend.repository.UserRepository;
import lk.ijse.backend.repository.WorkExperienceRepository;
import lk.ijse.backend.service.AccountService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {
    private final UserRepository userRepository;
    private final EducationRepository educationRepository;
    private final WorkExperienceRepository workExperienceRepository;
    private final ModelMapper modelMapper;

    @Override
    public ProfileInfoDTO getProfileInfo(String email) {
        User user = userRepository.findByEmail(email);

        if (user != null) {
            ProfileInfoDTO responseDTO = modelMapper.map(user, ProfileInfoDTO.class);

            // Load education entries
            List<Education> educations = educationRepository.findByUser(user);
            responseDTO.setEducation(
                    educations.stream()
                            .map(edu -> modelMapper.map(edu, EducationDTO.class))
                            .collect(Collectors.toList())
            );

            // Load work experience entries
            List<WorkExperience> works = workExperienceRepository.findByUser(user);
            responseDTO.setWorkExperience(
                    works.stream()
                            .map(work -> modelMapper.map(work, WorkExperienceDTO.class))
                            .collect(Collectors.toList())
            );

            return responseDTO;
        }
        return null;
    }

    @Override
    public AccountSettingsDTO getSettings(String email) {
        User user = userRepository.findByEmail(email);

        if (user != null) {
            AccountSettingsDTO responseDTO = modelMapper.map(user, AccountSettingsDTO.class);

            // Load education entries
            List<Education> educations = educationRepository.findByUser(user);
            responseDTO.setEducation(
                    educations.stream()
                            .map(edu -> modelMapper.map(edu, EducationDTO.class))
                            .collect(Collectors.toList())
            );

            // Load work experience entries
            List<WorkExperience> works = workExperienceRepository.findByUser(user);
            responseDTO.setWorkExperience(
                    works.stream()
                            .map(work -> modelMapper.map(work, WorkExperienceDTO.class))
                            .collect(Collectors.toList())
            );

            return responseDTO;
        }
        return null;
    }

    @Transactional
    @Override
    public int updateAccount(UserDTO userDTO, List<EducationDTO> educations,
                             List<WorkExperienceDTO> workExperiences) {
        try {
            // 1. Update user
            User updatedUser = userRepository.save(modelMapper.map(userDTO, User.class));

            // 2. Update education (delete existing + create new)
            educationRepository.deleteByUser(updatedUser);
            List<Education> newEducations = educations.stream()
                    .map(dto -> convertToEducation(dto, updatedUser))
                    .collect(Collectors.toList());
            educationRepository.saveAll(newEducations);

            // 3. Update work experience (delete existing + create new)
            workExperienceRepository.deleteByUser(updatedUser);
            List<WorkExperience> newWorks = workExperiences.stream()
                    .map(dto -> convertToWork(dto, updatedUser))
                    .collect(Collectors.toList());
            workExperienceRepository.saveAll(newWorks);
            return VarList.OK;
        } catch (Exception e) {
            return VarList.Conflict;
        }
    }

    @Override
    public ProfileInfoDTO getUserProfileInfo(int userId) {
        User user = userRepository.findByUserId(userId);

        if (user != null) {
            ProfileInfoDTO responseDTO = modelMapper.map(user, ProfileInfoDTO.class);

            // Load education entries
            List<Education> educations = educationRepository.findByUser(user);
            responseDTO.setEducation(
                    educations.stream()
                            .map(edu -> modelMapper.map(edu, EducationDTO.class))
                            .collect(Collectors.toList())
            );

            // Load work experience entries
            List<WorkExperience> works = workExperienceRepository.findByUser(user);
            responseDTO.setWorkExperience(
                    works.stream()
                            .map(work -> modelMapper.map(work, WorkExperienceDTO.class))
                            .collect(Collectors.toList())
            );

            return responseDTO;
        }
        return null;
    }

    private Education convertToEducation(EducationDTO dto, User user) {
        Education education = modelMapper.map(dto, Education.class);
        education.setUser(user); // Manual relationship setting
        return education;
    }

    private WorkExperience convertToWork(WorkExperienceDTO dto, User user) {
        WorkExperience work = modelMapper.map(dto, WorkExperience.class);
        work.setUser(user); // Manual relationship setting
        return work;
    }
}
