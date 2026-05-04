export interface Sport {
	id: number;
	nom: string;
}

export interface Role {
	id: number;
	nom: string;
	sport: Sport;
}

export interface Equipment {
	id: number;
	nom: string;
	sport: Sport;
}

export interface Goal {
	id: number;
	nom: string;
	sport: Sport;
}

export interface Exercise {
	id: number;
	nom: string;
	descriptionDetaillee: string;
	dureeMin: number;
	series: number;
	repTemps: string;
	sport: Sport;
	typesDeJoueur: Role[];
	materielNecessaire: Equipment[];
	objectifs: Goal[];
	intensite: string;
	contraintesPhysiques: string[];
	createdBy?: { id: number; prenom: string; nom: string } | null;
	xpGagnee:number;
	img: string | null;
}

export interface Session {
	id: number;
	jourNumero: number;
	completedAt: string | null;
	exercices: Exercise[];
}

export interface Program {
	id: number;
	dateCreation: string;
	durationWeeks: number;
	sessions: Session[];
}

export interface Contest {
	id: number;
	titre: string;
	description: string;
	recompense: string;
	levelRequis: number;
	dateLimite: string;
	dateCreation: string;
	tirageEffectue: boolean;
	gagnant: { id: number; prenom: string; nom: string } | null;
}
