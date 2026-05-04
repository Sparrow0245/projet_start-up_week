import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../test/utils';
import GuestRoute from './GuestRoute';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (k: string) => k }),
}));

function Page() {
	return <div>page publique</div>;
}

describe('GuestRoute', () => {
	it('rend les enfants si non authentifié', () => {
		renderWithProviders(
			<GuestRoute><Page /></GuestRoute>,
			{ preloadedState: { auth: { isAuthenticated: false } } },
		);
		expect(screen.getByText('page publique')).toBeInTheDocument();
	});

	it('redirige vers /splash si déjà authentifié + questionnaire complété', () => {
		renderWithProviders(
			<GuestRoute><Page /></GuestRoute>,
			{
				preloadedState: {
					auth: {
						isAuthenticated: true,
						hasCompletedQuestionnaire: true,
						isCoach: false,
					},
				},
			},
		);
		expect(screen.queryByText('page publique')).not.toBeInTheDocument();
	});

	it('redirige vers /sportForm si authentifié mais questionnaire non complété (user)', () => {
		renderWithProviders(
			<GuestRoute><Page /></GuestRoute>,
			{
				preloadedState: {
					auth: {
						isAuthenticated: true,
						hasCompletedQuestionnaire: false,
						isCoach: false,
					},
				},
			},
		);
		expect(screen.queryByText('page publique')).not.toBeInTheDocument();
	});

	it('redirige vers /splash si coach authentifié', () => {
		renderWithProviders(
			<GuestRoute><Page /></GuestRoute>,
			{
				preloadedState: {
					auth: {
						isAuthenticated: true,
						isCoach: true,
						hasCompletedQuestionnaire: true,
					},
				},
			},
		);
		expect(screen.queryByText('page publique')).not.toBeInTheDocument();
	});
});
