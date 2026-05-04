package fr.startupweek.levelupapi.dto;

import lombok.Data;

@Data
public class LoginBody {
    private String email;
    private String password;
}