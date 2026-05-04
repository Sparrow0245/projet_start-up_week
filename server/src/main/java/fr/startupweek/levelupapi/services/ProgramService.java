package fr.startupweek.levelupapi.services;

import fr.startupweek.levelupapi.enums.Constraint;
import fr.startupweek.levelupapi.models.*;
import fr.startupweek.levelupapi.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProgramService {

    @Autowired
    private ExerciseRepository exerciseRepository;
    @Autowired
    private ProgramRepository programRepository;

    private static final int EXERCISES_PER_SESSION = 6;

    public Program generateProgram(
            Long sportId,
            List<Long> roleIds,
            List<Long> equipmentIds,
            List<Constraint> userConstraints,
            List<Long> goalIds,
            int sessionsPerWeek,
            int durationWeeks,
            User user
    ) {
        Set<Long> userRoleIds = new HashSet<>(roleIds != null ? roleIds : List.of());
        Set<Long> userEquipmentIds = new HashSet<>(equipmentIds != null ? equipmentIds : List.of());
        Set<Constraint> userInjuries = new HashSet<>(userConstraints != null ? userConstraints : List.of());
        userInjuries.remove(Constraint.AUCUNE);
        Set<Long> userGoalIds = new HashSet<>(goalIds != null ? goalIds : List.of());

        // A. Filtrage éliminatoire
        List<Exercise> filtered = exerciseRepository.findBySportId(sportId).stream()
                .filter(ex -> userHasAllEquipment(ex, userEquipmentIds))
                .filter(ex -> isSafeForUser(ex, userInjuries))
                .collect(Collectors.toList());

        // B. Pondération et tri par score
        List<Exercise> scored = filtered.stream()
                .sorted(Comparator.comparingInt(
                        (Exercise ex) -> calculateScore(ex, userRoleIds, userGoalIds)
                ).reversed())
                .collect(Collectors.toList());

        // C. Création des séances (avec rotation pour réutiliser les exos si nécessaire)
        Program program = new Program();
        program.setDateCreation(LocalDate.now());
        program.setDurationWeeks(durationWeeks);
        program.setUser(user);

        List<Session> sessions = new ArrayList<>();
        int poolSize = scored.size();
        if (poolSize == 0) {
            program.setSessions(sessions);
            return programRepository.save(program);
        }

        for (int i = 0; i < sessionsPerWeek; i++) {
            int exosCount = Math.min(EXERCISES_PER_SESSION, poolSize);
            int offset = (i * 2) % poolSize;
            List<Exercise> sessionExos = new ArrayList<>();
            for (int j = 0; j < exosCount; j++) {
                sessionExos.add(scored.get((offset + j) % poolSize));
            }

            Session session = new Session();
            session.setJourNumero(i + 1);
            session.setProgram(program);
            session.setExercices(sessionExos);
            sessions.add(session);
        }

        program.setSessions(sessions);
        return programRepository.save(program);
    }

    /**
     * Filtre matériel : l'utilisateur doit posséder TOUT le matériel requis par l'exercice.
     */
    private boolean userHasAllEquipment(Exercise exercise, Set<Long> userEquipmentIds) {
        if (exercise.getMaterielNecessaire() == null || exercise.getMaterielNecessaire().isEmpty()) {
            return true;
        }
        return exercise.getMaterielNecessaire().stream()
                .allMatch(eq -> userEquipmentIds.contains(eq.getId()));
    }

    /**
     * Filtre sécurité : les contraintes de l'exercice ne doivent PAS recouper les blessures de l'utilisateur.
     */
    private boolean isSafeForUser(Exercise exercise, Set<Constraint> userInjuries) {
        if (userInjuries.isEmpty()) return true;
        if (exercise.getContraintesPhysiques() == null || exercise.getContraintesPhysiques().isEmpty()) {
            return true;
        }
        if (exercise.getContraintesPhysiques().contains(Constraint.AUCUNE)) {
            return true;
        }
        return Collections.disjoint(exercise.getContraintesPhysiques(), userInjuries);
    }

    /**
     * +10 pts si le rôle de l'utilisateur est dans typesDeJoueur.
     * +5 pts par objectif en commun.
     */
    private int calculateScore(Exercise exercise, Set<Long> userRoleIds, Set<Long> userGoalIds) {
        int score = 0;

        if (!userRoleIds.isEmpty() && exercise.getTypesDeJoueur() != null) {
            boolean roleMatch = exercise.getTypesDeJoueur().stream()
                    .anyMatch(role -> userRoleIds.contains(role.getId()));
            if (roleMatch) score += 10;
        }

        if (!userGoalIds.isEmpty() && exercise.getObjectifs() != null) {
            long goalMatches = exercise.getObjectifs().stream()
                    .filter(goal -> userGoalIds.contains(goal.getId()))
                    .count();
            score += (int) (goalMatches * 5);
        }

        return score;
    }
}
