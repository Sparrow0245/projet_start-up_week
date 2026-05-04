package fr.startupweek.levelupapi.controllers;

import fr.startupweek.levelupapi.dto.FeedbackBody;
import fr.startupweek.levelupapi.dto.ProgramRequestBody;
import fr.startupweek.levelupapi.enums.Constraint;
import fr.startupweek.levelupapi.models.Program;
import fr.startupweek.levelupapi.models.Session;
import fr.startupweek.levelupapi.models.User;
import fr.startupweek.levelupapi.models.Contest;
import fr.startupweek.levelupapi.repositories.ContestRepository;
import fr.startupweek.levelupapi.repositories.ProgramRepository;
import fr.startupweek.levelupapi.repositories.SessionRepository;
import fr.startupweek.levelupapi.repositories.UserRepository;
import fr.startupweek.levelupapi.repositories.SportRepository;
import fr.startupweek.levelupapi.repositories.RoleRepository;
import fr.startupweek.levelupapi.repositories.EquipmentRepository;
import fr.startupweek.levelupapi.services.GeminiService;
import fr.startupweek.levelupapi.services.ProgramService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping(value = "/api/programme", produces = MediaType.APPLICATION_JSON_VALUE)
public class ProgramRestController {

    @Autowired
    private ProgramService programService;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private ProgramRepository programRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContestRepository contestRepository;

    @Autowired
    private SportRepository sportRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @PostMapping({"/generate", "/generate/"})
    public ResponseEntity<?> generateProgram(@RequestBody ProgramRequestBody request) {
        List<Constraint> constraints = request.getConstraints() != null
                ? new java.util.ArrayList<>(request.getConstraints().stream()
                    .map(Constraint::valueOf)
                    .toList())
                : new java.util.ArrayList<>();

        int durationWeeks = request.getDurationWeeks() > 0 ? request.getDurationWeeks() : 8;

        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId()).orElse(null);
        }

        // Update user profile with questionnaire data
        if (user != null) {
            if (request.getSportId() != null) {
                sportRepository.findById(request.getSportId()).ifPresent(user::setSportChoisi);
            }
            if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
                roleRepository.findById(request.getRoleIds().get(0)).ifPresent(user::setPoste);
            }
            if (request.getEquipmentIds() != null) {
                List<fr.startupweek.levelupapi.models.Equipment> equips = new java.util.ArrayList<>();
                for (Long eqId : request.getEquipmentIds()) {
                    equipmentRepository.findById(eqId).ifPresent(equips::add);
                }
                user.setMaterielPossede(equips);
            }
            user.setBlessures(constraints);
            userRepository.save(user);
        }

        Program program = programService.generateProgram(
                request.getSportId(),
                request.getRoleIds(),
                request.getEquipmentIds(),
                constraints,
                request.getGoalIds(),
                request.getSessionsPerWeek(),
                durationWeeks,
                user
        );
        return ResponseEntity.ok(program);
    }

    @GetMapping({"/user/{userId}", "/user/{userId}/"})
    public ResponseEntity<?> getUserProgram(@PathVariable Long userId) {
        Optional<Program> program = programRepository.findTopByUserIdOrderByDateCreationDesc(userId);
        return program.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body("\"no_program\""));
    }

    @PutMapping({"/sessions/{sessionId}/complete", "/sessions/{sessionId}/complete/"})
    public ResponseEntity<?> completeSession(@PathVariable Long sessionId) {
        Optional<Session> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isEmpty()) {
            return ResponseEntity.status(404).body("\"session_not_found\"");
        }
        Session session = sessionOpt.get();
        session.setCompletedAt(LocalDate.now());
        sessionRepository.save(session);

        // ── Calcul XP côté serveur ────────────────────────────────────
        int xpGained = session.getExercices().stream()
                .mapToInt(ex -> ex.getIntensite() != null ? ex.getIntensite().getXpReward() : 0)
                .sum();

        // ── Mise à jour du User lié via le programme ──────────────────
        int prevLevel = 1;
        int newLevel = 1;
        int newExperience = 0;
        boolean levelUp = false;

        if (xpGained > 0 && session.getProgram() != null && session.getProgram().getUser() != null) {
            User user = session.getProgram().getUser();
            // Recharger depuis la base pour éviter les données périmées
            Optional<User> freshUser = userRepository.findById(user.getId());
            if (freshUser.isPresent()) {
                User u = freshUser.get();
                prevLevel = u.getLevel();
                u.setExperience(u.getExperience() + xpGained);
                u.recalculateLevel();
                userRepository.save(u);
                newLevel = u.getLevel();
                newExperience = u.getExperience();
                levelUp = newLevel > prevLevel;
            }
        }

        // ── Concours débloqués par le level-up ───────────────────────
        List<String> unlockedContests = new java.util.ArrayList<>();
        if (levelUp) {
            int finalPrevLevel = prevLevel;
            int finalNewLevel = newLevel;
            contestRepository.findAllByOrderByDateLimiteAsc().stream()
                    .filter(c -> c.getLevelRequis() > finalPrevLevel && c.getLevelRequis() <= finalNewLevel)
                    .map(Contest::getTitre)
                    .forEach(unlockedContests::add);
        }

        // ── Réponse enrichie ──────────────────────────────────────────
        Map<String, Object> response = new HashMap<>();
        response.put("id", session.getId());
        response.put("completedAt", session.getCompletedAt());
        response.put("xpGained", xpGained);
        response.put("newExperience", newExperience);
        response.put("prevLevel", prevLevel);
        response.put("newLevel", newLevel);
        response.put("levelUp", levelUp);
        response.put("unlockedContests", unlockedContests);
        return ResponseEntity.ok(response);
    }

    @PostMapping({"/feedback", "/feedback/"})
    public ResponseEntity<?> submitFeedback(@RequestBody FeedbackBody body) {
        if (body.getUserId() == null || body.getFeedback() == null || body.getFeedback().isBlank()) {
            return ResponseEntity.badRequest().body("\"missing_fields\"");
        }

        Optional<Program> programOpt = programRepository.findTopByUserIdOrderByDateCreationDesc(body.getUserId());
        if (programOpt.isEmpty()) {
            return ResponseEntity.status(404).body("\"no_program\"");
        }

        String lang = body.getLanguage() != null ? body.getLanguage() : "fr";

        try {
            Program updated = geminiService.reviseProgramWithFeedback(programOpt.get(), body.getFeedback(), lang);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            System.err.println("Gemini feedback error: " + e.getMessage());
            return ResponseEntity.status(500).body("\"gemini_error\"");
        }
    }
}
