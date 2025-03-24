package lk.ijse.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatParticipantDTO {

    @NotNull(message = "Chat cannot be null")
    private ChatDTO chat;

    @NotNull(message = "User cannot be null")
    private UserDTO user;

    @Null
    private LocalDateTime joinedAt;
}