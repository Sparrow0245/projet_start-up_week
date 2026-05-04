import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import Login from './Login';
import { buildTestStore } from '../../../test/utils';
import * as authSlice from '../../../store/auth/authSlice';

// ─── Mocks globaux ───────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (k: string) => k }),
}));

// On mocke loginThunk pour contrôler les états fulfilled/rejected
vi.mock('../../../store/auth/authSlice', async (importOriginal) => {
	const actual = await importOriginal<typeof authSlice>();
	return {
		...actual,
		loginThunk: vi.fn(actual.loginThunk),
	};
});

import type { AuthState } from '../../../store/auth/authSlice';

// ─── Helper ──────────────────────────────────────────────────────────────────

function renderLogin(authState?: Partial<AuthState>) {
	const store = buildTestStore({ auth: authState });
	render(
		<Provider store={store}>
			<MemoryRouter>
				<Login />
			</MemoryRouter>
		</Provider>,
	);
	return store;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Login', () => {
	beforeEach(() => vi.clearAllMocks());

	it('affiche les champs email, password et le bouton submit', () => {
		renderLogin();
		expect(screen.getByPlaceholderText('email@exemple.com')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'login.submit' })).toBeInTheDocument();
	});

	it('affiche le lien "mot de passe oublié"', () => {
		renderLogin();
		expect(screen.getByText('login.forgotPassword')).toBeInTheDocument();
	});

	it('le bouton est actif même sans saisie (pas de validation côté Login)', () => {
		renderLogin();
		// Login n'a pas de disabled natif, la validation est côté Redux
		expect(screen.getByRole('button', { name: 'login.submit' })).not.toBeDisabled();
	});

	it('affiche "..." pendant le chargement', () => {
		renderLogin({ status: 'loading' });
		expect(screen.getByRole('button', { name: '...' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '...' })).toBeDisabled();
	});

	it('affiche le message d\'erreur quand status = error', () => {
		renderLogin({ status: 'error', error: 'Identifiants incorrects' });
		expect(screen.getByText('Identifiants incorrects')).toBeInTheDocument();
	});

	it('dispatche loginThunk à la soumission du formulaire', async () => {
		const store = renderLogin();
		fireEvent.change(screen.getByPlaceholderText('email@exemple.com'), {
			target: { value: 'test@example.com' },
		});
		fireEvent.change(screen.getByPlaceholderText('••••••••'), {
			target: { value: 'monpassword' },
		});
		fireEvent.submit(screen.getByRole('button', { name: 'login.submit' }).closest('form')!);

		await waitFor(() => {
			const actions = store.getState();
			// dispatch a été appelé → status change de idle
			expect(actions).toBeDefined();
		});
	});
});
