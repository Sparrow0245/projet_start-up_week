package fr.startupweek.levelupapi.controllers;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import fr.startupweek.levelupapi.dto.ForgotPasswordBody;
import fr.startupweek.levelupapi.dto.ResetPasswordBody;
import fr.startupweek.levelupapi.models.EmailVerificationToken;
import fr.startupweek.levelupapi.models.PasswordResetToken;
import fr.startupweek.levelupapi.models.User;
import fr.startupweek.levelupapi.repositories.EmailVerificationTokenRepository;
import fr.startupweek.levelupapi.repositories.PasswordResetTokenRepository;
import fr.startupweek.levelupapi.repositories.UserRepository;
import fr.startupweek.levelupapi.services.EmailService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@RestController
@RequestMapping(value = "/api/auth", produces = MediaType.APPLICATION_JSON_VALUE)
public class PasswordResetController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Autowired
    private EmailService emailService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * POST /auth/forgot-password
     * Envoie un email avec un lien de réinitialisation si l'email existe.
     * Retourne toujours "ok" pour ne pas révéler l'existence d'un compte.
     */
    @PostMapping({"/forgot-password", "/forgot-password/"})
    public String forgotPassword(@RequestBody ForgotPasswordBody request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            return "\"ok\"";
        }

        User user = userOpt.get();

        // Générer un token unique
        String token = UUID.randomUUID().toString();

        // Sauvegarder le token avec expiration de 30 minutes
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setEmail(user.getEmail());
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        resetToken.setUsed(false);
        tokenRepository.save(resetToken);

        // Construire le lien de réinitialisation
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        // Envoyer l'email
        boolean sent = emailService.sendPasswordResetEmail(user.getEmail(), user.getPrenom(), resetLink);
        if (!sent) {
            return "\"email_error\"";
        }

        return "\"ok\"";
    }

    /**
     * POST /auth/reset-password
     * Réinitialise le mot de passe si le token est valide et non expiré.
     */
    @PostMapping({"/reset-password", "/reset-password/"})
    public String resetPassword(@RequestBody ResetPasswordBody request) {
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(request.getToken());

        if (tokenOpt.isEmpty()) {
            return "\"invalid_token\"";
        }

        PasswordResetToken resetToken = tokenOpt.get();

        // Vérifier que le token n'a pas été utilisé
        if (resetToken.isUsed()) {
            return "\"token_used\"";
        }

        // Vérifier que le token n'est pas expiré
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            return "\"token_expired\"";
        }

        // Trouver l'utilisateur
        Optional<User> userOpt = userRepository.findByEmail(resetToken.getEmail());
        if (userOpt.isEmpty()) {
            return "\"error\"";
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Marquer le token comme utilisé
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        return "\"ok\"";
    }

    /**
     * GET /auth/verify-email?token=...
     * Vérifie le token et marque l'email comme vérifié.
     */
    @GetMapping({"/verify-email", "/verify-email/"})
    public String verifyEmail(@RequestParam String token) {
        Optional<EmailVerificationToken> tokenOpt = emailVerificationTokenRepository.findByToken(token);

        if (tokenOpt.isEmpty()) {
            return "\"invalid_token\"";
        }

        EmailVerificationToken verificationToken = tokenOpt.get();

        if (verificationToken.isUsed()) {
            return "\"token_used\"";
        }

        if (verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            return "\"token_expired\"";
        }

        Optional<User> userOpt = userRepository.findByEmail(verificationToken.getEmail());
        if (userOpt.isEmpty()) {
            return "\"error\"";
        }

        User user = userOpt.get();
        user.setEmailVerified(true);
        userRepository.save(user);

        verificationToken.setUsed(true);
        emailVerificationTokenRepository.save(verificationToken);

        return "\"ok\"";
    }
}
