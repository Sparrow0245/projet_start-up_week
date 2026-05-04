package fr.startupweek.levelupapi.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import fr.startupweek.levelupapi.enums.Constraint;
import fr.startupweek.levelupapi.enums.Intensity;
import fr.startupweek.levelupapi.models.*;
import fr.startupweek.levelupapi.repositories.EquipmentRepository;
import fr.startupweek.levelupapi.repositories.ExerciseRepository;
import fr.startupweek.levelupapi.repositories.GoalRepository;
import fr.startupweek.levelupapi.repositories.ProgramRepository;
import fr.startupweek.levelupapi.repositories.RoleRepository;
import fr.startupweek.levelupapi.repositories.SessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private ExerciseRepository exerciseRepository;

    @Autowired
    private GoalRepository goalRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ProgramRepository programRepository;

    @Autowired
    private SessionRepository sessionRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public enum FeedbackScope { ALL, NEXT }

    public static class FeedbackConstraints {
        public List<String> addConstraints       = new ArrayList<>();
        public List<String> removeConstraints    = new ArrayList<>();
        public List<String> addEquipmentNames    = new ArrayList<>();
        public List<String> removeEquipmentNames = new ArrayList<>();
        public List<String> addGoalNames         = new ArrayList<>();
        public List<String> removeGoalNames      = new ArrayList<>();
        public String       changeRoleName  = null;
        public String       intensityFilter = null;
        public FeedbackScope scope = FeedbackScope.ALL;
    }

    public Program reviseProgramWithFeedback(Program program, String feedback, String language) throws Exception {
        User user = program.getUser();

        Long sportIdForPrompt = resolveSportId(program);
        List<Equipment> allEquipment = (sportIdForPrompt != null)
                ? equipmentRepository.findBySportId(sportIdForPrompt)
                : equipmentRepository.findAll();
        String constraintsJson = callGeminiForConstraints(feedback, language, allEquipment);
        FeedbackConstraints fc = parseConstraints(constraintsJson);

        Long sportId = resolveSportId(program);

        Set<Long> userEquipmentIds = buildEquipmentSet(user, fc.addEquipmentNames, fc.removeEquipmentNames, allEquipment);
        Set<Constraint> combinedInjuries = buildCombinedInjuries(user, fc.addConstraints, fc.removeConstraints);
        Set<Long> activeGoalIds = buildGoalIds(user, fc.addGoalNames, fc.removeGoalNames, sportId);
        Set<Long> userRoleIds = buildRoleIds(user, fc.changeRoleName, sportId);

        List<Exercise> allExercises = (sportId != null)
                ? exerciseRepository.findBySportId(sportId)
                : exerciseRepository.findAll();

        List<Exercise> filtered = allExercises.stream()
                .filter(ex -> userHasAllEquipment(ex, userEquipmentIds))
                .filter(ex -> isSafeForUser(ex, combinedInjuries))
                .filter(ex -> matchesIntensity(ex, fc.intensityFilter))
                .collect(Collectors.toList());

        List<Exercise> scored = filtered.stream()
                .sorted(Comparator.comparingInt(
                        (Exercise ex) -> calculateScore(ex, userRoleIds, activeGoalIds)
                ).reversed())
                .collect(Collectors.toList());

        int poolSize = scored.size();
        if (poolSize == 0) return program;

        boolean onlyNext = fc.scope == FeedbackScope.NEXT;
        boolean nextDone = false;
        int sessionIndex = 0;
        for (Session session : program.getSessions()) {
            if (session.getCompletedAt() != null) continue;
            if (onlyNext && nextDone) break;

            int exosCount = Math.min(6, poolSize);
            int offset = (sessionIndex * 2) % poolSize;
            List<Exercise> newExos = new ArrayList<>();
            for (int j = 0; j < exosCount; j++) {
                newExos.add(scored.get((offset + j) % poolSize));
            }
            session.setExercices(newExos);
            sessionRepository.save(session);
            sessionIndex++;
            nextDone = true;
        }

        return programRepository.save(program);
    }

    private String callGeminiForConstraints(String feedback, String language, List<Equipment> allEquipment) throws Exception {
        String availableConstraints = Arrays.stream(Constraint.values())
                .filter(c -> c != Constraint.AUCUNE)
                .map(Enum::name)
                .collect(Collectors.joining(", "));

        String availableIntensities = Arrays.stream(Intensity.values())
                .map(Enum::name)
                .collect(Collectors.joining(", "));

        String availableEquipment = allEquipment.stream()
                .map(Equipment::getNom)
                .collect(Collectors.joining(", "));

        List<Goal> allGoals = allEquipment.isEmpty() ? goalRepository.findAll()
                : goalRepository.findBySportId(allEquipment.get(0).getSport().getId());
        String availableGoals = allGoals.stream()
                .map(Goal::getNom)
                .collect(Collectors.joining(", "));

        String prompt = """
                You are a sports training assistant. Analyze the feedback and extract structured data.
                The feedback may be in ANY language — understand it regardless.

                Available physical constraints : %s
                Available intensity levels     : %s
                Available equipment            : %s
                Available training goals       : %s

                User feedback: "%s"

                Reply ONLY with valid JSON, no markdown:
                {
                  "addConstraints"    : [],
                  "removeConstraints" : [],
                  "addEquipmentNames"    : [],
                  "removeEquipmentNames" : [],
                  "addGoalNames"    : [],
                  "removeGoalNames" : [],
                  "changeRoleName"  : null,
                  "intensityFilter" : null,
                  "scope"           : "ALL"
                }

                Rules:
                - addConstraints    : NEW physical limitations (e.g. "j'ai mal au genou" → GENOUX). From: %s.
                - removeConstraints : limitations the user says are GONE (e.g. "j'ai plus mal au genou"). From: %s.
                - addEquipmentNames : equipment the user NOW HAS. Exact names from: %s.
                - removeEquipmentNames : equipment the user NO LONGER HAS. Exact names from: %s.
                - addGoalNames    : training goals to prioritize (e.g. "je veux travailler l'endurance"). Exact names from: %s.
                - removeGoalNames : training goals to deprioritize. Exact names from: %s.
                - changeRoleName  : new player position/role if explicitly changed (e.g. "je joue maintenant défenseur"). Exact name from available roles, or null.
                - intensityFilter : exact intensity level if user explicitly requests a change. One of: %s. null if not mentioned.
                - scope           : "NEXT" if feedback applies only to the NEXT session (e.g. "aujourd'hui je suis fatigué", "juste pour demain"). "ALL" for permanent changes.
                - Use empty arrays / null for fields not mentioned.
                """.formatted(
                        availableConstraints, availableIntensities, availableEquipment, availableGoals,
                        feedback,
                        availableConstraints, availableConstraints,
                        availableEquipment, availableEquipment,
                        availableGoals, availableGoals,
                        availableIntensities);

        return callGemini(prompt);
    }

    private FeedbackConstraints parseConstraints(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            FeedbackConstraints fc = new FeedbackConstraints();

            JsonNode constraints = root.path("addConstraints");
            if (constraints.isArray()) {
                for (JsonNode c : constraints) {
                    try {
                        Constraint.valueOf(c.asText());
                        fc.addConstraints.add(c.asText());
                    } catch (IllegalArgumentException ignored) {}
                }
            }

            JsonNode removeConstraints = root.path("removeConstraints");
            if (removeConstraints.isArray()) {
                for (JsonNode c : removeConstraints) {
                    try {
                        Constraint.valueOf(c.asText());
                        fc.removeConstraints.add(c.asText());
                    } catch (IllegalArgumentException ignored) {}
                }
            }

            JsonNode addEquipment = root.path("addEquipmentNames");
            if (addEquipment.isArray()) {
                for (JsonNode e : addEquipment) fc.addEquipmentNames.add(e.asText());
            }

            JsonNode removeEquipment = root.path("removeEquipmentNames");
            if (removeEquipment.isArray()) {
                for (JsonNode e : removeEquipment) fc.removeEquipmentNames.add(e.asText());
            }

            JsonNode addGoals = root.path("addGoalNames");
            if (addGoals.isArray()) {
                for (JsonNode g : addGoals) fc.addGoalNames.add(g.asText());
            }

            JsonNode removeGoals = root.path("removeGoalNames");
            if (removeGoals.isArray()) {
                for (JsonNode g : removeGoals) fc.removeGoalNames.add(g.asText());
            }

            JsonNode role = root.path("changeRoleName");
            if (!role.isNull() && role.isTextual()) {
                fc.changeRoleName = role.asText();
            }

            JsonNode intensity = root.path("intensityFilter");
            if (!intensity.isNull() && intensity.isTextual()) {
                try {
                    Intensity.valueOf(intensity.asText());
                    fc.intensityFilter = intensity.asText();
                } catch (IllegalArgumentException ignored) {}
            }

            JsonNode scope = root.path("scope");
            if (!scope.isNull() && scope.isTextual() && "NEXT".equals(scope.asText())) {
                fc.scope = FeedbackScope.NEXT;
            }

            return fc;
        } catch (Exception e) {
            return new FeedbackConstraints();
        }
    }

    private Set<Long> buildEquipmentSet(User user, List<String> addNames, List<String> removeNames, List<Equipment> allEquipment) {
        Set<Long> ids = new HashSet<>();
        if (user != null && user.getMaterielPossede() != null)
            user.getMaterielPossede().forEach(eq -> ids.add(eq.getId()));

        if (!addNames.isEmpty()) {
            Set<String> toAdd = addNames.stream().map(String::toLowerCase).collect(Collectors.toSet());
            allEquipment.stream()
                    .filter(eq -> toAdd.contains(eq.getNom().toLowerCase()))
                    .forEach(eq -> ids.add(eq.getId()));
        }

        if (!removeNames.isEmpty()) {
            Set<String> toRemove = removeNames.stream().map(String::toLowerCase).collect(Collectors.toSet());
            allEquipment.stream()
                    .filter(eq -> toRemove.contains(eq.getNom().toLowerCase()))
                    .forEach(eq -> ids.remove(eq.getId()));
        }

        return ids;
    }

    private Set<Constraint> buildCombinedInjuries(User user, List<String> addConstraints, List<String> removeConstraints) {
        Set<Constraint> injuries = new HashSet<>();
        if (user != null && user.getBlessures() != null) injuries.addAll(user.getBlessures());

        for (String c : addConstraints) {
            try { injuries.add(Constraint.valueOf(c)); } catch (IllegalArgumentException ignored) {}
        }

        for (String c : removeConstraints) {
            try { injuries.remove(Constraint.valueOf(c)); } catch (IllegalArgumentException ignored) {}
        }

        injuries.remove(Constraint.AUCUNE);
        return injuries;
    }

    private Set<Long> buildRoleIds(User user, String changeRoleName, Long sportId) {
        Set<Long> ids = new HashSet<>();
        if (changeRoleName != null && !changeRoleName.isBlank()) {
            List<Role> roles = (sportId != null)
                    ? roleRepository.findBySportId(sportId)
                    : roleRepository.findAll();
            roles.stream()
                    .filter(r -> r.getNom().equalsIgnoreCase(changeRoleName.trim()))
                    .findFirst()
                    .ifPresent(r -> ids.add(r.getId()));
        } else if (user != null && user.getPoste() != null) {
            ids.add(user.getPoste().getId());
        }
        return ids;
    }

    private Set<Long> buildGoalIds(User user, List<String> addGoalNames, List<String> removeGoalNames, Long sportId) {
        Set<Long> ids = new HashSet<>();

        List<Goal> allGoals = (sportId != null)
                ? goalRepository.findBySportId(sportId)
                : goalRepository.findAll();

        Map<String, Long> goalsByName = allGoals.stream()
                .collect(Collectors.toMap(
                        g -> g.getNom().toLowerCase(),
                        Goal::getId,
                        (a, b) -> a));

        for (String name : addGoalNames) {
            Long id = goalsByName.get(name.toLowerCase());
            if (id != null) ids.add(id);
        }

        for (String name : removeGoalNames) {
            Long id = goalsByName.get(name.toLowerCase());
            if (id != null) ids.remove(id);
        }

        if (ids.isEmpty() && addGoalNames.isEmpty()) {
            allGoals.forEach(g -> ids.add(g.getId()));
        }

        return ids;
    }

    private Long resolveSportId(Program program) {
        if (program.getUser() != null && program.getUser().getSportChoisi() != null)
            return program.getUser().getSportChoisi().getId();
        if (program.getSessions() != null) {
            for (Session s : program.getSessions()) {
                if (s.getExercices() != null && !s.getExercices().isEmpty()) {
                    Exercise ex = s.getExercices().get(0);
                    if (ex.getSport() != null) return ex.getSport().getId();
                }
            }
        }
        return null;
    }

    private boolean userHasAllEquipment(Exercise exercise, Set<Long> userEquipmentIds) {
        if (exercise.getMaterielNecessaire() == null || exercise.getMaterielNecessaire().isEmpty()) return true;
        return exercise.getMaterielNecessaire().stream()
                .allMatch(eq -> userEquipmentIds.contains(eq.getId()));
    }

    private boolean isSafeForUser(Exercise exercise, Set<Constraint> userInjuries) {
        if (userInjuries.isEmpty()) return true;
        if (exercise.getContraintesPhysiques() == null || exercise.getContraintesPhysiques().isEmpty()) return true;
        if (exercise.getContraintesPhysiques().contains(Constraint.AUCUNE)) return true;
        return Collections.disjoint(exercise.getContraintesPhysiques(), userInjuries);
    }

    private boolean matchesIntensity(Exercise exercise, String intensityFilter) {
        if (intensityFilter == null) return true;
        if (exercise.getIntensite() == null) return true;
        return exercise.getIntensite().name().equals(intensityFilter);
    }

    private int calculateScore(Exercise ex, Set<Long> roleIds, Set<Long> goalIds) {
        int score = 0;
        if (!roleIds.isEmpty() && ex.getTypesDeJoueur() != null) {
            if (ex.getTypesDeJoueur().stream().anyMatch(r -> roleIds.contains(r.getId()))) score += 10;
        }
        if (!goalIds.isEmpty() && ex.getObjectifs() != null) {
            long matches = ex.getObjectifs().stream().filter(g -> goalIds.contains(g.getId())).count();
            score += (int) (matches * 5);
        }
        return score;
    }

    private String callGemini(String prompt) throws Exception {
        String escapedPrompt = prompt
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");

        String requestBody = """
                {
                  "contents": [{ "parts": [{ "text": "%s" }] }],
                  "generationConfig": {
                    "temperature": 0.1,
                    "responseMimeType": "application/json"
                  }
                }
                """.formatted(escapedPrompt);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_API_URL + "?key=" + geminiApiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 300) {
            throw new RuntimeException("Gemini API error (" + response.statusCode() + "): " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        return root.path("candidates").get(0)
                   .path("content").path("parts").get(0)
                   .path("text").asText();
    }
}
