package fr.startupweek.levelupapi.repositories;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import fr.startupweek.levelupapi.models.EmailVerificationToken;

public interface EmailVerificationTokenRepository extends CrudRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findByToken(String token);
}
