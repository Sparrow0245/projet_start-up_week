package fr.startupweek.levelupapi.repositories;

import fr.startupweek.levelupapi.models.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    List<Equipment> findBySportId(Long sportId);
}
