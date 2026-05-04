package fr.startupweek.levelupapi.repositories;

import java.util.List;
import java.util.Optional;


import fr.startupweek.levelupapi.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
    List<User> findByIsCoachTrueAndCoachApprovedFalse();
    List<User> findByIsCoachTrueAndCoachApprovedTrue();
}
