import { describe, it, expect, vi, afterEach } from 'vitest';
import { mockFetch } from '../test/utils';
import { fetchContact } from './contactApi';

afterEach(() => vi.unstubAllGlobals());

const PAYLOAD = {
	email: 'user@example.com',
	name: 'Jean',
	subject: 'Suggérer un sport',
	message: 'Proposez le padel SVP.',
};

describe('fetchContact', () => {
	it('retourne "ok" si envoi réussi', async () => {
		mockFetch('ok');
		const result = await fetchContact(PAYLOAD);
		expect(result).toBe('ok');
	});

	it('appelle le bon endpoint en POST avec le body JSON complet', async () => {
		const fetchSpy = mockFetch('ok');
		await fetchContact(PAYLOAD);
		expect(fetchSpy).toHaveBeenCalledWith(
			expect.stringContaining('/contact'),
			expect.objectContaining({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(PAYLOAD),
			}),
		);
	});

	it('lève une erreur si la réponse n\'est pas ok', async () => {
		mockFetch({}, 500);
		await expect(fetchContact(PAYLOAD)).rejects.toThrow('Erreur serveur');
	});

	it('lève une erreur si fetch rejette (réseau)', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
		await expect(fetchContact(PAYLOAD)).rejects.toThrow('Network error');
	});
});
