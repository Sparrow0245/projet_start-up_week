package fr.startupweek.levelupapi.controllers;

import fr.startupweek.levelupapi.enums.Constraint;
import fr.startupweek.levelupapi.models.Equipment;
import fr.startupweek.levelupapi.models.Goal;
import fr.startupweek.levelupapi.models.Role;
import fr.startupweek.levelupapi.models.Sport;
import fr.startupweek.levelupapi.repositories.EquipmentRepository;
import fr.startupweek.levelupapi.repositories.GoalRepository;
import fr.startupweek.levelupapi.repositories.RoleRepository;
import fr.startupweek.levelupapi.repositories.SportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/api", produces = MediaType.APPLICATION_JSON_VALUE)
public class ReferentialRestController {

    @Autowired
    private SportRepository sportRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private EquipmentRepository equipmentRepository;
    @Autowired
    private GoalRepository goalRepository;

    @GetMapping("/sports")
    public List<Sport> getAllSports() {
        return sportRepository.findAll();
    }

    @GetMapping("/sports/{sportId}/roles")
    public List<Role> getRolesBySport(@PathVariable Long sportId) {
        return roleRepository.findBySportId(sportId);
    }

    @GetMapping("/sports/{sportId}/equipment")
    public List<Equipment> getEquipmentBySport(@PathVariable Long sportId) {
        return equipmentRepository.findBySportId(sportId);
    }

    @GetMapping("/sports/{sportId}/goals")
    public List<Goal> getGoalsBySport(@PathVariable Long sportId) {
        return goalRepository.findBySportId(sportId);
    }

    @GetMapping("/constraints")
    public Constraint[] getAllConstraints() {
        return Constraint.values();
    }
}
