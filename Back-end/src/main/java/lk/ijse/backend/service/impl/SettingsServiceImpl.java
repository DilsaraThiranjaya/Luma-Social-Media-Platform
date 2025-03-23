package lk.ijse.backend.service.impl;

import lk.ijse.backend.dto.*;
import lk.ijse.backend.entity.User;
import lk.ijse.backend.repository.UserRepository;
import lk.ijse.backend.service.SettingsService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class SettingsServiceImpl implements SettingsService {
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public int updateAccountSettings(UserDTO userDTO) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            User existingUser = userRepository.findByEmail(userDTO.getEmail());

            // Update only allowed fields
            existingUser.setFirstName(userDTO.getFirstName());
            existingUser.setLastName(userDTO.getLastName());
            existingUser.setBirthday(userDTO.getBirthday());
            existingUser.setGender(userDTO.getGender());
            existingUser.setLocation(userDTO.getLocation());
            existingUser.setPhoneNumber(userDTO.getPhoneNumber());
            existingUser.setBio(userDTO.getBio());

            userRepository.save(existingUser);
            return VarList.Created;
        }
        return VarList.Not_Found;
    }

    @Override
    public int updatePrivacySettings(String email, PrivacySettingsDTO settings) {
        User user = userRepository.findByEmail(email);
        if (user != null) {
            user.setIsProfilePublic(settings.getIsProfilePublic());
            user.setIsDisplayEmail(settings.getIsDisplayEmail());
            user.setIsDisplayPhone(settings.getIsDisplayPhone());
            user.setIsDisplayBirthdate(settings.getIsDisplayBirthdate());
            user.setIsShowActivity(settings.getIsShowActivity());
            user.setIsPostPublic(settings.getIsPostPublic());
            user.setIsShareAllowed(settings.getIsShareAllowed());

            userRepository.save(user);
            return VarList.Created;
        }
        return VarList.Not_Found;
    }

    @Override
    public int updateNotificationSettings(String email, NotificationSettingsDTO settings) {
        User user = userRepository.findByEmail(email);
        if (user != null) {
            user.setIsPushNewFollowers(settings.getIsPushNewFollowers());
            user.setIsPushMessages(settings.getIsPushMessages());
            user.setIsPushPostLikes(settings.getIsPushPostLikes());
            user.setIsPushPostComments(settings.getIsPushPostComments());
            user.setIsPushPostShares(settings.getIsPushPostShares());
            user.setIsPushReports(settings.getIsPushReports());

            userRepository.save(user);
            return VarList.Created;
        }
        return VarList.Not_Found;
    }

    @Override
    public int updatePassword(String email, PasswordUpdateDTO passwordUpdate) {
        User user = userRepository.findByEmail(email);
        if (user != null) {
            if (passwordEncoder.matches(passwordUpdate.getCurrentPassword(), user.getPassword())) {
                user.setPassword(passwordEncoder.encode(passwordUpdate.getNewPassword()));
                userRepository.save(user);
                return VarList.Created;
            }
            return VarList.Not_Acceptable;
        }
        return VarList.Not_Found;
    }

    @Override
    public int toggle2FA(String email, boolean enabled) {
        User user = userRepository.findByEmail(email);
        if (user != null) {
            user.setEnable2fa(enabled);
            userRepository.save(user);
            return VarList.Created;
        }
        return VarList.Not_Found;
    }

    @Override
    public int deactivateAccount(String email) {
        User user = userRepository.findByEmail(email);
        if (user != null) {
            user.setStatus(User.Status.SUSPENDED);
            userRepository.save(user);
            return VarList.Created;
        }
        return VarList.Not_Found;
    }
}