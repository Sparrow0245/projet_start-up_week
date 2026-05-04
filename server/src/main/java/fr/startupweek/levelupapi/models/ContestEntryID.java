package fr.startupweek.levelupapi.models;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@AllArgsConstructor
@NoArgsConstructor
@Data
public class ContestEntryID implements Serializable {
    private Long contestId;
    private Long userId;
}
