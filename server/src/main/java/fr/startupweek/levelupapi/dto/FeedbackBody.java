package fr.startupweek.levelupapi.dto;

import lombok.Data;

@Data
public class FeedbackBody {
    private Long userId;
    private String feedback;
    private String language; // "fr" or "en"
}
