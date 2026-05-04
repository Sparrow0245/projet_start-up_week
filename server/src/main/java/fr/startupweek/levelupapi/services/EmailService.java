package fr.startupweek.levelupapi.services;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    /**
     * Envoie un email via l'API transactionnelle Brevo.
     * @return true si l'envoi a réussi, false sinon
     */
    public boolean sendEmail(String toEmail, String toName, String subject, String htmlContent) {
        String jsonBody = """
                {
                    "sender": { "name": "Level Up", "email": "contact@app-levelup.fr" },
                    "to": [{ "email": "%s", "name": "%s" }],
                    "subject": "%s",
                    "htmlContent": "%s"
                }
                """.formatted(
                escapeJson(toEmail),
                escapeJson(toName),
                escapeJson(subject),
                escapeJson(htmlContent));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BREVO_API_URL))
                .header("accept", "application/json")
                .header("content-type", "application/json")
                .header("api-key", brevoApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 300) {
                System.err.println("Brevo API error (" + response.statusCode() + "): " + response.body());
                return false;
            }
            return true;
        } catch (Exception e) {
            System.err.println("Failed to send email via Brevo: " + e.getMessage());
            return false;
        }
    }

    /**
     * Envoie l'email de réinitialisation de mot de passe.
     */
    public boolean sendPasswordResetEmail(String toEmail, String prenom, String resetLink) {
        String subject = "Level Up — Reset your password";
        String html = """
                <div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;'>
                    <div style='text-align:center;margin-bottom:24px;'>
                        <h1 style='color:#E07878;font-size:24px;margin:0;'>Level Up</h1>
                    </div>
                    <p style='color:#3D3D3D;font-size:15px;'>Hi <strong>%s</strong>,</p>
                    <p style='color:#3D3D3D;font-size:15px;'>
                        You requested a password reset. 
                        Click the button below to set a new one:
                    </p>
                    <div style='text-align:center;margin:32px 0;'>
                        <a href='%s' style='background-color:#E07878;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:bold;font-size:15px;display:inline-block;'>
                            Reset my password
                        </a>
                    </div>
                    <p style='color:#999;font-size:13px;'>
                        This link is valid for 30 minutes. If you did not request this reset, please ignore this email.
                    </p>
                    <hr style='border:none;border-top:1px solid #eee;margin:24px 0;' />
                    <p style='color:#bbb;font-size:11px;text-align:center;'>
                        © 2026 Level Up — All rights reserved
                    </p>
                </div>
                """.formatted(escapeJson(prenom), escapeJson(resetLink));

        return sendEmail(toEmail, prenom, subject, html);
    }

    /**
     * Envoie l'email de vérification d'adresse email après inscription.
     */
    public boolean sendEmailVerificationEmail(String toEmail, String prenom, String verifyLink) {
        String subject = "Level Up — Verify your email address";
        String html = """
                <div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;'>
                    <div style='text-align:center;margin-bottom:24px;'>
                        <h1 style='color:#E07878;font-size:24px;margin:0;'>Level Up</h1>
                    </div>
                    <p style='color:#3D3D3D;font-size:15px;'>Hi <strong>%s</strong>,</p>
                    <p style='color:#3D3D3D;font-size:15px;'>
                        Welcome to Level Up! Please verify your email address by clicking the button below:
                    </p>
                    <div style='text-align:center;margin:32px 0;'>
                        <a href='%s' style='background-color:#E07878;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:bold;font-size:15px;display:inline-block;'>
                            Verify my email
                        </a>
                    </div>
                    <p style='color:#999;font-size:13px;'>
                        This link is valid for 24 hours. If you did not create a Level Up account, please ignore this email.
                    </p>
                    <hr style='border:none;border-top:1px solid #eee;margin:24px 0;' />
                    <p style='color:#bbb;font-size:11px;text-align:center;'>
                        © 2026 Level Up — All rights reserved
                    </p>
                </div>
                """.formatted(escapeJson(prenom), escapeJson(verifyLink));

        return sendEmail(toEmail, prenom, subject, html);
    }

    /**
     */
    public boolean sendContactEmail(String fromEmail, String fromName, String subject, String message) {
        String html = """
                <div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;'>
                    <div style='text-align:center;margin-bottom:24px;'>
                        <h1 style='color:#E07878;font-size:24px;margin:0;'>Level Up — Contact</h1>
                    </div>
                    <p style='color:#3D3D3D;font-size:15px;'><strong>From:</strong> %s (%s)</p>
                    <p style='color:#3D3D3D;font-size:15px;'><strong>Subject:</strong> %s</p>
                    <hr style='border:none;border-top:1px solid #eee;margin:16px 0;' />
                    <p style='color:#3D3D3D;font-size:15px;white-space:pre-line;'>%s</p>
                    <hr style='border:none;border-top:1px solid #eee;margin:24px 0;' />
                    <p style='color:#bbb;font-size:11px;text-align:center;'>© 2026 Level Up — All rights reserved</p>
                </div>
                """.formatted(escapeJson(fromName), escapeJson(fromEmail), escapeJson(subject), escapeJson(message));

        return sendEmail("contact@app-levelup.fr", "Level Up Team", "New contact message: " + subject, html);
    }

    /**
     * Envoie un email de confirmation à l'utilisateur qui a soumis le formulaire.
     */
    public boolean sendContactConfirmationEmail(String toEmail, String toName, String subject) {
        String html = """
                <div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;'>
                    <div style='text-align:center;margin-bottom:24px;'>
                        <h1 style='color:#E07878;font-size:24px;margin:0;'>Level Up</h1>
                    </div>
                    <p style='color:#3D3D3D;font-size:15px;'>Hi <strong>%s</strong>,</p>
                    <p style='color:#3D3D3D;font-size:15px;'>
                        We have received your message regarding <strong>"%s"</strong>.
                        Our team will get back to you as soon as possible.
                    </p>
                    <p style='color:#3D3D3D;font-size:15px;'>
                        Thank you for reaching out!
                    </p>
                    <hr style='border:none;border-top:1px solid #eee;margin:24px 0;' />
                    <p style='color:#bbb;font-size:11px;text-align:center;'>© 2026 Level Up — All rights reserved</p>
                </div>
                """.formatted(escapeJson(toName), escapeJson(subject));

        return sendEmail(toEmail, toName, "Level Up — We received your message", html);
    }

    public boolean sendCoachApprovedEmail(String toEmail, String prenom) {
        String subject = "Level Up — Votre compte coach est validé !";
        String html = """
                <div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;'>
                    <div style='text-align:center;margin-bottom:24px;'>
                        <h1 style='color:#E07878;font-size:24px;margin:0;'>Level Up</h1>
                    </div>
                    <p style='color:#3D3D3D;font-size:15px;'>Bonjour <strong>%s</strong>,</p>
                    <p style='color:#3D3D3D;font-size:15px;'>
                        Bonne nouvelle ! Votre demande de compte coach a été approuvée par notre équipe.
                        Vous pouvez désormais créer et gérer des exercices sur Level Up.
                    </p>
                    <p style='color:#3D3D3D;font-size:15px;'>
                        Bienvenue dans l'équipe des coachs Level Up !
                    </p>
                    <hr style='border:none;border-top:1px solid #eee;margin:24px 0;' />
                    <p style='color:#bbb;font-size:11px;text-align:center;'>
                        © 2026 Level Up — All rights reserved
                    </p>
                </div>
                """.formatted(escapeJson(prenom));

        return sendEmail(toEmail, prenom, subject, html);
    }

    public boolean sendCoachRejectedEmail(String toEmail, String prenom) {
        String subject = "Level Up — Demande de compte coach";
        String html = """
                <div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;'>
                    <div style='text-align:center;margin-bottom:24px;'>
                        <h1 style='color:#E07878;font-size:24px;margin:0;'>Level Up</h1>
                    </div>
                    <p style='color:#3D3D3D;font-size:15px;'>Bonjour <strong>%s</strong>,</p>
                    <p style='color:#3D3D3D;font-size:15px;'>
                        Nous avons examiné votre demande de compte coach et nous ne sommes malheureusement
                        pas en mesure de la valider pour le moment. Votre compte a été supprimé.
                    </p>
                    <p style='color:#3D3D3D;font-size:15px;'>
                        N'hésitez pas à nous contacter si vous avez des questions.
                    </p>
                    <hr style='border:none;border-top:1px solid #eee;margin:24px 0;' />
                    <p style='color:#bbb;font-size:11px;text-align:center;'>
                        © 2026 Level Up — All rights reserved
                    </p>
                </div>
                """.formatted(escapeJson(prenom));

        return sendEmail(toEmail, prenom, subject, html);
    }

    public boolean sendContestConfirmationEmail(String toEmail, String prenom, String concoursTitre, String recompense) {
        String subject = "Level Up — Inscription au concours confirmée !";
        String html = """
                <div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;'>
                    <div style='text-align:center;margin-bottom:24px;'>
                        <h1 style='color:#E07878;font-size:24px;margin:0;'>Level Up</h1>
                    </div>
                    <p style='color:#3D3D3D;font-size:15px;'>Bonjour <strong>%s</strong>,</p>
                    <p style='color:#3D3D3D;font-size:15px;'>
                        Votre inscription au concours <strong>"%s"</strong> a bien été enregistrée.
                    </p>
                    <p style='color:#3D3D3D;font-size:15px;'>
                        🎁 Récompense en jeu : <strong>%s</strong>
                    </p>
                    <p style='color:#3D3D3D;font-size:15px;'>
                        Un tirage au sort sera effectué à la clôture du concours. Bonne chance !
                    </p>
                    <hr style='border:none;border-top:1px solid #eee;margin:24px 0;' />
                    <p style='color:#bbb;font-size:11px;text-align:center;'>© 2026 Level Up — All rights reserved</p>
                </div>
                """.formatted(escapeJson(prenom), escapeJson(concoursTitre), escapeJson(recompense));

        return sendEmail(toEmail, prenom, subject, html);
    }

    public boolean sendContestWinnerEmail(String toEmail, String prenom, String concoursTitre, String recompense) {
        String subject = "Level Up — 🎉 Vous avez gagné le concours !";
        String html = """
                <div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;'>
                    <div style='text-align:center;margin-bottom:24px;'>
                        <h1 style='color:#E07878;font-size:24px;margin:0;'>Level Up</h1>
                    </div>
                    <p style='color:#3D3D3D;font-size:15px;'>Félicitations <strong>%s</strong> ! 🎉</p>
                    <p style='color:#3D3D3D;font-size:15px;'>
                        Vous avez été tiré(e) au sort comme gagnant(e) du concours <strong>"%s"</strong> !
                    </p>
                    <p style='color:#3D3D3D;font-size:15px;'>
                        🎁 Votre récompense : <strong>%s</strong>
                    </p>
                    <p style='color:#3D3D3D;font-size:15px;'>
                        Notre équipe vous contactera prochainement pour vous remettre votre prix.
                    </p>
                    <hr style='border:none;border-top:1px solid #eee;margin:24px 0;' />
                    <p style='color:#bbb;font-size:11px;text-align:center;'>© 2026 Level Up — All rights reserved</p>
                </div>
                """.formatted(escapeJson(prenom), escapeJson(concoursTitre), escapeJson(recompense));

        return sendEmail(toEmail, prenom, subject, html);
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
