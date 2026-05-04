package fr.startupweek.levelupapi.controllers;

import tools.jackson.databind.ObjectMapper;
import fr.startupweek.levelupapi.models.PasswordResetToken;
import fr.startupweek.levelupapi.models.User;
import fr.startupweek.levelupapi.repositories.ExerciseRepository;
import fr.startupweek.levelupapi.repositories.PasswordResetTokenRepository;
import fr.startupweek.levelupapi.repositories.ProgramRepository;
import fr.startupweek.levelupapi.repositories.SessionRepository;
import fr.startupweek.levelupapi.repositories.UserRepository;
import fr.startupweek.levelupapi.services.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PasswordResetControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired PasswordResetTokenRepository tokenRepository;
    @Autowired ExerciseRepository exerciseRepository;
    @Autowired SessionRepository sessionRepository;
    @Autowired ProgramRepository programRepository;
    @Autowired ObjectMapper objectMapper;

    // EmailService mocké : pas d'envoi réel en test
    @MockitoBean EmailService emailService;

    private User testUser;

    @BeforeEach
    void setUp() {
        tokenRepository.deleteAll();
        sessionRepository.deleteAll();
        exerciseRepository.deleteAll();
        programRepository.deleteAll();
        userRepository.deleteAll();
        testUser = new User();
        testUser.setEmail("user@example.com");
        testUser.setPassword("pass");
        testUser.setPrenom("Jean");
        testUser.setNom("Dupont");
        userRepository.save(testUser);
    }

    // ─── POST /auth/forgot-password ──────────────────────────────────────────

    @Test
    void forgotPassword_retourne_ok_si_email_connu_et_email_envoye() throws Exception {
        when(emailService.sendPasswordResetEmail(anyString(), anyString(), anyString())).thenReturn(true);

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "user@example.com"))))
                .andExpect(status().isOk())
                .andExpect(content().string("\"ok\""));
    }

    @Test
    void forgotPassword_retourne_ok_meme_si_email_inconnu() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "inconnu@example.com"))))
                .andExpect(status().isOk())
                .andExpect(content().string("\"ok\""));
    }

    @Test
    void forgotPassword_retourne_email_error_si_envoi_echoue() throws Exception {
        when(emailService.sendPasswordResetEmail(anyString(), anyString(), anyString())).thenReturn(false);

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "user@example.com"))))
                .andExpect(status().isOk())
                .andExpect(content().string("\"email_error\""));
    }

    // ─── POST /auth/reset-password ───────────────────────────────────────────

    @Test
    void resetPassword_retourne_ok_avec_token_valide() throws Exception {
        PasswordResetToken token = new PasswordResetToken();
        token.setToken("valid-token");
        token.setEmail(testUser.getEmail());
        token.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        token.setUsed(false);
        tokenRepository.save(token);

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("token", "valid-token", "newPassword", "newpass123"))))
                .andExpect(status().isOk())
                .andExpect(content().string("\"ok\""));
    }

    @Test
    void resetPassword_retourne_invalid_token_si_token_inconnu() throws Exception {
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("token", "bad-token", "newPassword", "newpass"))))
                .andExpect(status().isOk())
                .andExpect(content().string("\"invalid_token\""));
    }

    @Test
    void resetPassword_retourne_token_expired_si_token_perime() throws Exception {
        PasswordResetToken token = new PasswordResetToken();
        token.setToken("expired-token");
        token.setEmail(testUser.getEmail());
        token.setExpiresAt(LocalDateTime.now().minusMinutes(1)); // déjà expiré
        token.setUsed(false);
        tokenRepository.save(token);

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("token", "expired-token", "newPassword", "newpass"))))
                .andExpect(status().isOk())
                .andExpect(content().string("\"token_expired\""));
    }

    @Test
    void resetPassword_retourne_token_used_si_token_deja_utilise() throws Exception {
        PasswordResetToken token = new PasswordResetToken();
        token.setToken("used-token");
        token.setEmail(testUser.getEmail());
        token.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        token.setUsed(true); // déjà utilisé
        tokenRepository.save(token);

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("token", "used-token", "newPassword", "newpass"))))
                .andExpect(status().isOk())
                .andExpect(content().string("\"token_used\""));
    }
}
