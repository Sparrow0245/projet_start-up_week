import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders } from '../../test/utils';
import Contact from './Contact';
import * as contactApi from '../../api/contactApi';

// ─── Mocks globaux ───────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, string>) =>
			opts ? Object.entries(opts).reduce((a, [k, v]) => a.replace(`{{${k}}}`, v), key) : key,
	}),
}));

vi.mock('../../api/contactApi');

// ─── Helper ──────────────────────────────────────────────────────────────────

function fillForm(email = 'user@example.com', name = 'Jean', message = 'Bonjour') {
	fireEvent.change(screen.getByPlaceholderText('email@exemple.com'), {
		target: { value: email },
	});
	fireEvent.change(screen.getByPlaceholderText('contact.namePlaceholder'), {
		target: { value: name },
	});
	fireEvent.change(screen.getByPlaceholderText('contact.messagePlaceholder'), {
		target: { value: message },
	});
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Contact', () => {
	beforeEach(() => vi.clearAllMocks());
	afterEach(() => vi.unstubAllGlobals());

	it('affiche le formulaire par défaut', () => {
		renderWithProviders(<Contact />);
		expect(screen.getByRole('heading', { name: 'contact.title' })).toBeInTheDocument();
		expect(screen.getByPlaceholderText('email@exemple.com')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'contact.submit' })).toBeInTheDocument();
	});

	it('le bouton est désactivé si email/nom/message vides', () => {
		renderWithProviders(<Contact />);
		expect(screen.getByRole('button', { name: 'contact.submit' })).toBeDisabled();
	});

	it('le bouton est actif quand tous les champs requis sont remplis', () => {
		renderWithProviders(<Contact />);
		fillForm();
		expect(screen.getByRole('button', { name: 'contact.submit' })).toBeEnabled();
	});

	it('pré-remplit le nom depuis le store Redux si connecté', () => {
		renderWithProviders(<Contact />, {
			preloadedState: { auth: { isAuthenticated: true, userPrenom: 'Marie' } },
		});
		expect((screen.getByPlaceholderText('contact.namePlaceholder') as HTMLInputElement).value).toBe('Marie');
	});

	it('affiche l\'écran de confirmation après envoi réussi', async () => {
		vi.mocked(contactApi.fetchContact).mockResolvedValue('ok');
		renderWithProviders(<Contact />);
		fillForm();
		fireEvent.submit(screen.getByRole('button', { name: 'contact.submit' }).closest('form')!);

		await waitFor(() => {
			expect(screen.getByRole('heading', { name: 'contact.sentTitle' })).toBeInTheDocument();
		});
	});

	it('affiche le message d\'erreur si l\'API retourne autre chose que "ok"', async () => {
		vi.mocked(contactApi.fetchContact).mockResolvedValue('error');
		renderWithProviders(<Contact />);
		fillForm();
		fireEvent.submit(screen.getByRole('button', { name: 'contact.submit' }).closest('form')!);

		await waitFor(() => {
			expect(screen.getByText('contact.error')).toBeInTheDocument();
		});
	});

	it('affiche le message d\'erreur si l\'API lève une exception', async () => {
		vi.mocked(contactApi.fetchContact).mockRejectedValue(new Error('Network'));
		renderWithProviders(<Contact />);
		fillForm();
		fireEvent.submit(screen.getByRole('button', { name: 'contact.submit' }).closest('form')!);

		await waitFor(() => {
			expect(screen.getByText('contact.error')).toBeInTheDocument();
		});
	});

	it('le lien retour pointe vers "/" si non connecté', () => {
		renderWithProviders(<Contact />);
		const backLink = screen.getByText('contact.back').closest('a');
		expect(backLink).toHaveAttribute('href', '/');
	});

	it('le lien retour pointe vers "/home" si connecté', () => {
		renderWithProviders(<Contact />, {
			preloadedState: { auth: { isAuthenticated: true } },
		});
		const backLink = screen.getByText('contact.back').closest('a');
		expect(backLink).toHaveAttribute('href', '/home');
	});
});
