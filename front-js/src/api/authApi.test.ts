import { describe, it, expect, vi, afterEach } from 'vitest';
import { mockFetch } from '../test/utils';
import { fetchLogin, fetchSignup, fetchForgotPassword, fetchResetPassword } from './authApi';

afterEach(() => vi.unstubAllGlobals());

// ─── fetchLogin ──────────────────────────────────────────────────────────────

describe('fetchLogin', () => {
	it('retourne le user si la réponse est ok', async () => {
		const user = { id: 1, email: 'a@b.com', nom: 'B', prenom: 'A', coach: false };
		mockFetch(user);
		const result = await fetchLogin('a@b.com', 'pass');
		expect(result).toEqual(user);
	});

	it('appelle le bon endpoint en POST avec le bon body', async () => {
		const user = { id: 1, email: 'a@b.com', nom: 'B', prenom: 'A', coach: false };
		const fetchSpy = mockFetch(user);
		await fetchLogin('a@b.com', 'pass');
		expect(fetchSpy).toHaveBeenCalledWith(
			expect.stringContaining('/users/login'),
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ email: 'a@b.com', password: 'pass' }),
			}),
		);
	});

	it('lève une erreur si la réponse n\'est pas ok', async () => {
		mockFetch({}, 401);
		await expect(fetchLogin('bad@b.com', 'wrong')).rejects.toThrow('Identifiants incorrects');
	});
});

// ─── fetchSignup ─────────────────────────────────────────────────────────────

describe('fetchSignup', () => {
	const user = { id: 2, email: 'new@b.com', nom: 'Dupont', prenom: 'Jean', coach: false };

	it('retourne le user créé si ok', async () => {
		mockFetch(user);
		const result = await fetchSignup('Jean', 'Dupont', 'new@b.com', 'pass');
		expect(result).toEqual(user);
	});

	it('envoie coach=false par défaut', async () => {
		const fetchSpy = mockFetch(user);
		await fetchSignup('Jean', 'Dupont', 'new@b.com', 'pass');
		const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
		expect(body.coach).toBe(false);
	});

	it('envoie coach=true si précisé', async () => {
		const fetchSpy = mockFetch(user);
		await fetchSignup('Jean', 'Dupont', 'new@b.com', 'pass', true);
		const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
		expect(body.coach).toBe(true);
	});

	it('lève une erreur si la réponse n\'est pas ok', async () => {
		mockFetch({}, 409);
		await expect(fetchSignup('Jean', 'Dupont', 'dup@b.com', 'pass')).rejects.toThrow(
			'Cet email est déjà utilisé',
		);
	});
});

// ─── fetchForgotPassword ─────────────────────────────────────────────────────

describe('fetchForgotPassword', () => {
	it('retourne "ok" si email connu', async () => {
		mockFetch('ok');
		const result = await fetchForgotPassword('known@b.com');
		expect(result).toBe('ok');
	});

	it('retourne "not_found" si email inconnu', async () => {
		mockFetch('not_found');
		const result = await fetchForgotPassword('unknown@b.com');
		expect(result).toBe('not_found');
	});

	it('lève une erreur si le serveur répond 500', async () => {
		mockFetch({}, 500);
		await expect(fetchForgotPassword('a@b.com')).rejects.toThrow('Erreur serveur');
	});
});

// ─── fetchResetPassword ──────────────────────────────────────────────────────

describe('fetchResetPassword', () => {
	it('retourne "ok" si réinitialisation réussie', async () => {
		mockFetch('ok');
		const result = await fetchResetPassword('valid-token', 'newpassword');
		expect(result).toBe('ok');
	});

	it('retourne "invalid_token" si token invalide', async () => {
		mockFetch('invalid_token');
		const result = await fetchResetPassword('bad-token', 'newpassword');
		expect(result).toBe('invalid_token');
	});

	it('retourne "token_expired" si token expiré', async () => {
		mockFetch('token_expired');
		const result = await fetchResetPassword('expired-token', 'newpassword');
		expect(result).toBe('token_expired');
	});

	it('appelle le bon endpoint avec token + newPassword', async () => {
		const fetchSpy = mockFetch('ok');
		await fetchResetPassword('my-token', 'mypassword');
		expect(fetchSpy).toHaveBeenCalledWith(
			expect.stringContaining('/auth/reset-password'),
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ token: 'my-token', newPassword: 'mypassword' }),
			}),
		);
	});

	it('lève une erreur si le serveur répond 500', async () => {
		mockFetch({}, 500);
		await expect(fetchResetPassword('token', 'pass')).rejects.toThrow('Erreur serveur');
	});
});
