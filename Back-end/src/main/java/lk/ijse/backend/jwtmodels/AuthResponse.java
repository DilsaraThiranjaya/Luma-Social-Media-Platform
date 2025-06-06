package lk.ijse.backend.jwtmodels;

import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class AuthResponse {
    private String token;
    private String email;
    private int userId;
}

