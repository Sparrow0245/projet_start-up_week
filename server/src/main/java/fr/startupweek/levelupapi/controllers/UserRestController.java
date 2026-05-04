package fr.startupweek.levelupapi.controllers;

import fr.startupweek.levelupapi.dto.LoginBody;
import fr.startupweek.levelupapi.dto.SignupBody;
import fr.startupweek.levelupapi.models.EmailVerificationToken;
import fr.startupweek.levelupapi.models.Exercise;
import fr.startupweek.levelupapi.models.User;
import fr.startupweek.levelupapi.repositories.EmailVerificationTokenRepository;
import fr.startupweek.levelupapi.repositories.ExerciseRepository;
import fr.startupweek.levelupapi.repositories.UserRepository;
import fr.startupweek.levelupapi.services.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping(value = "/api/users", produces = MediaType.APPLICATION_JSON_VALUE)
public class UserRestController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Autowired
    EmailService emailService;

    @Autowired
    ExerciseRepository exerciseRepository;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @GetMapping({"", "/"})
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<User> user = userRepository.findById(id);
        return user.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body("\"error\""));
    }
    @PostMapping({"/login", "/login/"})
    public ResponseEntity<?> login(@RequestBody LoginBody request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body("\"error\"");
        }
        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body("\"error\"");
        }
        if (!user.isEmailVerified()) {
            return ResponseEntity.status(403).body("\"email_not_verified\"");
        }
        return ResponseEntity.ok(user);
    }

    @PostMapping({"/signup", "/signup/"})
    public ResponseEntity<?> signup(@RequestBody SignupBody request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(409).body("\"error\"");
        }
        User newUser = new User();
        newUser.setPrenom(request.getPrenom());
        newUser.setNom(request.getNom());
        newUser.setEmail(request.getEmail());
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.setCoach(request.isCoach());
        if (request.isCoach()) {
            newUser.setCoachApproved(false);
        }
        newUser.setEmailVerified(false);
        User saved = userRepository.save(newUser);

        // Générer un token de vérification d'email (valide 24h)
        String token = UUID.randomUUID().toString();
        EmailVerificationToken verificationToken = new EmailVerificationToken();
        verificationToken.setToken(token);
        verificationToken.setEmail(saved.getEmail());
        verificationToken.setExpiresAt(LocalDateTime.now().plusHours(24));
        verificationToken.setUsed(false);
        emailVerificationTokenRepository.save(verificationToken);

        String verifyLink = frontendUrl + "/verify-email?token=" + token;
        emailService.sendEmailVerificationEmail(saved.getEmail(), saved.getPrenom(), verifyLink);

        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/experience/increment")
    public ResponseEntity<?> incrementExperience(@PathVariable Long id, @RequestBody int xpToAdd) {
        return userRepository.findById(id).map(user -> {
            int prevXp = user.getExperience();
            int prevLevel = User.computeLevel(prevXp);

            user.setExperience(prevXp + xpToAdd);
            User updatedUser = userRepository.save(user);

            int newXp = updatedUser.getExperience();
            int newLevel = updatedUser.getLevel();

            Map<String, Object> response = new java.util.HashMap<>();
            response.put("xpGained", xpToAdd);
            response.put("newExperience", newXp);
            response.put("prevLevel", prevLevel);
            response.put("newLevel", newLevel);
            response.put("levelUp", newLevel > prevLevel);
            response.put("unlockedContests", java.util.List.of());
            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ─── Admin endpoints ──────────────────────────────────────────────────────

    @GetMapping("/admin/coaches/pending")
    public ResponseEntity<?> getPendingCoaches() {
        return ResponseEntity.ok(userRepository.findByIsCoachTrueAndCoachApprovedFalse());
    }

    @GetMapping("/admin/coaches/approved")
    public ResponseEntity<?> getApprovedCoaches() {
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (User coach : userRepository.findByIsCoachTrueAndCoachApprovedTrue()) {
            Map<String, Object> item = new java.util.HashMap<>();
            item.put("id", coach.getId());
            item.put("prenom", coach.getPrenom());
            item.put("nom", coach.getNom());
            item.put("email", coach.getEmail());
            item.put("exerciseCount", exerciseRepository.findByCreatedById(coach.getId()).size());
            result.add(item);
        }
        return ResponseEntity.ok(result);
    }

    @PutMapping("/admin/coaches/{id}/approve")
    public ResponseEntity<?> approveCoach(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty() || !userOpt.get().isCoach()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOpt.get();
        user.setCoachApproved(true);
        userRepository.save(user);
        emailService.sendCoachApprovedEmail(user.getEmail(), user.getPrenom());
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/admin/coaches/{id}/reject")
    public ResponseEntity<?> rejectCoach(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty() || !userOpt.get().isCoach()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOpt.get();
        String email = user.getEmail();
        String prenom = user.getPrenom();
        userRepository.delete(user);
        emailService.sendCoachRejectedEmail(email, prenom);
        return ResponseEntity.ok("\"deleted\"");
    }

    @DeleteMapping("/admin/coaches/{id}")
    public ResponseEntity<?> deleteCoach(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty() || !userOpt.get().isCoach()) {
            return ResponseEntity.notFound().build();
        }
        for (Exercise ex : exerciseRepository.findByCreatedById(id)) {
            ex.setCreatedBy(null);
            exerciseRepository.save(ex);
        }
        userRepository.delete(userOpt.get());
        return ResponseEntity.ok("\"deleted\"");
    }
}
