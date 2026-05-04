package fr.startupweek.levelupapi.repositories;

import fr.startupweek.levelupapi.models.Program;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProgramRepository extends JpaRepository<Program, Long> {
    Optional<Program> findTopByUserIdOrderByDateCreationDesc(Long userId);
}
