package lk.ijse.backend.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lk.ijse.backend.dto.ReportDTO;
import lk.ijse.backend.dto.ReportRequestDTO;
import lk.ijse.backend.dto.UserDTO;
import lk.ijse.backend.entity.Post;
import lk.ijse.backend.entity.Report;
import lk.ijse.backend.entity.User;
import lk.ijse.backend.repository.ReportRepository;
import lk.ijse.backend.repository.UserRepository;
import lk.ijse.backend.service.UserService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;


@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserDetailsService, UserService {
    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final ModelMapper modelMapper;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email);

        if (user != null) {
            return new org.springframework.security.core.userdetails.User(
                    user.getEmail(),
                    user.getPassword(),
                    Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
            );
        }
        return null;
    }

    @Override
    public UserDTO loadUserDetailsByEmail(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email);
        if (user != null) {
            return modelMapper.map(user, UserDTO.class);
        }
        return null;
    }

    @Override
    public int saveUser(UserDTO userDTO) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            return VarList.Not_Acceptable;
        } else {
            BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
            userDTO.setPassword(passwordEncoder.encode(userDTO.getPassword()));
            userRepository.save(modelMapper.map(userDTO, User.class));
            return VarList.Created;
        }
    }

    @Override
    public int updateUser(UserDTO userDTO) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

            // Check if password is NOT already BCrypt-encrypted
            if (!userDTO.getPassword().startsWith("$2a$")) {  // BCrypt prefix
                userDTO.setPassword(passwordEncoder.encode(userDTO.getPassword()));
            }

            userRepository.save(modelMapper.map(userDTO, User.class));
            return VarList.Created;
        } else {
            return VarList.Not_Acceptable;
        }
    }

    @Override
    public int deleteUser(String email) {
        User user = userRepository.findByEmail(email);
        if (user != null) {
            userRepository.delete(user);
            return VarList.OK;
        }
        return VarList.Not_Found;
    }

    @Override
    public List<UserDTO> searchUsers(String query, int limit, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail);
        if (currentUser == null) {
            throw new UsernameNotFoundException("User not found");
        }

        String searchTerm = "%" + query.toLowerCase() + "%";
        return userRepository.searchPublicUsers(
                        searchTerm,
                        currentUser.getUserId(),
                        PageRequest.of(0, limit)
                ).stream()
                .map(user -> modelMapper.map(user, UserDTO.class))
                .collect(Collectors.toList());
    }

    @Transactional
    @Override
    public ReportDTO createReport(ReportRequestDTO reportRequest, String reporterEmail) {
        User reporter = userRepository.findByEmail(reporterEmail);
        if (reporter == null) {
            throw new EntityNotFoundException("User not found");
        }

        User reportedUser = userRepository.findByUserId(reportRequest.getUserId());
        if (reportedUser == null) {
            throw new EntityNotFoundException("User not found");
        }

        Report report = new Report();
        report.setType(Report.ReportType.valueOf(reportRequest.getType()));
        report.setPriority(Report.Priority.valueOf(reportRequest.getPriority()));
        report.setDescription(reportRequest.getDescription());
        report.setReporter(reporter);
        report.setReportedUser(reportedUser);
        report.setStatus(Report.ReportStatus.PENDING);

        Report savedReport = reportRepository.save(report);
        return convertToDTO(savedReport);
    }

    private ReportDTO convertToDTO(Report savedReport) {
        ReportDTO reportDTO = modelMapper.map(savedReport, ReportDTO.class);
        reportDTO.setReporter(modelMapper.map(savedReport.getReporter(), UserDTO.class));
        reportDTO.setReportedUser(modelMapper.map(savedReport.getReportedUser(), UserDTO.class));
        return reportDTO;
    }
}

