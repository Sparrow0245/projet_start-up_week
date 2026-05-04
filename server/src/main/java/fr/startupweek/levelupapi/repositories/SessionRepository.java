package fr.startupweek.levelupapi.repositories;

import fr.startupweek.levelupapi.models.Session;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionRepository extends JpaRepository<Session, Long> {
}
