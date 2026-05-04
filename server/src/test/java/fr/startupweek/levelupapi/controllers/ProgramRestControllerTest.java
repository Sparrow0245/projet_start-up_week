package fr.startupweek.levelupapi.controllers;

import tools.jackson.databind.ObjectMapper;
import fr.startupweek.levelupapi.models.*;
import fr.startupweek.levelupapi.repositories.*;
import fr.startupweek.levelupapi.services.ProgramService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ProgramRestControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired ProgramRepository programRepository;
    @Autowired SessionRepository sessionRepository;
    @Autowired SportRepository sportRepository;

    // ProgramService mocké : la génération d'un programme est complexe
    // (algorithme de sélection d'exercices) — on teste le controller, pas le service
    @MockitoBean ProgramService programService;

    private User user;
    private Program program;
    private Session session;

    @BeforeEach
    void setUp() {
        sessionRepository.deleteAll();
        programRepository.deleteAll();
        userRepository.deleteAll();
        sportRepository.deleteAll();

        user = new User();
        user.setEmail("user@example.com");
        user.setPassword("pass");
        user.setPrenom("Jean");
        user.setNom("Dupont");
        userRepository.save(user);

        program = new Program();
        program.setDateCreation(LocalDate.now());
        program.setDurationWeeks(8);
        program.setUser(user);
        program.setSessions(new ArrayList<>());
        programRepository.save(program);

        session = new Session();
        session.setJourNumero(1);
        session.setProgram(program);
        session.setExercices(List.of());
        sessionRepository.save(session);
    }

    // ─── GET /programme/user/{userId} ────────────────────────────────────────

    @Test
    void getUserProgram_retourne_le_programme_de_lutilisateur() throws Exception {
        mockMvc.perform(get("/api/programme/user/{id}", user.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.durationWeeks").value(8));
    }

    @Test
    void getUserProgram_retourne_404_si_aucun_programme() throws Exception {
        // Utilisateur sans programme
        User userSansProg = new User();
        userSansProg.setEmail("sans@example.com");
        userSansProg.setPassword("pass");
        userSansProg.setPrenom("Sans");
        userSansProg.setNom("Programme");
        userRepository.save(userSansProg);

        mockMvc.perform(get("/api/programme/user/{id}", userSansProg.getId()))
                .andExpect(status().isNotFound())
                .andExpect(content().string("\"no_program\""));
    }

    // ─── PUT /programme/sessions/{sessionId}/complete ────────────────────────

    @Test
    void completeSession_marque_la_session_comme_completee() throws Exception {
        mockMvc.perform(put("/api/programme/sessions/{id}/complete", session.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedAt").isNotEmpty());
    }

    @Test
    void completeSession_retourne_404_si_session_inconnue() throws Exception {
        mockMvc.perform(put("/api/programme/sessions/99999/complete"))
                .andExpect(status().isNotFound())
                .andExpect(content().string("\"session_not_found\""));
    }

    // ─── POST /programme/generate ────────────────────────────────────────────

    @Test
    void generateProgram_retourne_le_programme_genere() throws Exception {
        // On mock le service pour ne pas dépendre de la logique de génération
        Program mockProgram = new Program();
        mockProgram.setId(99L);
        mockProgram.setDateCreation(LocalDate.now());
        mockProgram.setDurationWeeks(4);
        mockProgram.setSessions(List.of());
        when(programService.generateProgram(any(), any(), any(), any(), any(), anyInt(), anyInt(), any()))
                .thenReturn(mockProgram);

        Map<String, Object> body = new HashMap<>();
        body.put("sportId", 1L);
        body.put("roleIds", List.<Long>of());
        body.put("equipmentIds", List.<Long>of());
        body.put("goalIds", List.<Long>of());
        body.put("constraints", List.<String>of());
        body.put("sessionsPerWeek", 3);
        body.put("durationWeeks", 4);
        body.put("userId", user.getId());

        mockMvc.perform(post("/api/programme/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.durationWeeks").value(4));
    }
}
