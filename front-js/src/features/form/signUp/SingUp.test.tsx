import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../test/utils';
import SingUp from './SingUp';
import * as authSliceModule from '../../../store/auth/authSlice';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (k: string) => k }),
	Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

vi.mock('../../../store/auth/authSlice', async (importOriginal) => {
	const actual = await importOriginal<typeof authSliceModule>();
	return { ...actual };
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function fillForm({
	name = 'Jean',
	surname = 'Dupont',
	email = 'jean@example.com',
	password = 'secret123',
} = {}) {
	fireEvent.change(screen.getByPlaceholderText('Jean'), { target: { value: name, name: 'name' } });
	fireEvent.change(screen.getByPlaceholderText('Dupont'), { target: { value: surname, name: 'surname' } });
	fireEvent.change(screen.getByPlaceholderText('email@exemple.com'), { target: { value: email, name: 'email' } });
	fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: password, name: 'password' } });
}

function checkConsent() {
	// La case "consent" est la 2ème checkbox du formulaire
	const checkboxes = screen.getAllByRole('checkbox');
	const consentBox = checkboxes[checkboxes.length - 1];
	fireEvent.click(consentBox);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('SingUp', () => {
	beforeEach(() => vi.clearAllMocks());

	it('affiche tous les champs du formulaire', () => {
		renderWithProviders(<SingUp />);
		expect(screen.getByPlaceholderText('Jean')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('Dupont')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('email@exemple.com')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'signup.submit' })).toBeInTheDocument();
	});

	it('le bouton est désactivé sans consentement', () => {
		renderWithProviders(<SingUp />);
		expect(screen.getByRole('button', { name: 'signup.submit' })).toBeDisabled();
	});

	it('le bouton est actif après avoir coché le consentement', () => {
		renderWithProviders(<SingUp />);
		checkConsent();
		expect(screen.getByRole('button', { name: 'signup.submit' })).toBeEnabled();
	});

	it('affiche "..." et désactive le bouton pendant le chargement', () => {
		renderWithProviders(<SingUp />, { preloadedState: { auth: { status: 'loading' } } });
		expect(screen.getByRole('button', { name: '...' })).toBeDisabled();
	});

	it('affiche le message d\'erreur quand status = error', () => {
		renderWithProviders(<SingUp />, {
			preloadedState: { auth: { status: 'error', error: 'Cet email est déjà utilisé' } },
		});
		expect(screen.getByText('Cet email est déjà utilisé')).toBeInTheDocument();
	});

	it('la checkbox "isCoach" est décochée par défaut', () => {
		renderWithProviders(<SingUp />);
		const checkboxes = screen.getAllByRole('checkbox');
		const isCoachBox = checkboxes[0];
		expect(isCoachBox).not.toBeChecked();
	});

	it('peut cocher la checkbox "isCoach"', () => {
		renderWithProviders(<SingUp />);
		const checkboxes = screen.getAllByRole('checkbox');
		const isCoachBox = checkboxes[0];
		fireEvent.click(isCoachBox);
		expect(isCoachBox).toBeChecked();
	});

	it('dispatche signupThunk à la soumission', async () => {
		const dispatchSpy = vi.spyOn(authSliceModule, 'signupThunk');
		renderWithProviders(<SingUp />);
		fillForm();
		checkConsent();
		fireEvent.submit(screen.getByRole('button', { name: 'signup.submit' }).closest('form')!);
		await waitFor(() => {
			expect(dispatchSpy).toHaveBeenCalled();
		});
	});
});
