package lk.ijse.backend.entity.Embeded;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatParticipantId implements Serializable {
    private int chatId;
    private int userId;
}
