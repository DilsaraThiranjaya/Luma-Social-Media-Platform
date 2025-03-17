package lk.ijse.backend.service.impl;

import lk.ijse.backend.dto.ResponseDTO;
import lk.ijse.backend.dto.UserDTO;
import lk.ijse.backend.entity.User;
import lk.ijse.backend.jwtmodels.AuthRequest;
import lk.ijse.backend.jwtmodels.AuthResponse;
import lk.ijse.backend.repository.UserRepository;
import lk.ijse.backend.service.AuthService;
import lk.ijse.backend.util.JwtUtil;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final ModelMapper modelMapper;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    @Override
    public ResponseEntity<ResponseDTO> signIn(AuthRequest signIn) {
        try {
            UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(signIn.getEmail(), signIn.getPassword());
            authenticationManager.authenticate(authenticationToken);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ResponseDTO(VarList.Unauthorized, "Invalid credentials",e.getMessage()));
        }

        User loadedUser = userRepository.findByEmail(signIn.getEmail());

        if (loadedUser == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ResponseDTO(VarList.Conflict, "Authorization Failure! Please Try Again", null));
        }


        String generatedToken = jwtUtil.generateToken(modelMapper.map(loadedUser, UserDTO.class));

        if (generatedToken == null || generatedToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ResponseDTO(VarList.Conflict, "Authorization Failure! Please Try Again", null));
        }

        AuthResponse authResponse = new AuthResponse();
        authResponse.setToken(generatedToken);

        return ResponseEntity.status(HttpStatus.CREATED).body(new ResponseDTO(VarList.Created, "Success", authResponse));
    }

    @Override
    public JwtAuthResponse signUp(AuthRequest signUp) {
        Optional<User> tempUser = userRepository.findById(signUp.getEmail());
        if (tempUser.isPresent()) {
            throw new UserAlreadyExistsException("User already exists");
        }
        try {
            signUp.setPassword(passwordEncoder.encode(signUp.getPassword()));
            User user = new User(signUp.getEmail(),signUp.getPassword(), Role.OTHER);
            User savedUser = userRepository.save(user);
            String generateToken = jwtService.generateToken(savedUser);
            return JwtAuthResponse.builder().token(generateToken).build();
        } catch (Exception e) {
            throw new DataPersistFailedException("Failed to save the user");
        }
    }

    @Override
    public JwtAuthResponse refreshToken(String accessToken) {
        String extractedUserName = jwtService.extractUsername(accessToken);
        User user = userRepository.findById(extractedUserName).orElseThrow(() -> new UsernameNotFoundException("User not found"));
        String refreshToken = jwtService.generateToken(user);
        return JwtAuthResponse.builder().token(refreshToken).build();
    }
}

