package fr.startupweek.levelupapi.controllers;

import tools.jackson.databind.ObjectMapper;
import fr.startupweek.levelupapi.services.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ContactControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    // EmailService mocké : pas d'envoi réel en test
    @MockitoBean EmailService emailService;

    @Test
    void contact_retourne_ok_si_email_envoye_avec_succes() throws Exception {
        when(emailService.sendContactEmail(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(true);

        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "user@example.com",
                                "name", "Jean",
                                "subject", "Question",
                                "message", "Bonjour"
                        ))))
                .andExpect(status().isOk())
                .andExpect(content().string("\"ok\""));
    }

    @Test
    void contact_retourne_error_si_envoi_echoue() throws Exception {
        when(emailService.sendContactEmail(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(false);

        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "user@example.com",
                                "name", "Jean",
                                "subject", "Question",
                                "message", "Bonjour"
                        ))))
                .andExpect(status().isOk())
                .andExpect(content().string("\"error\""));
    }
}
