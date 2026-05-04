package fr.startupweek.levelupapi.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import fr.startupweek.levelupapi.enums.Constraint;
import fr.startupweek.levelupapi.enums.Intensity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Base64;
import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Table(name = "levelup_exercise")
public class Exercise {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;

    @Column(length = 2000)
    private String descriptionDetaillee;

    private int dureeMin;
    private float series;
    private String repTemps;

    @ManyToOne
    @JoinColumn(name = "sport_id")
    private Sport sport;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "exercise_role",
        joinColumns = @JoinColumn(name = "exercise_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private List<Role> typesDeJoueur;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "exercise_equipment",
        joinColumns = @JoinColumn(name = "exercise_id"),
        inverseJoinColumns = @JoinColumn(name = "equipment_id")
    )
    private List<Equipment> materielNecessaire;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "exercise_goal",
        joinColumns = @JoinColumn(name = "exercise_id"),
        inverseJoinColumns = @JoinColumn(name = "goal_id")
    )
    private List<Goal> objectifs;

    @Enumerated(EnumType.STRING)
    private Intensity intensite;

    @ManyToOne
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "exercise_constraint", joinColumns = @JoinColumn(name = "exercise_id"))
    @Column(name = "constraint_value")
    private List<Constraint> contraintesPhysiques;

    @Column(columnDefinition = "text")
    private String img;

    @Transient // Ne sera pas persisté en base de données
    public int getXpGagnee() {
        return (this.intensite != null) ? this.intensite.getXpReward() : 0;
    }
}
