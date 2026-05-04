import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import ForgotPassword from './ForgotPassword';
import * as authApi from '../../../api/authApi';

// Mock react-i18next : retourne la clé comme valeur
vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, string>) => {
			if (opts?.email) return `${key}:${opts.email}`;
			return key;
		},
	}),
}));

// Mock de l'appel API
vi.mock('../../../api/authApi');

function renderComponent() {
	return render(
		<MemoryRouter>
			<ForgotPassword />
		</MemoryRouter>,
	);
}

describe('ForgotPassword', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('affiche le formulaire par défaut', () => {
		renderComponent();
		expect(screen.getByRole('heading', { name: 'forgotPassword.title' })).toBeInTheDocument();
		expect(screen.getByPlaceholderText('email@exemple.com')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'forgotPassword.submit' })).toBeInTheDocument();
	});

	it('désactive le bouton si l\'email est vide', () => {
		renderComponent();
		const btn = screen.getByRole('button', { name: 'forgotPassword.submit' });
		expect(btn).toBeDisabled();
	});

	it('active le bouton quand un email est saisi', () => {
		renderComponent();
		fireEvent.change(screen.getByPlaceholderText('email@exemple.com'), {
			target: { value: 'test@example.com' },
		});
		expect(screen.getByRole('button', { name: 'forgotPassword.submit' })).toBeEnabled();
	});

	it('affiche l\'écran de confirmation après envoi réussi', async () => {
		vi.mocked(authApi.fetchForgotPassword).mockResolvedValue('ok');
		renderComponent();

		fireEvent.change(screen.getByPlaceholderText('email@exemple.com'), {
			target: { value: 'test@example.com' },
		});
		fireEvent.submit(screen.getByRole('button', { name: 'forgotPassword.submit' }).closest('form')!);

		await waitFor(() => {
			expect(screen.getByRole('heading', { name: 'forgotPassword.sentTitle' })).toBeInTheDocument();
			expect(screen.getByText('forgotPassword.sentDescription:test@example.com')).toBeInTheDocument();
		});
	});

	it('affiche "aucun compte" si le mail n\'existe pas', async () => {
		vi.mocked(authApi.fetchForgotPassword).mockResolvedValue('not_found');
		renderComponent();

		fireEvent.change(screen.getByPlaceholderText('email@exemple.com'), {
			target: { value: 'inconnu@example.com' },
		});
		fireEvent.submit(screen.getByRole('button', { name: 'forgotPassword.submit' }).closest('form')!);

		await waitFor(() => {
			expect(screen.getByText('forgotPassword.notFound')).toBeInTheDocument();
		});
	});

	it('affiche une erreur si l\'envoi email échoue', async () => {
		vi.mocked(authApi.fetchForgotPassword).mockResolvedValue('email_error');
		renderComponent();

		fireEvent.change(screen.getByPlaceholderText('email@exemple.com'), {
			target: { value: 'test@example.com' },
		});
		fireEvent.submit(screen.getByRole('button', { name: 'forgotPassword.submit' }).closest('form')!);

		await waitFor(() => {
			expect(screen.getByText('forgotPassword.emailError')).toBeInTheDocument();
		});
	});

	it('affiche une erreur si l\'API lance une exception', async () => {
		vi.mocked(authApi.fetchForgotPassword).mockRejectedValue(new Error('Network error'));
		renderComponent();

		fireEvent.change(screen.getByPlaceholderText('email@exemple.com'), {
			target: { value: 'test@example.com' },
		});
		fireEvent.submit(screen.getByRole('button', { name: 'forgotPassword.submit' }).closest('form')!);

		await waitFor(() => {
			expect(screen.getByText('forgotPassword.emailError')).toBeInTheDocument();
		});
	});
});
