package fr.startupweek.levelupapi.controllers;

import tools.jackson.databind.ObjectMapper;
import fr.startupweek.levelupapi.models.User;
import fr.startupweek.levelupapi.repositories.ExerciseRepository;
import fr.startupweek.levelupapi.repositories.ProgramRepository;
import fr.startupweek.levelupapi.repositories.SessionRepository;
import fr.startupweek.levelupapi.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UserRestControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired ExerciseRepository exerciseRepository;
    @Autowired SessionRepository sessionRepository;
    @Autowired ProgramRepository programRepository;
    @Autowired ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        sessionRepository.deleteAll();
        exerciseRepository.deleteAll();
        programRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ─── /users/signup ────────────────────────────────────────────────────────

    @Test
    void signup_retourne_user_cree() throws Exception {
        Map<String, Object> body = Map.of(
                "prenom", "Jean",
                "nom", "Dupont",
                "email", "jean@example.com",
                "password", "secret",
                "coach", false
        );

        mockMvc.perform(post("/api/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prenom").value("Jean"))
                .andExpect(jsonPath("$.nom").value("Dupont"))
                .andExpect(jsonPath("$.email").value("jean@example.com"))
                .andExpect(jsonPath("$.id").isNumber());
    }

    @Test
    void signup_409_si_email_deja_utilise() throws Exception {
        // Créer un user existant
        User existing = new User();
        existing.setEmail("dup@example.com");
        existing.setPassword("pass");
        existing.setPrenom("A");
        existing.setNom("B");
        userRepository.save(existing);

        Map<String, Object> body = Map.of(
                "prenom", "Jean",
                "nom", "Dupont",
                "email", "dup@example.com",
                "password", "secret",
                "coach", false
        );

        mockMvc.perform(post("/api/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isConflict());
    }

    // ─── /users/login ─────────────────────────────────────────────────────────

    @Test
    void login_retourne_user_si_credentials_corrects() throws Exception {
        // Le mot de passe doit être hashé en base (BCrypt) pour que le login fonctionne
        User user = new User();
        user.setEmail("test@example.com");
        user.setPassword(new BCryptPasswordEncoder().encode("monpass"));
        user.setPrenom("Marie");
        user.setNom("Curie");
        user.setEmailVerified(true);
        userRepository.save(user);

        Map<String, String> body = Map.of(
                "email", "test@example.com",
                "password", "monpass"
        );

        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.prenom").value("Marie"));
    }

    @Test
    void login_401_si_mauvais_password() throws Exception {
        User user = new User();
        user.setEmail("test@example.com");
        user.setPassword(new BCryptPasswordEncoder().encode("bonpass"));
        user.setPrenom("Marie");
        user.setNom("Curie");
        userRepository.save(user);

        Map<String, String> body = Map.of(
                "email", "test@example.com",
                "password", "mauvaispass"
        );

        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_401_si_email_inconnu() throws Exception {
        Map<String, String> body = Map.of(
                "email", "inconnu@example.com",
                "password", "pass"
        );

        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isUnauthorized());
    }

    // ─── GET /users et /users/{id} ────────────────────────────────────────────

    @Test
    void getAllUsers_retourne_liste() throws Exception {
        User user = new User();
        user.setEmail("list@example.com");
        user.setPassword(new BCryptPasswordEncoder().encode("pass"));
        user.setPrenom("Test");
        user.setNom("User");
        userRepository.save(user);

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].email").value("list@example.com"));
    }

    @Test
    void getUserById_retourne_user_existant() throws Exception {
        User user = new User();
        user.setEmail("byid@example.com");
        user.setPassword(new BCryptPasswordEncoder().encode("pass"));
        user.setPrenom("ById");
        user.setNom("Test");
        userRepository.save(user);

        mockMvc.perform(get("/api/users/{id}", user.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("byid@example.com"));
    }

    @Test
    void getUserById_retourne_404_si_inconnu() throws Exception {
        mockMvc.perform(get("/api/users/99999"))
                .andExpect(status().isNotFound());
    }
}
