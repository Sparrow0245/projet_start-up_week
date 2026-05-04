package fr.startupweek.levelupapi.controllers;

import fr.startupweek.levelupapi.enums.Constraint;
import fr.startupweek.levelupapi.enums.Intensity;
import fr.startupweek.levelupapi.models.*;
import fr.startupweek.levelupapi.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/exercices", produces = MediaType.APPLICATION_JSON_VALUE)
public class ExerciseRestController {
    @Autowired
    ExerciseRepository exerciseRepository;
    @Autowired
    UserRepository userRepository;
    @Autowired
    SportRepository sportRepository;
    @Autowired
    RoleRepository roleRepository;
    @Autowired
    EquipmentRepository equipmentRepository;
    @Autowired
    GoalRepository goalRepository;
    @Autowired
    SessionRepository sessionRepository;

    @GetMapping({"/{count}", "/{count}/"})
    public Map<String, Object> getExercises(@PathVariable int count) {
        List<Exercise> allExos = exerciseRepository.findAll();
        int total = allExos.size();
        List<Exercise> result = total <= count ? allExos : allExos.subList(0, count);
        return Map.of("totalCount", total, "exercices", result);
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<?> getExercise(@PathVariable Long id) {
        Optional<Exercise> exercise = exerciseRepository.findById(id);
        return exercise.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping({"", "/"})
    public ResponseEntity<?> createExercise(@RequestBody Map<String, Object> body) {
        Long coachId = ((Number) body.get("coachId")).longValue();
        Optional<User> coachOpt = userRepository.findById(coachId);
        User creator = coachOpt.get();
        if (!creator.isAdmin() && !creator.isCoach()) {
            return ResponseEntity.status(403).body("\"Seuls les coachs peuvent créer des exercices\"");
        }
        if (creator.isCoach() && !Boolean.TRUE.equals(creator.getCoachApproved())) {
            return ResponseEntity.status(403).body("\"Votre compte coach est en attente de validation par un administrateur\"");
        }

        Exercise ex = buildExerciseFromBody(body);
        ex.setCreatedBy(coachOpt.get());
        Exercise saved = exerciseRepository.save(ex);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExercise(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long coachId = ((Number) body.get("coachId")).longValue();
        Optional<Exercise> exOpt = exerciseRepository.findById(id);
        if (exOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Exercise existing = exOpt.get();
        User editor = userRepository.findById(coachId).orElse(null);
        boolean isAdmin = editor != null && editor.isAdmin();
        if (!isAdmin && (existing.getCreatedBy() == null || !existing.getCreatedBy().getId().equals(coachId))) {
            return ResponseEntity.status(403).body("\"Vous ne pouvez modifier que vos propres exercices\"");
        }

        Exercise updated = buildExerciseFromBody(body);
        updated.setId(id);
        updated.setCreatedBy(existing.getCreatedBy());
        Exercise saved = exerciseRepository.save(updated);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExercise(@PathVariable Long id, @RequestParam Long adminId) {
        Optional<User> adminOpt = userRepository.findById(adminId);
        if (adminOpt.isEmpty() || !adminOpt.get().isAdmin()) {
            return ResponseEntity.status(403).body("\"Seuls les administrateurs peuvent supprimer des exercices\"");
        }
        Optional<Exercise> exOpt = exerciseRepository.findById(id);
        if (exOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        sessionRepository.findAll().forEach(session -> {
            if (session.getExercices().removeIf(ex -> ex.getId().equals(id))) {
                sessionRepository.save(session);
            }
        });
        exerciseRepository.deleteById(id);
        return ResponseEntity.ok("\"deleted\"");
    }

    @SuppressWarnings("unchecked")
    private Exercise buildExerciseFromBody(Map<String, Object> body) {
        Exercise ex = new Exercise();
        ex.setNom((String) body.get("nom"));
        ex.setDescriptionDetaillee((String) body.get("descriptionDetaillee"));
        ex.setDureeMin(((Number) body.get("dureeMin")).intValue());
        ex.setSeries(((Number) body.get("series")).floatValue());
        ex.setRepTemps((String) body.get("repTemps"));
        ex.setIntensite(Intensity.valueOf((String) body.get("intensite")));

        Long sportId = ((Number) body.get("sportId")).longValue();
        sportRepository.findById(sportId).ifPresent(ex::setSport);

        List<Number> roleIds = (List<Number>) body.get("roleIds");
        if (roleIds != null) {
            ex.setTypesDeJoueur(roleIds.stream()
                    .map(n -> roleRepository.findById(n.longValue()).orElse(null))
                    .filter(r -> r != null)
                    .collect(Collectors.toList()));
        }

        List<Number> equipmentIds = (List<Number>) body.get("equipmentIds");
        if (equipmentIds != null) {
            ex.setMaterielNecessaire(equipmentIds.stream()
                    .map(n -> equipmentRepository.findById(n.longValue()).orElse(null))
                    .filter(e -> e != null)
                    .collect(Collectors.toList()));
        }

        List<Number> goalIds = (List<Number>) body.get("goalIds");
        if (goalIds != null) {
            ex.setObjectifs(goalIds.stream()
                    .map(n -> goalRepository.findById(n.longValue()).orElse(null))
                    .filter(g -> g != null)
                    .collect(Collectors.toList()));
        }

        List<String> constraints = (List<String>) body.get("constraints");
        if (constraints != null) {
            ex.setContraintesPhysiques(constraints.stream()
                    .map(Constraint::valueOf)
                    .collect(Collectors.toList()));
        }

        String imgData = (String) body.get("img");
        if (imgData != null && !imgData.isEmpty()) {
            ex.setImg(imgData);
        } else {
            ex.setImg(null);
        }

        return ex;
    }
}
