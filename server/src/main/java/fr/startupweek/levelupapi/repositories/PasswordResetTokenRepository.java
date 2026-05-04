package fr.startupweek.levelupapi.repositories;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import fr.startupweek.levelupapi.models.PasswordResetToken;

public interface PasswordResetTokenRepository extends CrudRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
}
