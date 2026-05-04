package fr.startupweek.levelupapi.repositories;

import fr.startupweek.levelupapi.models.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {
    List<Exercise> findBySportId(Long sportId);
    List<Exercise> findByCreatedById(Long userId);
}
