package fr.startupweek.levelupapi.controllers;

import tools.jackson.databind.ObjectMapper;
import fr.startupweek.levelupapi.enums.Intensity;
import fr.startupweek.levelupapi.models.*;
import fr.startupweek.levelupapi.repositories.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ExerciseRestControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired ExerciseRepository exerciseRepository;
    @Autowired UserRepository userRepository;
    @Autowired SportRepository sportRepository;
    @Autowired EquipmentRepository equipmentRepository;
    @Autowired GoalRepository goalRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired SessionRepository sessionRepository;
    @Autowired ProgramRepository programRepository;

    private Sport sport;
    private User coach;
    private User nonCoach;
    private Exercise exercise;

    @BeforeEach
    void setUp() {
        sessionRepository.deleteAll();
        exerciseRepository.deleteAll();
        programRepository.deleteAll();
        userRepository.deleteAll();
        equipmentRepository.deleteAll();
        goalRepository.deleteAll();
        roleRepository.deleteAll();
        sportRepository.deleteAll();

        sport = new Sport();
        sport.setNom("Football");
        sportRepository.save(sport);

        coach = new User();
        coach.setEmail("coach@example.com");
        coach.setPassword("pass");
        coach.setPrenom("Jean");
        coach.setNom("Coach");
        coach.setCoach(true);
        coach.setCoachApproved(true);
        userRepository.save(coach);

        nonCoach = new User();
        nonCoach.setEmail("user@example.com");
        nonCoach.setPassword("pass");
        nonCoach.setPrenom("Pierre");
        nonCoach.setNom("User");
        nonCoach.setCoach(false);
        userRepository.save(nonCoach);

        exercise = new Exercise();
        exercise.setNom("Tir au but");
        exercise.setDescriptionDetaillee("Exercice de tir");
        exercise.setDureeMin(20);
        exercise.setSeries(3);
        exercise.setRepTemps("10 reps");
        exercise.setIntensite(Intensity.MOYENNE);
        exercise.setSport(sport);
        exercise.setCreatedBy(coach);
        exerciseRepository.save(exercise);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private Map<String, Object> buildExBody(Long coachId, String nom, String intensite) {
        Map<String, Object> body = new HashMap<>();
        body.put("coachId", coachId);
        body.put("nom", nom);
        body.put("descriptionDetaillee", "Description de " + nom);
        body.put("dureeMin", 15);
        body.put("series", 3);
        body.put("repTemps", "10 reps");
        body.put("intensite", intensite);
        body.put("sportId", sport.getId());
        body.put("roleIds", List.<Long>of());
        body.put("equipmentIds", List.<Long>of());
        body.put("goalIds", List.<Long>of());
        body.put("constraints", List.<String>of());
        return body;
    }

    // ─── GET /exercices/{count} ───────────────────────────────────────────────

    @Test
    void getExercises_retourne_liste_avec_totalCount() throws Exception {
        mockMvc.perform(get("/api/exercices/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCount").value(1))
                .andExpect(jsonPath("$.exercices", hasSize(1)))
                .andExpect(jsonPath("$.exercices[0].nom").value("Tir au but"));
    }

    @Test
    void getExercises_limite_le_nombre_de_resultats() throws Exception {
        // Ajouter un 2e exercice
        Exercise ex2 = new Exercise();
        ex2.setNom("Passe courte");
        ex2.setDescriptionDetaillee("desc");
        ex2.setDureeMin(10);
        ex2.setSeries(2);
        ex2.setRepTemps("5 reps");
        ex2.setIntensite(Intensity.FAIBLE);
        ex2.setSport(sport);
        ex2.setCreatedBy(coach);
        exerciseRepository.save(ex2);

        // count=1 → on ne retourne qu'un seul mais totalCount=2
        mockMvc.perform(get("/api/exercices/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCount").value(2))
                .andExpect(jsonPath("$.exercices", hasSize(1)));
    }

    // ─── GET /exercices/{id}/detail ───────────────────────────────────────────

    @Test
    void getExerciseDetail_retourne_exercice_existant() throws Exception {
        mockMvc.perform(get("/api/exercices/{id}/detail", exercise.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Tir au but"))
                .andExpect(jsonPath("$.dureeMin").value(20));
    }

    @Test
    void getExerciseDetail_retourne_404_si_inexistant() throws Exception {
        mockMvc.perform(get("/api/exercices/99999/detail"))
                .andExpect(status().isNotFound());
    }

    // ─── POST /exercices ──────────────────────────────────────────────────────

    @Test
    void createExercise_retourne_exercice_cree_si_coach() throws Exception {
        Map<String, Object> body = buildExBody(coach.getId(), "Dribble", "ELEVEE");

        mockMvc.perform(post("/api/exercices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Dribble"));
    }

    @Test
    void createExercise_retourne_403_si_non_coach() throws Exception {
        Map<String, Object> body = buildExBody(nonCoach.getId(), "Dribble", "ELEVEE");

        mockMvc.perform(post("/api/exercices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());
    }

    // ─── PUT /exercices/{id} ─────────────────────────────────────────────────

    @Test
    void updateExercise_retourne_exercice_modifie_si_proprietaire() throws Exception {
        Map<String, Object> body = buildExBody(coach.getId(), "Tir modifié", "ELEVEE");
        body.put("dureeMin", 30);

        mockMvc.perform(put("/api/exercices/{id}", exercise.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Tir modifié"))
                .andExpect(jsonPath("$.dureeMin").value(30));
    }

    @Test
    void updateExercise_retourne_403_si_pas_proprietaire() throws Exception {
        User autreCoach = new User();
        autreCoach.setEmail("autre@example.com");
        autreCoach.setPassword("pass");
        autreCoach.setPrenom("Autre");
        autreCoach.setNom("Coach");
        autreCoach.setCoach(true);
        userRepository.save(autreCoach);

        Map<String, Object> body = buildExBody(autreCoach.getId(), "Hack", "FAIBLE");

        mockMvc.perform(put("/api/exercices/{id}", exercise.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateExercise_retourne_404_si_exercice_inconnu() throws Exception {
        Map<String, Object> body = buildExBody(coach.getId(), "Inexistant", "FAIBLE");

        mockMvc.perform(put("/api/exercices/99999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isNotFound());
    }
}
