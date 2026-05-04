package fr.startupweek.levelupapi.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "levelup_session")
public class Session {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int jourNumero;

    private LocalDate completedAt;

    @ManyToOne
    @JoinColumn(name = "program_id")
    @JsonBackReference
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Program program;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "session_exercise",
        joinColumns = @JoinColumn(name = "session_id"),
        inverseJoinColumns = @JoinColumn(name = "exercise_id")
    )
    private List<Exercise> exercices;
}
