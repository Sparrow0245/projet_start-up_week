import { screen, render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router';
import { buildTestStore } from '../test/utils';
import ProtectedRoute from './ProtectedRoute';
import type { AuthState } from '../store/auth/authSlice';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (k: string) => k }),
}));

// ─── Helper : vrai système de routes pour capturer les redirections ──────────

function renderWithRoutes(authState: Partial<AuthState>, initialPath = '/home') {
	const store = buildTestStore({ auth: authState });
	render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[initialPath]}>
				<Routes>
					<Route
						path="/home"
						element={
							<ProtectedRoute>
								<div>page protégée</div>
							</ProtectedRoute>
						}
					/>
					<Route
						path="/sportForm"
						element={
							<ProtectedRoute>
								<div>page sportForm</div>
							</ProtectedRoute>
						}
					/>
					<Route path="/login" element={<div>page login</div>} />
				</Routes>
			</MemoryRouter>
		</Provider>,
	);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
	it('rend les enfants si authentifié + questionnaire complété', () => {
		renderWithRoutes({ isAuthenticated: true, hasCompletedQuestionnaire: true });
		expect(screen.getByText('page protégée')).toBeInTheDocument();
	});

	it('rend les enfants si coach authentifié (questionnaire pas requis)', () => {
		renderWithRoutes({ isAuthenticated: true, isCoach: true, hasCompletedQuestionnaire: false });
		expect(screen.getByText('page protégée')).toBeInTheDocument();
	});

	it('redirige vers /login si non authentifié', () => {
		renderWithRoutes({ isAuthenticated: false });
		expect(screen.queryByText('page protégée')).not.toBeInTheDocument();
		expect(screen.getByText('page login')).toBeInTheDocument();
	});

	it('redirige vers /sportForm si authentifié mais questionnaire non complété (user)', () => {
		renderWithRoutes({
			isAuthenticated: true,
			isCoach: false,
			hasCompletedQuestionnaire: false,
		});
		expect(screen.queryByText('page protégée')).not.toBeInTheDocument();
		expect(screen.getByText('page sportForm')).toBeInTheDocument();
	});

	it('rend les enfants sur /sportForm même si questionnaire non complété', () => {
		renderWithRoutes(
			{ isAuthenticated: true, isCoach: false, hasCompletedQuestionnaire: false },
			'/sportForm',
		);
		expect(screen.getByText('page sportForm')).toBeInTheDocument();
	});
});
