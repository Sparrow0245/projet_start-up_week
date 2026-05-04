import { screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders } from '../../test/utils';
import Home from './Home';

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
vi.mock('react-router', async (importOriginal) => {
	const mod = await importOriginal<typeof import('react-router')>();
	return { ...mod, useNavigate: () => navigateMock };
});

vi.mock('../../components/AppLayout', () => ({
	default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
	materielNecessaire: [],
	objectifs: [],
	intensite: 'Modérée',
	xpGagnee: 10,
	contraintesPhysiques: [],
	img: null,
};

const MOCK_SESSION_1: import('../../types').Session = {
	id: 1,
	jourNumero: 1,
	completedAt: null,
	exercices: [MOCK_EXERCISE, { ...MOCK_EXERCISE, id: 2, nom: 'Fente', dureeMin: 8 }],
};

const MOCK_SESSION_2: import('../../types').Session = {
	id: 2,
	jourNumero: 2,
	completedAt: null,
	exercices: [{ ...MOCK_EXERCISE, id: 3, nom: 'Pompes', dureeMin: 5 }],
};

const MOCK_PROGRAM: import('../../types').Program = {
	id: 10,
	dateCreation: '2026-03-01',
	durationWeeks: 8,
	sessions: [MOCK_SESSION_1, MOCK_SESSION_2],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Home', () => {
	beforeEach(() => {
		navigateMock.mockClear();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		cleanup();
	});

	// ─── Affichage du prénom ─────────────────────────────────────────────────

	it('affiche le prénom de l\'utilisateur quand disponible', () => {
		renderWithProviders(<Home />, {
			preloadedState: { auth: { isAuthenticated: true, userId: 1, userPrenom: 'Gabriel' } },
		});
		expect(screen.getByText('home.greeting')).toBeInTheDocument();
	});

	it('affiche le salut générique sans prénom', () => {
		renderWithProviders(<Home />, {
			preloadedState: { auth: { isAuthenticated: true, userId: 1, userPrenom: null } },
		});
		expect(screen.getByText('home.greetingDefault')).toBeInTheDocument();
	});

	// ─── État sans programme ─────────────────────────────────────────────────

	it('affiche le CTA créer programme quand pas de programme', () => {
		renderWithProviders(<Home />, {
			preloadedState: {
				auth: { isAuthenticated: true, userId: null },
				program: { current: null, loading: false, error: null },
			},
		});
		expect(screen.getByText('home.noProgram.cta')).toBeInTheDocument();
	});

	it('navigue vers /sportForm au clic CTA sans programme', () => {
		renderWithProviders(<Home />, {
			preloadedState: {
				auth: { isAuthenticated: true, userId: null },
				program: { current: null, loading: false, error: null },
			},
		});
		fireEvent.click(screen.getByText('home.noProgram.cta'));
		expect(navigateMock).toHaveBeenCalledWith('/sportForm');
	});

	// ─── État chargement ─────────────────────────────────────────────────────

	it('affiche le spinner pendant le chargement', () => {
		renderWithProviders(<Home />, {
			preloadedState: {
				auth: { isAuthenticated: true, userId: 1 },
				program: { current: null, loading: true },
			},
		});
		// Le spinner est un div avec animate-spin
		expect(document.querySelector('.animate-spin')).toBeInTheDocument();
	});

	// ─── Programme chargé : stats ────────────────────────────────────────────

	it('affiche le nombre de séances dans les stats', () => {
		renderWithProviders(<Home />, {
			preloadedState: {
				auth: { isAuthenticated: true, userId: 1 },
				program: { current: MOCK_PROGRAM, loading: false, error: null },
			},
		});
		// 2 sessions
		expect(screen.getByText('2')).toBeInTheDocument();
	});

	it('affiche le total d\'exercices correct', () => {
		renderWithProviders(<Home />, {
			preloadedState: {
				auth: { isAuthenticated: true, userId: 1 },
				program: { current: MOCK_PROGRAM, loading: false, error: null },
			},
		});
		// session1 a 2 exos, session2 a 1 exo → total 3
		expect(screen.getByText('3')).toBeInTheDocument();
	});

	it('affiche la durée totale correcte', () => {
		renderWithProviders(<Home />, {
			preloadedState: {
				auth: { isAuthenticated: true, userId: 1 },
				program: { current: MOCK_PROGRAM, loading: false, error: null },
			},
		});
		// 10+8+5 = 23 min
		expect(screen.getByText('23')).toBeInTheDocument();
	});

	// ─── Prochaine séance ────────────────────────────────────────────────────

	it('affiche la prochaine séance quand programme présent', () => {
		renderWithProviders(<Home />, {
			preloadedState: {
				auth: { isAuthenticated: true, userId: 1 },
				program: { current: MOCK_PROGRAM, loading: false, error: null },
			},
		});
		expect(screen.getByText('home.nextSession.label')).toBeInTheDocument();
	});

	it('affiche toutes terminées quand toutes les séances sont complétées cette semaine', () => {
		const today = new Date().toISOString();
		const programDone: import('../../types').Program = {
			...MOCK_PROGRAM,
			sessions: [
				{ ...MOCK_SESSION_1, completedAt: today },
				{ ...MOCK_SESSION_2, completedAt: today },
			],
		};
		renderWithProviders(<Home />, {
			preloadedState: {
				auth: { isAuthenticated: true, userId: 1 },
				program: { current: programDone, loading: false, error: null },
			},
		});
		expect(screen.getByText('home.nextSession.allDone')).toBeInTheDocument();
	});

	// ─── Navigation cartes ───────────────────────────────────────────────────

	it('navigue vers /programme via la carte programme', () => {
		renderWithProviders(<Home />, {
			preloadedState: {
				auth: { isAuthenticated: true, userId: 1 },
				program: { current: MOCK_PROGRAM, loading: false, error: null },
			},
		});
		fireEvent.click(screen.getByRole('button', { name: /home\.program\.title/ }));
		expect(navigateMock).toHaveBeenCalledWith('/programme');
	});

	it('navigue vers /progression via la carte progression', () => {
		renderWithProviders(<Home />, {
			preloadedState: {
				auth: { isAuthenticated: true, userId: 1 },
				program: { current: MOCK_PROGRAM, loading: false, error: null },
			},
		});
		fireEvent.click(screen.getByRole('button', { name: /home\.progression\.title/ }));
		expect(navigateMock).toHaveBeenCalledWith('/progression');
	});

	it('navigue vers /exercices via la carte exercices', () => {
		renderWithProviders(<Home />, {
			preloadedState: {
				auth: { isAuthenticated: true, userId: 1 },
				program: { current: MOCK_PROGRAM, loading: false, error: null },
			},
		});
		fireEvent.click(screen.getByRole('button', { name: /home\.exercises\.title/ }));
		expect(navigateMock).toHaveBeenCalledWith('/exercices');
	});

	// ─── Dispatch fetchUserProgram ───────────────────────────────────────────

	it('dispatche fetchUserProgram si userId présent et pas de programme', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(MOCK_PROGRAM),
		}));

		const { store } = renderWithProviders(<Home />, {
			preloadedState: {
				auth: { isAuthenticated: true, userId: 1 },
				program: { current: null, loading: false, error: null },
			},
		});

		await waitFor(() => {
			expect(store.getState().program.current).toEqual(MOCK_PROGRAM);
		});
	});
});
