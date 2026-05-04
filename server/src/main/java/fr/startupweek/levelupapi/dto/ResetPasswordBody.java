package fr.startupweek.levelupapi.dto;

import lombok.Data;

@Data
public class ResetPasswordBody {
    private String token;
    private String newPassword;
}
