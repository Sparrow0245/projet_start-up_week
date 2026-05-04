import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, mockFetch } from '../../../test/utils';
import ResetPassword from './ResetPassword';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (k: string) => k }),
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Rend le composant avec un token dans l'URL */
function renderWithToken(token = 'valid-token') {
	return renderWithProviders(<ResetPassword />, {
		routerProps: { initialEntries: [`/reset-password?token=${token}`] },
	});
}

/** Rend le composant sans token */
function renderWithoutToken() {
	return renderWithProviders(<ResetPassword />, {
		routerProps: { initialEntries: ['/reset-password'] },
	});
}

function fillPasswords(password = 'newpass123', confirm = 'newpass123') {
	const inputs = screen.getAllByPlaceholderText('••••••••');
	fireEvent.change(inputs[0], { target: { value: password } });
	fireEvent.change(inputs[1], { target: { value: confirm } });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ResetPassword — sans token', () => {
	it('affiche l\'écran "lien invalide" si pas de token dans l\'URL', () => {
		renderWithoutToken();
		expect(screen.getByRole('heading', { name: 'resetPassword.invalidTitle' })).toBeInTheDocument();
		expect(screen.getByText('resetPassword.requestNew')).toBeInTheDocument();
	});

	it('n\'affiche pas le formulaire si pas de token', () => {
		renderWithoutToken();
		expect(screen.queryByPlaceholderText('••••••••')).not.toBeInTheDocument();
	});
});

describe('ResetPassword — formulaire', () => {
	beforeEach(() => vi.clearAllMocks());
	afterEach(() => vi.unstubAllGlobals());

	it('affiche le formulaire si un token est présent', () => {
		renderWithToken();
		expect(screen.getByRole('heading', { name: 'resetPassword.title' })).toBeInTheDocument();
		expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
	});

	it('affiche une erreur "mismatch" si les mots de passe ne correspondent pas', async () => {
		renderWithToken();
		fillPasswords('abc123', 'different');
		fireEvent.submit(screen.getAllByPlaceholderText('••••••••')[0].closest('form')!);
		await waitFor(() => {
			expect(screen.getByText('resetPassword.mismatch')).toBeInTheDocument();
		});
	});

	it('affiche l\'écran de succès si le serveur retourne "ok"', async () => {
		mockFetch('ok');
		renderWithToken();
		fillPasswords();
		fireEvent.submit(screen.getAllByPlaceholderText('••••••••')[0].closest('form')!);
		await waitFor(() => {
			expect(screen.getByRole('heading', { name: 'resetPassword.successTitle' })).toBeInTheDocument();
			expect(screen.getByText('resetPassword.goToLogin')).toBeInTheDocument();
		});
	});

	it('affiche l\'écran "token invalide" si le serveur retourne "invalid_token"', async () => {
		mockFetch('invalid_token');
		renderWithToken();
		fillPasswords();
		fireEvent.submit(screen.getAllByPlaceholderText('••••••••')[0].closest('form')!);
		await waitFor(() => {
			expect(screen.getByRole('heading', { name: 'resetPassword.invalid_tokenTitle' })).toBeInTheDocument();
		});
	});

	it('affiche l\'écran "token expiré" si le serveur retourne "token_expired"', async () => {
		mockFetch('token_expired');
		renderWithToken();
		fillPasswords();
		fireEvent.submit(screen.getAllByPlaceholderText('••••••••')[0].closest('form')!);
		await waitFor(() => {
			expect(screen.getByRole('heading', { name: 'resetPassword.token_expiredTitle' })).toBeInTheDocument();
		});
	});

	it('affiche l\'écran "token utilisé" si le serveur retourne "token_used"', async () => {
		mockFetch('token_used');
		renderWithToken();
		fillPasswords();
		fireEvent.submit(screen.getAllByPlaceholderText('••••••••')[0].closest('form')!);
		await waitFor(() => {
			expect(screen.getByRole('heading', { name: 'resetPassword.token_usedTitle' })).toBeInTheDocument();
		});
	});

	it('affiche une erreur générique si le serveur retourne autre chose', async () => {
		mockFetch('unknown_error');
		renderWithToken();
		fillPasswords();
		fireEvent.submit(screen.getAllByPlaceholderText('••••••••')[0].closest('form')!);
		await waitFor(() => {
			expect(screen.getByText('resetPassword.error')).toBeInTheDocument();
		});
	});

	it('affiche une erreur générique si l\'API lève une exception', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network')));
		renderWithToken();
		fillPasswords();
		fireEvent.submit(screen.getAllByPlaceholderText('••••••••')[0].closest('form')!);
		await waitFor(() => {
			expect(screen.getByText('resetPassword.error')).toBeInTheDocument();
		});
	});
});
