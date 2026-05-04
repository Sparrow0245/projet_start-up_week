package fr.startupweek.levelupapi.dto;

import lombok.Data;

@Data
public class ContactBody {
    private String email;
    private String name;
    private String subject;
    private String message;
}
