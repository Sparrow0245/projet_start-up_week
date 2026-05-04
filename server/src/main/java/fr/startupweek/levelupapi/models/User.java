package fr.startupweek.levelupapi.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import fr.startupweek.levelupapi.enums.Constraint;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Table(name = "levelup_user")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    @JsonIgnore
    private String password;
    private String nom;
    private String prenom;
    private boolean isCoach;
    private boolean isAdmin;
    private Boolean coachApproved;

    @ManyToOne
    @JoinColumn(name = "sport_choisi_id")
    private Sport sportChoisi;

    @ManyToOne
    @JoinColumn(name = "poste_id")
    private Role poste;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_equipment",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "equipment_id")
    )
    private List<Equipment> materielPossede;

    private int experience;

    private int level = 1;

    private boolean emailVerified = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "user_constraint", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "constraint_value")
    private List<Constraint> blessures;

    public boolean isCoach() {
        return isCoach;
    }

    public boolean isAdmin() {
        return isAdmin;
    }

    // k = 0.081649 → level = floor(k * sqrt(xp)) + 1
    private static final double K = 0.081649;

    public static int computeLevel(int xp) {
        return (int) Math.floor(K * Math.sqrt(xp)) + 1;
    }

    public static double xpThreshold(int level) {
        return Math.pow((level - 1) / K, 2);
    }

    @PrePersist
    @PreUpdate
    public void recalculateLevel() {
        this.level = computeLevel(this.experience);
    }
}
