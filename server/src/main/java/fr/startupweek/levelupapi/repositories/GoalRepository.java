package fr.startupweek.levelupapi.repositories;

import fr.startupweek.levelupapi.models.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findBySportId(Long sportId);
}
