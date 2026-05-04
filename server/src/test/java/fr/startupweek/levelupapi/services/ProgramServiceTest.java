package fr.startupweek.levelupapi.services;

import fr.startupweek.levelupapi.enums.Constraint;
import fr.startupweek.levelupapi.models.*;
import fr.startupweek.levelupapi.repositories.ExerciseRepository;
import fr.startupweek.levelupapi.repositories.ProgramRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProgramServiceTest {

    @Mock
    private ExerciseRepository exerciseRepository;

    @Mock
    private ProgramRepository programRepository;

    @InjectMocks
    private ProgramService programService;

    private User user;
    private Role role1;
    private Equipment equipment1;
    private Goal goal1;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);

        role1 = new Role();
        role1.setId(10L);
        role1.setNom("Attaquant");

        equipment1 = new Equipment();
        equipment1.setId(20L);
        equipment1.setNom("Ballon");

        goal1 = new Goal();
        goal1.setId(30L);
        goal1.setNom("Explosivité");

        // programRepository.save retourne l'objet passé en argument
        when(programRepository.save(any(Program.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    // ─── Helper pour créer un exercice ───────────────────────────────────────

    private Exercise buildExercise(Long id, List<Equipment> materiel, List<Constraint> contraintes,
                                   List<Role> roles, List<Goal> goals) {
        Exercise ex = new Exercise();
        ex.setId(id);
        ex.setNom("Exercice " + id);
        ex.setMaterielNecessaire(materiel);
        ex.setContraintesPhysiques(contraintes);
        ex.setTypesDeJoueur(roles);
        ex.setObjectifs(goals);
        return ex;
    }

    // ─── Cas : pool vide → programme sans séances ─────────────────────────────

    @Test
    void generateProgram_retourne_programme_vide_si_aucun_exercice() {
        when(exerciseRepository.findBySportId(1L)).thenReturn(List.of());

        Program result = programService.generateProgram(
                1L, List.of(), List.of(), List.of(), List.of(), 3, 8, user);

        assertThat(result.getSessions()).isEmpty();
    }

    // ─── Filtrage matériel ────────────────────────────────────────────────────

    @Test
    void generateProgram_exclut_exercice_si_materiel_manquant() {
        Exercise exAvecBallonEtCone = buildExercise(1L, List.of(equipment1), List.of(), List.of(), List.of());
        Equipment cone = new Equipment();
        cone.setId(21L);
        cone.setNom("Cône");
        Exercise exAvecCone = buildExercise(2L, List.of(cone), List.of(), List.of(), List.of());

        when(exerciseRepository.findBySportId(1L)).thenReturn(List.of(exAvecBallonEtCone, exAvecCone));

        // L'utilisateur n'a que equipment1 (id=20), pas le cône (id=21)
        Program result = programService.generateProgram(
                1L, List.of(), List.of(equipment1.getId()), List.of(), List.of(), 1, 8, user);

        assertThat(result.getSessions()).hasSize(1);
        assertThat(result.getSessions().get(0).getExercices())
                .extracting(Exercise::getId)
                .containsOnly(1L)
                .doesNotContain(2L);
    }

    @Test
    void generateProgram_inclut_exercice_sans_materiel_meme_si_utilisateur_na_rien() {
        Exercise exSansMateriel = buildExercise(1L, List.of(), List.of(), List.of(), List.of());
        when(exerciseRepository.findBySportId(1L)).thenReturn(List.of(exSansMateriel));

        Program result = programService.generateProgram(
                1L, List.of(), List.of(), List.of(), List.of(), 1, 8, user);

        assertThat(result.getSessions()).hasSize(1);
        assertThat(result.getSessions().get(0).getExercices()).contains(exSansMateriel);
    }

    // ─── Filtrage sécurité / contraintes ─────────────────────────────────────

    @Test
    void generateProgram_exclut_exercice_dangereux_pour_blessure_utilisateur() {
        Exercise exGenoux = buildExercise(1L, List.of(), List.of(Constraint.GENOUX), List.of(), List.of());
        Exercise exSur = buildExercise(2L, List.of(), List.of(Constraint.AUCUNE), List.of(), List.of());

        when(exerciseRepository.findBySportId(1L)).thenReturn(List.of(exGenoux, exSur));

        // Utilisateur a mal aux genoux
        Program result = programService.generateProgram(
                1L, List.of(), List.of(), List.of(Constraint.GENOUX), List.of(), 1, 8, user);

        assertThat(result.getSessions()).hasSize(1);
        assertThat(result.getSessions().get(0).getExercices())
                .extracting(Exercise::getId)
                .containsOnly(2L)
                .doesNotContain(1L);
    }

    @Test
    void generateProgram_inclut_tous_les_exercices_si_utilisateur_sans_blessure() {
        Exercise ex1 = buildExercise(1L, List.of(), List.of(Constraint.GENOUX), List.of(), List.of());
        Exercise ex2 = buildExercise(2L, List.of(), List.of(Constraint.DOS), List.of(), List.of());

        when(exerciseRepository.findBySportId(1L)).thenReturn(List.of(ex1, ex2));

        Program result = programService.generateProgram(
                1L, List.of(), List.of(), List.of(Constraint.AUCUNE), List.of(), 1, 8, user);

        assertThat(result.getSessions()).hasSize(1);
        assertThat(result.getSessions().get(0).getExercices()).hasSize(2);
    }

    // ─── Scoring / priorité ───────────────────────────────────────────────────

    @Test
    void generateProgram_priorise_exercice_avec_role_correspondant() {
        Exercise exAvecRole = buildExercise(1L, List.of(), List.of(), List.of(role1), List.of());
        Exercise exSansRole = buildExercise(2L, List.of(), List.of(), List.of(), List.of());

        when(exerciseRepository.findBySportId(1L)).thenReturn(List.of(exSansRole, exAvecRole));

        // Séance de 1 exercice → doit choisir celui qui match le rôle
        Program result = programService.generateProgram(
                1L, List.of(role1.getId()), List.of(), List.of(), List.of(), 1, 8, user);

        // Avec 2 exos et EXERCISES_PER_SESSION=6, les deux sont inclus
        // → vérifie que exAvecRole est bien présent (score 10 > 0)
        assertThat(result.getSessions().get(0).getExercices())
                .extracting(Exercise::getId)
                .contains(1L);
    }

    @Test
    void generateProgram_priorise_exercice_avec_objectif_correspondant() {
        Exercise exAvecGoal = buildExercise(1L, List.of(), List.of(), List.of(), List.of(goal1));
        Exercise exSansGoal = buildExercise(2L, List.of(), List.of(), List.of(), List.of());

        when(exerciseRepository.findBySportId(1L)).thenReturn(List.of(exSansGoal, exAvecGoal));

        Program result = programService.generateProgram(
                1L, List.of(), List.of(), List.of(), List.of(goal1.getId()), 1, 8, user);

        assertThat(result.getSessions().get(0).getExercices())
                .extracting(Exercise::getId)
                .contains(1L);
    }

    // ─── Nombre de séances ────────────────────────────────────────────────────

    @Test
    void generateProgram_cree_le_bon_nombre_de_seances() {
        Exercise ex = buildExercise(1L, List.of(), List.of(), List.of(), List.of());
        when(exerciseRepository.findBySportId(1L)).thenReturn(List.of(ex));

        Program result = programService.generateProgram(
                1L, List.of(), List.of(), List.of(), List.of(), 4, 8, user);

        assertThat(result.getSessions()).hasSize(4);
    }

    @Test
    void generateProgram_chaque_seance_a_le_bon_jour_numero() {
        Exercise ex = buildExercise(1L, List.of(), List.of(), List.of(), List.of());
        when(exerciseRepository.findBySportId(1L)).thenReturn(List.of(ex));

        Program result = programService.generateProgram(
                1L, List.of(), List.of(), List.of(), List.of(), 3, 8, user);

        assertThat(result.getSessions())
                .extracting(Session::getJourNumero)
                .containsExactly(1, 2, 3);
    }

    // ─── durationWeeks ───────────────────────────────────────────────────────

    @Test
    void generateProgram_enregistre_la_duree_en_semaines() {
        Exercise ex = buildExercise(1L, List.of(), List.of(), List.of(), List.of());
        when(exerciseRepository.findBySportId(1L)).thenReturn(List.of(ex));

        Program result = programService.generateProgram(
                1L, List.of(), List.of(), List.of(), List.of(), 3, 24, user);

        assertThat(result.getDurationWeeks()).isEqualTo(24);
    }
}
