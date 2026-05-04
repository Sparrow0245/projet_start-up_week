package fr.startupweek.levelupapi.dto;

import lombok.Data;

import java.util.List;

@Data
public class ProgramRequestBody {
    private Long sportId;
    private List<Long> roleIds;
    private List<Long> equipmentIds;
    private List<String> constraints;
    private List<Long> goalIds;
    private int sessionsPerWeek;
    private int durationWeeks;
    private Long userId;
}
