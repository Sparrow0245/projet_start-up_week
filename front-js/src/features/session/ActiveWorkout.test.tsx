import { screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders } from '../../test/utils';
import ActiveWorkout from './ActiveWorkout';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, string>) =>
			opts
				? Object.entries(opts).reduce((a, [k, v]) => a.replace(`{{${k}}}`, v), key)
				: key,
		i18n: { language: 'fr' },
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

// ─── Données de test ──────────────────────────────────────────────────────────

const MOCK_EXERCISE_1 = {
	id: 1,
	nom: 'Squat',
	descriptionDetaillee: 'Flexion genoux',
	dureeMin: 10,
	series: 3,
	repTemps: '12 reps',
	sport: { id: 1, nom: 'Football' },
	typesDeJoueur: [],
	materielNecessaire: [],
	objectifs: [],
	intensite: 'Modérée',
	xpGagnee: 10,
	contraintesPhysiques: [],
	img: null,
};

const MOCK_EXERCISE_2 = {
	...MOCK_EXERCISE_1,
	id: 2,
	nom: 'Fente',
	repTemps: '10 reps',
	dureeMin: 8,
};

const MOCK_SESSION: import('../../types').Session = {
	id: 42,
	jourNumero: 1,
	completedAt: null,
	exercices: [MOCK_EXERCISE_1, MOCK_EXERCISE_2],
};

const MOCK_PROGRAM: import('../../types').Program = {
	id: 10,
	dateCreation: '2026-03-01',
	durationWeeks: 8,
	sessions: [MOCK_SESSION],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ActiveWorkout', () => {
	beforeEach(() => {
		navigateMock.mockClear();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		cleanup();
	});

	// ─── État sans session ───────────────────────────────────────────────────

	it('affiche l\'état vide si pas de programme', () => {
		renderWithProviders(<ActiveWorkout />, {
			preloadedState: { program: { current: null, loading: false, error: null } },
		});
		expect(screen.getByText('workout.noSession')).toBeInTheDocument();
	});

	it('navigue vers /programme depuis l\'état vide', () => {
		renderWithProviders(<ActiveWorkout />, {
			preloadedState: { program: { current: null, loading: false, error: null } },
		});
		fireEvent.click(screen.getByRole('button', { name: 'workout.backToProgram' }));
		expect(navigateMock).toHaveBeenCalledWith('/programme');
	});

	// ─── Affichage exercice ──────────────────────────────────────────────────

	it('affiche le nom du premier exercice', () => {
		renderWithProviders(<ActiveWorkout />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		expect(screen.getByRole('heading', { name: 'Squat' })).toBeInTheDocument();
	});

	it('affiche l\'intensité de l\'exercice', () => {
		renderWithProviders(<ActiveWorkout />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		expect(screen.getByText('Modérée')).toBeInTheDocument();
	});

	it('affiche le compteur de progression (1 / 2)', () => {
		renderWithProviders(<ActiveWorkout />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		expect(screen.getByText('1 / 2')).toBeInTheDocument();
	});

	it('affiche le chronomètre à 00:00 initialement', () => {
		renderWithProviders(<ActiveWorkout />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		expect(screen.getByText('00:00')).toBeInTheDocument();
	});

	it('affiche le nombre de séries et répétitions', () => {
		renderWithProviders(<ActiveWorkout />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		expect(screen.getByText('3')).toBeInTheDocument(); // series
		expect(screen.getByText('12 reps')).toBeInTheDocument(); // repTemps
	});

	// ─── Chronomètre ────────────────────────────────────────────────────────

	it('le chronomètre démarre au clic Play', () => {
		renderWithProviders(<ActiveWorkout />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});

		// Trouver le bouton play/pause central (h-16 w-16)
		const playPauseBtn = document.querySelector('button.h-16.w-16.rounded-full.bg-primary');
		expect(playPauseBtn).toBeTruthy();

		act(() => {
			fireEvent.click(playPauseBtn!);
			vi.advanceTimersByTime(3000);
		});

		expect(screen.getByText('00:03')).toBeInTheDocument();
	});

	it('le chronomètre s\'arrête au clic Pause', () => {
		renderWithProviders(<ActiveWorkout />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});

		const playPauseBtn = document.querySelector('button.h-16.w-16.rounded-full.bg-primary')!;

		act(() => {
			fireEvent.click(playPauseBtn); // start
			vi.advanceTimersByTime(5000);
		});
		act(() => {
			fireEvent.click(playPauseBtn); // pause
			vi.advanceTimersByTime(3000); // 3 sec supplémentaires
		});

		// Doit rester à 00:05
		expect(screen.getByText('00:05')).toBeInTheDocument();
	});

	it('le bouton reset remet le chronomètre à 00:00', () => {
		renderWithProviders(<ActiveWorkout />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});

		const playPauseBtn = document.querySelector('button.h-16.w-16.rounded-full.bg-primary')!;
		act(() => {
			fireEvent.click(playPauseBtn);
			vi.advanceTimersByTime(5000);
		});

		const resetBtn = document.querySelector('button.h-12.w-12.rounded-full.border');
		expect(resetBtn).toBeTruthy();
		act(() => {
			fireEvent.click(resetBtn!);
		});

		expect(screen.getByText('00:00')).toBeInTheDocument();
	});

	// ─── Navigation entre exercices ──────────────────────────────────────────

	it('passe à l\'exercice suivant (phase repos) au clic Suivant', () => {
		renderWithProviders(<ActiveWorkout />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});

		fireEvent.click(screen.getByRole('button', { name: /workout\.next/i }));

		// Doit afficher la phase repos avec le prochain exercice
		expect(screen.getByText('workout.rest.title')).toBeInTheDocument();
		expect(screen.getByText('Fente')).toBeInTheDocument(); // nextUp
	});

	it('le bouton précédent est désactivé au premier exercice', () => {
		renderWithProviders(<ActiveWorkout />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});

		const prevBtn = screen.getByRole('button', { name: /workout\.prev/i });
		expect(prevBtn).toBeDisabled();
	});

	// ─── Fin de séance ───────────────────────────────────────────────────────

	it('appelle l\'API et affiche l\'écran de fin au dernier exercice', async () => {
		vi.useRealTimers(); // désactiver les faux timers pour ce test async
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ id: 42, completedAt: '2026-03-12' }),
		}));

		renderWithProviders(<ActiveWorkout />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});

		// Passer au dernier exercice (skip rest)
		fireEvent.click(screen.getByRole('button', { name: /workout\.next/i })); // → rest
		// Sauter le repos
		fireEvent.click(screen.getByRole('button', { name: /workout\.rest\.skip/i })); // → exo 2
		// Terminer
		fireEvent.click(screen.getByRole('button', { name: /workout\.finish/i }));

		await waitFor(() => {
			expect(screen.getByText('workout.finished.title')).toBeInTheDocument();
		});
	});

	it('navigue vers /programme depuis l\'écran de fin', async () => {
		vi.useRealTimers();
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ id: 42, completedAt: '2026-03-12' }),
		}));

		renderWithProviders(<ActiveWorkout />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});

		fireEvent.click(screen.getByRole('button', { name: /workout\.next/i }));
		fireEvent.click(screen.getByRole('button', { name: /workout\.rest\.skip/i }));
		fireEvent.click(screen.getByRole('button', { name: /workout\.finish/i }));

		await waitFor(() => screen.getByText('workout.finished.title'));

		fireEvent.click(screen.getByRole('button', { name: 'workout.finished.cta' }));
		expect(navigateMock).toHaveBeenCalledWith('/programme');
	});
});
