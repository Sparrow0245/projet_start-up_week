package fr.startupweek.levelupapi.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Table(name = "levelup_contest")
public class Contest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;

    @Column(length = 1000)
    private String description;

    private String recompense;

    private int levelRequis;

    private LocalDate dateLimite;

    private LocalDate dateCreation;

    private boolean tirageEffectue = false;

    @ManyToOne
    @JoinColumn(name = "gagnant_id")
    private User gagnant;

    @OneToMany(mappedBy = "contest", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ContestEntry> inscriptions = new ArrayList<>();
}
