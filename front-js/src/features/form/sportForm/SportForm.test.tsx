import { screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { buildTestStore, type PreloadedState } from '../../../test/utils';
import SportForm from './SportForm';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, string>) =>
			opts
				? Object.entries(opts).reduce(
						(a, [k, v]) => a.replace(`{{${k}}}`, v),
						key,
					)
				: key,
	}),
}));

// Mock useNavigate dans react-router-dom (utilisé par SportForm)
const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
	const mod = await importOriginal<typeof import('react-router-dom')>();
	return { ...mod, useNavigate: () => navigateMock };
});

vi.mock('../../../components/AppLayout', () => ({
	default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// ─── Helper render ────────────────────────────────────────────────────────────

function renderSportForm(preloadedState: PreloadedState = {}) {
	const store = buildTestStore({
		auth: { isAuthenticated: true, userId: 1 },
		...preloadedState,
	});
	render(
		<Provider store={store}>
			<MemoryRouter>
				<SportForm />
			</MemoryRouter>
		</Provider>,
	);
	return { store };
}

// ─── Données de test ──────────────────────────────────────────────────────────

const MOCK_SPORTS = [{ id: 1, nom: 'Football' }];
const MOCK_ROLES = [{ id: 10, nom: 'Attaquant' }];
const MOCK_EQUIPMENT = [{ id: 20, nom: 'Ballon' }];
const MOCK_GOALS = [{ id: 30, nom: 'Explosivité' }];
const MOCK_PROGRAM = { id: 99, sessions: [] };

function makeFetch(...responses: Array<unknown>) {
	let call = 0;
	return vi.fn().mockImplementation(() => {
		const body = responses[call] ?? responses[responses.length - 1];
		call++;
		return Promise.resolve({
			ok: true,
			json: () => Promise.resolve(body),
		});
	});
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SportForm', () => {
	beforeEach(() => {
		// Fetch par défaut : sports au montage
		vi.stubGlobal('fetch', makeFetch(MOCK_SPORTS));
		navigateMock.mockClear();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		cleanup();
	});

	// ─── Step 1 : affichage initial ─────────────────────────────────────────

	it('affiche le titre de step 1 (sport)', async () => {
		renderSportForm();
		await waitFor(() =>
			expect(screen.getAllByText('questionnaire.step.sport').length).toBeGreaterThanOrEqual(1),
		);
	});

	it('affiche la barre de progression 1/4', async () => {
		renderSportForm();
		await waitFor(() =>
			expect(screen.getByText('1 / 4')).toBeInTheDocument(),
		);
	});

	it('charge et affiche les sports dans le select', async () => {
		renderSportForm();
		await waitFor(() =>
			expect(screen.getByRole('option', { name: 'Football' })).toBeInTheDocument(),
		);
	});

	it('le bouton Suivant est présent à l\'étape 1', async () => {
		renderSportForm();
		await waitFor(() =>
			expect(
				screen.getByRole('button', { name: 'questionnaire.next' }),
			).toBeInTheDocument(),
		);
	});

	// ─── Step 2 : contraintes ───────────────────────────────────────────────

	it('passe à l\'étape 2 (contraintes) après avoir sélectionné un sport et cliqué Suivant', async () => {
		// Fetch : sports, puis roles + equipment + goals en parallèle
		vi.stubGlobal('fetch', makeFetch(MOCK_SPORTS, MOCK_ROLES, MOCK_EQUIPMENT, MOCK_GOALS));

		renderSportForm();
		await waitFor(() =>
			expect(screen.getByRole('option', { name: 'Football' })).toBeInTheDocument(),
		);

		fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1' } });
		fireEvent.click(screen.getByRole('button', { name: 'questionnaire.next' }));

		await waitFor(() =>
			expect(screen.getByRole('heading', { name: 'questionnaire.step.constraints' })).toBeInTheDocument(),
		);
		expect(screen.getByText('2 / 4')).toBeInTheDocument();
	});

	it('affiche les contraintes physiques \u00e0 l\'\u00e9tape 2', async () => {
		vi.stubGlobal('fetch', makeFetch(MOCK_SPORTS, MOCK_ROLES, MOCK_EQUIPMENT, MOCK_GOALS));

		renderSportForm();
		await waitFor(() =>
			expect(screen.getByRole('option', { name: 'Football' })).toBeInTheDocument(),
		);
		fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1' } });
		fireEvent.click(screen.getByRole('button', { name: 'questionnaire.next' }));

		await waitFor(() =>
			expect(screen.getByRole('heading', { name: 'questionnaire.step.constraints' })).toBeInTheDocument(),
		);
		// CONSTRAINTS = ['GENOUX', 'CHEVILLES', 'DOS', 'EPAULES']
		expect(screen.getByText('questionnaire.constraint.GENOUX')).toBeInTheDocument();
	});

	// ─── Navigation retour ──────────────────────────────────────────────────

	it('le bouton Retour n\'est pas visible à l\'étape 1', async () => {
		renderSportForm();
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'questionnaire.next' })).toBeInTheDocument(),
		);
		expect(
			screen.queryByRole('button', { name: 'questionnaire.back' }),
		).not.toBeInTheDocument();
	});

	it('le bouton Retour apparaît à partir de l\'étape 2', async () => {
		vi.stubGlobal('fetch', makeFetch(MOCK_SPORTS, MOCK_ROLES, MOCK_EQUIPMENT, MOCK_GOALS));

		renderSportForm();
		await waitFor(() =>
			expect(screen.getByRole('option', { name: 'Football' })).toBeInTheDocument(),
		);
		fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1' } });
		fireEvent.click(screen.getByRole('button', { name: 'questionnaire.next' }));

		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'questionnaire.back' })).toBeInTheDocument(),
		);
	});

	// ─── Soumission finale ──────────────────────────────────────────────────

	it('affiche une erreur si la génération du programme échoue', async () => {
		// Sports + roles/eq/goals pour les 3 passages de "Suivant", puis erreur sur generate
		const fetchMock = vi.fn()
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(MOCK_SPORTS) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(MOCK_ROLES) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(MOCK_EQUIPMENT) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(MOCK_GOALS) })
			.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) }); // generate fail

		vi.stubGlobal('fetch', fetchMock);

		renderSportForm();
		await waitFor(() =>
			expect(screen.getByRole('option', { name: 'Football' })).toBeInTheDocument(),
		);

		// Step 1 → 2
		fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1' } });
		fireEvent.click(screen.getByRole('button', { name: 'questionnaire.next' }));
		await waitFor(() =>
			expect(screen.getByRole('heading', { name: 'questionnaire.step.constraints' })).toBeInTheDocument(),
		);

		// Step 2 → 3
		fireEvent.click(screen.getByRole('button', { name: 'questionnaire.next' }));
		await waitFor(() =>
			expect(screen.getByRole('heading', { name: 'questionnaire.step.equipment' })).toBeInTheDocument(),
		);

		// Step 3 → 4
		fireEvent.click(screen.getByRole('button', { name: 'questionnaire.next' }));
		await waitFor(() =>
			expect(screen.getByRole('heading', { name: 'questionnaire.step.goals' })).toBeInTheDocument(),
		);

		// Submit final
		fireEvent.click(screen.getByRole('button', { name: 'questionnaire.submit' }));

		await waitFor(() =>
			expect(screen.getByText('questionnaire.error')).toBeInTheDocument(),
		);
	});

	it('navigue vers /programme en cas de succès', async () => {
		const fetchMock = vi.fn()
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(MOCK_SPORTS) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(MOCK_ROLES) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(MOCK_EQUIPMENT) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(MOCK_GOALS) })
			.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(MOCK_PROGRAM) });

		vi.stubGlobal('fetch', fetchMock);

		const { store } = renderSportForm();
		await waitFor(() =>
			expect(screen.getByRole('option', { name: 'Football' })).toBeInTheDocument(),
		);

		fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1' } });
		fireEvent.click(screen.getByRole('button', { name: 'questionnaire.next' }));
		await waitFor(() => screen.getByRole('heading', { name: 'questionnaire.step.constraints' }));

		fireEvent.click(screen.getByRole('button', { name: 'questionnaire.next' }));
		await waitFor(() => screen.getByRole('heading', { name: 'questionnaire.step.equipment' }));

		fireEvent.click(screen.getByRole('button', { name: 'questionnaire.next' }));
		await waitFor(() => screen.getByRole('heading', { name: 'questionnaire.step.goals' }));

		fireEvent.click(screen.getByRole('button', { name: 'questionnaire.submit' }));

		await waitFor(() => {
			const state = store.getState();
			expect(state.program.current).toEqual(MOCK_PROGRAM);
		});
	});
});
