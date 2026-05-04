package fr.startupweek.levelupapi.enums;

import lombok.Getter;

@Getter
public enum Intensity {
    FAIBLE(5),
    MOYENNE(10),
    ELEVEE(20);

    private final int xpReward;

    Intensity(int xpReward) {
        this.xpReward = xpReward;
    }
}