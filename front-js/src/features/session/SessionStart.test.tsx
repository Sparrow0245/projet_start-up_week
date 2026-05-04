import { screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders } from '../../test/utils';
import SessionStart from './SessionStart';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, string>) =>
			opts
				? Object.entries(opts).reduce((a, [k, v]) => a.replace(`{{${k}}}`, v), key)
				: key,
	}),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
	const mod = await importOriginal<typeof import('react-router-dom')>();
	return {
		...mod,
		useNavigate: () => navigateMock,
		useParams: () => ({ sessionIndex: '0' }),
	};
});

vi.mock('../../components/AppLayout', () => ({
	default: ({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) => (
		<div>
			{children}
			{footer}
		</div>
	),
}));

vi.mock('../../components/InfoRow', () => ({
	default: ({ children, label }: { children: React.ReactNode; label: string }) => (
		<div>
			<span>{label}</span>
			{children}
		</div>
	),
}));

// ─── Données de test ──────────────────────────────────────────────────────────

const MOCK_EXERCISE = {
	id: 1,
	nom: 'Squat',
	descriptionDetaillee: 'Flexion genoux',
	dureeMin: 10,
	series: 3,
	repTemps: '12 reps',
	sport: { id: 1, nom: 'Football' },
	typesDeJoueur: [],
	materielNecessaire: [{ id: 1, nom: 'Haltères', sport: { id: 1, nom: 'Football' } }],
	objectifs: [],
	intensite: 'Modérée',
	xpGagnee: 10,
	contraintesPhysiques: [],
	img: null,
};

const MOCK_EXERCISE_NO_EQUIP = {
	...MOCK_EXERCISE,
	id: 2,
	nom: 'Fente',
	materielNecessaire: [],
};

const MOCK_SESSION: import('../../types').Session = {
	id: 1,
	jourNumero: 1,
	completedAt: null,
	exercices: [MOCK_EXERCISE, MOCK_EXERCISE_NO_EQUIP],
};

const MOCK_PROGRAM: import('../../types').Program = {
	id: 10,
	dateCreation: '2026-03-01',
	durationWeeks: 8,
	sessions: [MOCK_SESSION],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SessionStart', () => {
	beforeEach(() => {
		navigateMock.mockClear();
	});

	afterEach(() => {
		cleanup();
	});

	// ─── État sans session ───────────────────────────────────────────────────

	it('affiche l\'état vide si pas de programme', () => {
		renderWithProviders(<SessionStart />, {
			preloadedState: { program: { current: null, loading: false, error: null } },
		});
		expect(screen.getByText('workout.noSession')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'workout.backToProgram' })).toBeInTheDocument();
	});

	it('navigue vers /programme depuis l\'état vide', () => {
		renderWithProviders(<SessionStart />, {
			preloadedState: { program: { current: null, loading: false, error: null } },
		});
		fireEvent.click(screen.getByRole('button', { name: 'workout.backToProgram' }));
		expect(navigateMock).toHaveBeenCalledWith('/programme');
	});

	// ─── Séance trouvée ──────────────────────────────────────────────────────

	it('affiche le titre de la séance', () => {
		renderWithProviders(<SessionStart />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		expect(screen.getByRole('heading', { name: 'program.session 1' })).toBeInTheDocument();
	});

	it('affiche la durée totale de la séance', () => {
		renderWithProviders(<SessionStart />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		// 10 + 10 = 20 min
		expect(screen.getByText(/20/)).toBeInTheDocument();
	});

	it('affiche le nombre d\'exercices', () => {
		renderWithProviders(<SessionStart />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		// L'InfoRow 'session.exerciseCount' contient le label + le nombre
		expect(screen.getByText('session.exerciseCount')).toBeInTheDocument();
		expect(screen.getAllByText(/2/).length).toBeGreaterThanOrEqual(1);
	});

	it('affiche le matériel requis', () => {
		renderWithProviders(<SessionStart />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		expect(screen.getByText('Haltères')).toBeInTheDocument();
	});

	it('affiche "aucun équipement" si aucun matériel requis', () => {
		const programNoEquip: import('../../types').Program = {
			...MOCK_PROGRAM,
			sessions: [{ ...MOCK_SESSION, exercices: [MOCK_EXERCISE_NO_EQUIP] }],
		};
		renderWithProviders(<SessionStart />, {
			preloadedState: { program: { current: programNoEquip, loading: false, error: null } },
		});
		expect(screen.getByText('session.noEquipment')).toBeInTheDocument();
	});

	it('affiche la liste des exercices', () => {
		renderWithProviders(<SessionStart />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		expect(screen.getByText('Squat')).toBeInTheDocument();
		expect(screen.getByText('Fente')).toBeInTheDocument();
	});

	// ─── Bouton Démarrer ─────────────────────────────────────────────────────

	it('affiche le bouton démarrer la séance', () => {
		renderWithProviders(<SessionStart />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		expect(screen.getByRole('button', { name: 'session.start' })).toBeInTheDocument();
	});

	it('navigue vers /session/0/workout au clic démarrer', () => {
		renderWithProviders(<SessionStart />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		fireEvent.click(screen.getByRole('button', { name: 'session.start' }));
		expect(navigateMock).toHaveBeenCalledWith('/session/0/workout');
	});
});
