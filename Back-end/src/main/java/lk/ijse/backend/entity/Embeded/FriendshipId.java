package lk.ijse.backend.entity.Embeded;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FriendshipId implements Serializable {
    @Column(name = "user1_id")
    private int user1Id;

    @Column(name = "user2_id")
    private int user2Id;
}
