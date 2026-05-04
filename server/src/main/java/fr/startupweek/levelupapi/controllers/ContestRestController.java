package fr.startupweek.levelupapi.controllers;

import fr.startupweek.levelupapi.models.Contest;
import fr.startupweek.levelupapi.models.ContestEntry;
import fr.startupweek.levelupapi.models.ContestEntryID;
import fr.startupweek.levelupapi.models.User;
import fr.startupweek.levelupapi.repositories.ContestEntryRepository;
import fr.startupweek.levelupapi.repositories.ContestRepository;
import fr.startupweek.levelupapi.repositories.UserRepository;
import fr.startupweek.levelupapi.services.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping(value = "/api/contests", produces = MediaType.APPLICATION_JSON_VALUE)
public class ContestRestController {

    @Autowired
    private ContestRepository contestRepository;

    @Autowired
    private ContestEntryRepository contestEntryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @GetMapping({"", "/"})
    public List<Contest> getAllContests() {
        return contestRepository.findAllByOrderByDateLimiteAsc();
    }

    @PostMapping({"", "/"})
    public ResponseEntity<?> createContest(@RequestBody Map<String, Object> body) {
        Contest contest = new Contest();
        contest.setTitre((String) body.get("titre"));
        contest.setDescription((String) body.get("description"));
        contest.setRecompense((String) body.get("recompense"));
        contest.setLevelRequis(((Number) body.get("levelRequis")).intValue());
        contest.setDateLimite(java.time.LocalDate.parse((String) body.get("dateLimite")));
        contest.setDateCreation(java.time.LocalDate.now());
        contest.setTirageEffectue(false);
        return ResponseEntity.ok(contestRepository.save(contest));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserEntries(@PathVariable Long userId) {
        List<ContestEntry> entries = contestEntryRepository.findAllByUserId(userId);
        List<Long> contestIds = entries.stream()
                .map(e -> e.getId().getContestId())
                .toList();
        return ResponseEntity.ok(contestIds);
    }

    @PostMapping("/{contestId}/enter")
    public ResponseEntity<?> enterContest(@PathVariable Long contestId, @RequestBody Map<String, Long> body) {
        Long userId = body.get("userId");
        if (userId == null) {
            return ResponseEntity.badRequest().body("\"missing_user_id\"");
        }

        Optional<Contest> contestOpt = contestRepository.findById(contestId);
        if (contestOpt.isEmpty()) {
            return ResponseEntity.status(404).body("\"contest_not_found\"");
        }

        Contest contest = contestOpt.get();

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("\"user_not_found\"");
        }

        User user = userOpt.get();

        if (user.getLevel() < contest.getLevelRequis()) {
            return ResponseEntity.status(403).body("\"level_insufficient\"");
        }

        if (contestEntryRepository.existsByContestIdAndUserId(contestId, userId)) {
            return ResponseEntity.status(409).body("\"already_registered\"");
        }

        ContestEntry entry = new ContestEntry();
        entry.setId(new ContestEntryID(contestId, userId));
        entry.setContest(contest);
        entry.setUser(user);
        entry.setInscritLe(LocalDateTime.now());
        contestEntryRepository.save(entry);

        emailService.sendContestConfirmationEmail(user.getEmail(), user.getPrenom(), contest.getTitre(), contest.getRecompense());

        return ResponseEntity.ok("\"registered\"");
    }

    @PostMapping("/{contestId}/withdraw")
    public ResponseEntity<?> withdrawContest(@PathVariable Long contestId, @RequestBody Map<String, Long> body) {
        Long userId = body.get("userId");
        if (userId == null) {
            return ResponseEntity.badRequest().body("\"missing_user_id\"");
        }

        ContestEntryID entryId = new ContestEntryID(contestId, userId);
        if (!contestEntryRepository.existsById(entryId)) {
            return ResponseEntity.status(404).body("\"entry_not_found\"");
        }

        contestEntryRepository.deleteById(entryId);
        return ResponseEntity.ok("\"withdrawn\"");
    }

    @PostMapping("/{contestId}/draw")
    public ResponseEntity<?> drawWinner(@PathVariable Long contestId, @RequestBody Map<String, Long> body) {
        Long adminId = body.get("adminId");
        if (adminId == null) {
            return ResponseEntity.badRequest().body("\"missing_admin_id\"");
        }

        Optional<User> adminOpt = userRepository.findById(adminId);
        if (adminOpt.isEmpty() || !adminOpt.get().isAdmin()) {
            return ResponseEntity.status(403).body("\"forbidden\"");
        }

        Optional<Contest> contestOpt = contestRepository.findById(contestId);
        if (contestOpt.isEmpty()) {
            return ResponseEntity.status(404).body("\"contest_not_found\"");
        }

        Contest contest = contestOpt.get();

        if (contest.isTirageEffectue()) {
            return ResponseEntity.status(409).body("\"draw_already_done\"");
        }

        List<ContestEntry> entries = contestEntryRepository.findAllByContestId(contestId);
        if (entries.isEmpty()) {
            return ResponseEntity.status(400).body("\"no_entries\"");
        }

        ContestEntry winner = entries.get(new Random().nextInt(entries.size()));
        contest.setGagnant(winner.getUser());
        contest.setTirageEffectue(true);
        contestRepository.save(contest);

        emailService.sendContestWinnerEmail(
                winner.getUser().getEmail(),
                winner.getUser().getPrenom(),
                contest.getTitre(),
                contest.getRecompense()
        );

        return ResponseEntity.ok(contest);
    }
}
