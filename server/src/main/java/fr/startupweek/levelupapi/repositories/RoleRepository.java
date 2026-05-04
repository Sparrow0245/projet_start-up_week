package fr.startupweek.levelupapi.repositories;

import fr.startupweek.levelupapi.models.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoleRepository extends JpaRepository<Role, Long> {
    List<Role> findBySportId(Long sportId);
}
