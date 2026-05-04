package fr.startupweek.levelupapi.repositories;

import fr.startupweek.levelupapi.models.ContestEntry;
import fr.startupweek.levelupapi.models.ContestEntryID;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContestEntryRepository extends JpaRepository<ContestEntry, ContestEntryID> {
    boolean existsByContestIdAndUserId(Long contestId, Long userId);
    List<ContestEntry> findAllByContestId(Long contestId);
    List<ContestEntry> findAllByUserId(Long userId);
}
