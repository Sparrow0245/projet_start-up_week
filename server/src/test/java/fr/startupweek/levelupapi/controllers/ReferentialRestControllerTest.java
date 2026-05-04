package fr.startupweek.levelupapi.controllers;

import fr.startupweek.levelupapi.enums.Constraint;
import fr.startupweek.levelupapi.models.*;
import fr.startupweek.levelupapi.repositories.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ReferentialRestControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired SportRepository sportRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired EquipmentRepository equipmentRepository;
    @Autowired GoalRepository goalRepository;

    private Sport sport;

    @BeforeEach
    void setUp() {
        goalRepository.deleteAll();
        equipmentRepository.deleteAll();
        roleRepository.deleteAll();
        sportRepository.deleteAll();

        sport = new Sport();
        sport.setNom("Football");
        sportRepository.save(sport);

        Role role = new Role();
        role.setNom("Attaquant");
        role.setSport(sport);
        roleRepository.save(role);

        Equipment equipment = new Equipment();
        equipment.setNom("Ballon");
        equipment.setSport(sport);
        equipmentRepository.save(equipment);

        Goal goal = new Goal();
        goal.setNom("Améliorer la précision");
        goal.setSport(sport);
        goalRepository.save(goal);
    }

    // ─── GET /api/sports ──────────────────────────────────────────────────────

    @Test
    void getAllSports_retourne_liste_des_sports() throws Exception {
        mockMvc.perform(get("/api/sports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nom").value("Football"));
    }

    // ─── GET /api/sports/{sportId}/roles ──────────────────────────────────────

    @Test
    void getRolesBySport_retourne_les_roles_du_sport() throws Exception {
        mockMvc.perform(get("/api/sports/{id}/roles", sport.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nom").value("Attaquant"));
    }

    @Test
    void getRolesBySport_retourne_liste_vide_si_sport_inconnu() throws Exception {
        mockMvc.perform(get("/api/sports/99999/roles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ─── GET /api/sports/{sportId}/equipment ──────────────────────────────────

    @Test
    void getEquipmentBySport_retourne_le_materiel_du_sport() throws Exception {
        mockMvc.perform(get("/api/sports/{id}/equipment", sport.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nom").value("Ballon"));
    }

    // ─── GET /api/sports/{sportId}/goals ──────────────────────────────────────

    @Test
    void getGoalsBySport_retourne_les_objectifs_du_sport() throws Exception {
        mockMvc.perform(get("/api/sports/{id}/goals", sport.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nom").value("Améliorer la précision"));
    }

    // ─── GET /api/constraints ─────────────────────────────────────────────────

    @Test
    void getAllConstraints_retourne_toutes_les_valeurs_de_lenum() throws Exception {
        mockMvc.perform(get("/api/constraints"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(Constraint.values().length)))
                .andExpect(jsonPath("$", hasItem("GENOUX")))
                .andExpect(jsonPath("$", hasItem("AUCUNE")));
    }
}
