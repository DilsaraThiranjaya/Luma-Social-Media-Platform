package lk.ijse.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

@Entity
@Table(name = "event")
public class  Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int eventId;

    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private String location;

    @OneToOne
    @JoinColumn(name = "post_id", unique = true, nullable = false)
    private Post post;
}
