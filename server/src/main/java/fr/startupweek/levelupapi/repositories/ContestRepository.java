package fr.startupweek.levelupapi.repositories;

import fr.startupweek.levelupapi.models.Contest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContestRepository extends JpaRepository<Contest, Long> {
    List<Contest> findAllByOrderByDateLimiteAsc();
}
