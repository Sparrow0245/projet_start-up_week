package fr.startupweek.levelupapi.repositories;

import fr.startupweek.levelupapi.models.Sport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SportRepository extends JpaRepository<Sport, Long> {
}
