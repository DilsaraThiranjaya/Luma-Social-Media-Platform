package lk.ijse.backend.service;


import lk.ijse.backend.dto.ResponseDTO;
import lk.ijse.backend.jwtmodels.AuthRequest;
import lk.ijse.backend.jwtmodels.AuthResponse;
import org.springframework.http.ResponseEntity;

public interface AuthService {
    ResponseEntity<ResponseDTO> signIn(AuthRequest signIn);
    AuthResponse signUp(AuthRequest signUp);
    AuthResponse refreshToken(String accessToken);
}
