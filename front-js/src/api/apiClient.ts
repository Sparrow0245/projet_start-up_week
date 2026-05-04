import type { Sport, Role, Equipment, Goal, Program, Session, Exercise, Contest } from '../types';

export const BASE_URL = import.meta.env.VITE_API_URL;

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface UserResponse {
	id: number;
	email: string;
	nom: string;
	prenom: string;
	sportChoisi: Sport | null;
	poste: Role | null;
	materielPossede: Equipment[] | null;
	blessures: string[] | null;
	coach: boolean;
	admin: boolean;
	coachApproved: boolean | null;
	experience: number;
	level: number;
}

export interface GenerateProgramBody {
	sportId: number;
	roleIds: number[];
	equipmentIds: number[];
	constraints: string[];
	goalIds: number[];
	sessionsPerWeek: number;
	durationWeeks: number;
	userId: number | null;
}

export interface ExerciseBody {
	coachId: number | null;
	nom: string;
	descriptionDetaillee: string;
	dureeMin: number;
	series: number;
	repTemps: string;
	sportId: number;
	roleIds: number[];
	equipmentIds: number[];
	goalIds: number[];
	intensite: string;
	constraints: string[];
}

export interface CoachInfo {
	id: number;
	prenom: string;
	nom: string;
	email: string;
	exerciseCount: number;
}

export interface CompleteSessionResponse {
	id: number;
	completedAt: string;
	xpGained: number;
	newExperience: number;
	prevLevel: number;
	newLevel: number;
	levelUp: boolean;
	unlockedContests: string[];
}

// Re-export types from types.ts for convenience
export type { Sport, Role, Equipment, Goal, Program, Session, Exercise, Contest };
