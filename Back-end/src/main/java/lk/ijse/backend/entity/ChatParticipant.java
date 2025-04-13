package lk.ijse.backend.entity;

import jakarta.persistence.*;
import lk.ijse.backend.entity.Embeded.ChatParticipantId;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

@Entity
@Table(name = "chat_participant")
public class ChatParticipant {
    @EmbeddedId
    private ChatParticipantId id;

    @ManyToOne
    @MapsId("chatId")
    @JoinColumn(name = "chat_id")
    private Chat chat;

    @ManyToOne
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @CreationTimestamp
    private LocalDateTime joinedAt;
}

