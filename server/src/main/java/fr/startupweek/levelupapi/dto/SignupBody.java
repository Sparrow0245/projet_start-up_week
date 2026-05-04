package fr.startupweek.levelupapi.dto;

import lombok.Data;

@Data
public class SignupBody {
    private String prenom;
    private String nom;
    private String email;
    private String password;
    private boolean coach;
}