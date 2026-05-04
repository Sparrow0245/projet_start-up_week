import { screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders } from '../../test/utils';
import ProgramPage from './ProgramPage';

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
	materielNecessaire: [{ id: 1, nom: 'Haltères', sport: { id: 1, nom: 'Football' } }],
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
	exercices: [MOCK_EXERCISE, { ...MOCK_EXERCISE, id: 2, nom: 'Fente', dureeMin: 8, materielNecessaire: [] }],
};

const MOCK_SESSION_2: import('../../types').Session = {
	id: 2,
	jourNumero: 2,
	completedAt: null,
	exercices: [{ ...MOCK_EXERCISE, id: 3, nom: 'Pompes', dureeMin: 5, materielNecessaire: [] }],
};

const MOCK_PROGRAM: import('../../types').Program = {
	id: 10,
	dateCreation: '2026-03-01',
	durationWeeks: 8,
	sessions: [MOCK_SESSION_1, MOCK_SESSION_2],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProgramPage', () => {
	beforeEach(() => {
		navigateMock.mockClear();
	});

	afterEach(() => {
		cleanup();
	});

	// ─── État vide ───────────────────────────────────────────────────────────

	it('affiche l\'état vide quand pas de programme', () => {
		renderWithProviders(<ProgramPage />, {
			preloadedState: { program: { current: null, loading: false, error: null } },
		});
		expect(screen.getByRole('heading', { name: 'program.empty.title' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'program.empty.cta' })).toBeInTheDocument();
	});

	it('navigue vers /sportForm depuis l\'état vide', () => {
		renderWithProviders(<ProgramPage />, {
			preloadedState: { program: { current: null, loading: false, error: null } },
		});
		fireEvent.click(screen.getByRole('button', { name: 'program.empty.cta' }));
		expect(navigateMock).toHaveBeenCalledWith('/sportForm');
	});

	// ─── Programme chargé : header ───────────────────────────────────────────

	it('affiche le titre du programme', () => {
		renderWithProviders(<ProgramPage />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		expect(screen.getByRole('heading', { name: 'program.title' })).toBeInTheDocument();
	});

	it('affiche la date de création', () => {
		renderWithProviders(<ProgramPage />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		expect(screen.getByText(/2026-03-01/)).toBeInTheDocument();
	});

	// ─── Stats ───────────────────────────────────────────────────────────────

	it('affiche le bon nombre de séances', () => {
		renderWithProviders(<ProgramPage />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		// 2 sessions
		expect(screen.getByText('2')).toBeInTheDocument();
	});

	it('affiche le total d\'exercices correct', () => {
		renderWithProviders(<ProgramPage />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		// session1: 2 exos, session2: 1 exo → total 3
		expect(screen.getByText('3')).toBeInTheDocument();
	});

	it('affiche la durée totale correcte', () => {
		renderWithProviders(<ProgramPage />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		// 10+8+5 = 23 min
		expect(screen.getByText('23')).toBeInTheDocument();
	});

	// ─── SessionCards ────────────────────────────────────────────────────────

	it('affiche les cartes de séance', () => {
		renderWithProviders(<ProgramPage />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		expect(screen.getByText('program.session 1')).toBeInTheDocument();
		expect(screen.getByText('program.session 2')).toBeInTheDocument();
	});

	it('ouvre l\'accordéon d\'une séance au clic', () => {
		renderWithProviders(<ProgramPage />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		// Avant ouverture : les noms d'exos ne sont pas visibles
		expect(screen.queryByText('Squat')).not.toBeInTheDocument();

		// Clic sur le header de la séance 1
		fireEvent.click(screen.getByText('program.session 1'));
		expect(screen.getByText('Squat')).toBeInTheDocument();
		expect(screen.getByText('Fente')).toBeInTheDocument();
	});

	it('affiche le matériel requis dans l\'accordéon ouvert', () => {
		renderWithProviders(<ProgramPage />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		fireEvent.click(screen.getByText('program.session 1'));
		expect(screen.getByText('Haltères')).toBeInTheDocument();
	});

	it('bouton Play navigue vers la séance', () => {
		renderWithProviders(<ProgramPage />, {
			preloadedState: { program: { current: MOCK_PROGRAM, loading: false, error: null } },
		});
		// Le premier bouton play (sans texte) de la première séance
		const playBtn = document.querySelector('button svg.lucide-play')?.closest('button');
		expect(playBtn).toBeTruthy();
		if (playBtn) fireEvent.click(playBtn);
		expect(navigateMock).toHaveBeenCalled();
	});

	// ─── Séance complétée ────────────────────────────────────────────────────

	it('affiche la badge "terminée" pour une séance complétée cette semaine', () => {
		const today = new Date().toISOString();
		const programWithDone: import('../../types').Program = {
			...MOCK_PROGRAM,
			sessions: [{ ...MOCK_SESSION_1, completedAt: today }, MOCK_SESSION_2],
		};
		renderWithProviders(<ProgramPage />, {
			preloadedState: { program: { current: programWithDone, loading: false, error: null } },
		});
		fireEvent.click(screen.getByText('program.session 1'));
		expect(screen.getByText('program.sessionDone')).toBeInTheDocument();
	});
});
