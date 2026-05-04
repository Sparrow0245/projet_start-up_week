package fr.startupweek.levelupapi.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import fr.startupweek.levelupapi.dto.ContactBody;
import fr.startupweek.levelupapi.services.EmailService;

@RestController
@RequestMapping(value = "/api/contact", produces = MediaType.APPLICATION_JSON_VALUE)
public class ContactController {

    @Autowired
    private EmailService emailService;

    /**
     * POST /contact
     * Envoie le message à l'équipe et un email de confirmation à l'utilisateur.
     */
    @PostMapping({"", "/"})
    public String contact(@RequestBody ContactBody request) {
        boolean sent = emailService.sendContactEmail(
                request.getEmail(),
                request.getName(),
                request.getSubject(),
                request.getMessage()
        );

        if (!sent) {
            return "\"error\"";
        }

        // Confirmation à l'utilisateur (best-effort, n'impacte pas la réponse)
        emailService.sendContactConfirmationEmail(
                request.getEmail(),
                request.getName(),
                request.getSubject()
        );

        return "\"ok\"";
    }
}
