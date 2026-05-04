/**
 * Utilitaires de test partagés.
 *
 * - `renderWithProviders` : wrappe le composant dans Redux + MemoryRouter
 * - `mockFetch`           : mock global de window.fetch pour un seul test
 * - Mock react-i18next    : retourne la clé i18n comme valeur (pas de traduction réelle)
 */

import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, type MemoryRouterProps } from 'react-router';
import { vi } from 'vitest';
import authReducer from '../store/auth/authSlice';
import programReducer from '../store/program/programSlice';
import settingsReducer from '../store/settings/settingsSlice';
import type { AuthState } from '../store/auth/authSlice';
import type { ProgramState } from '../store/program/programSlice';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PreloadedState {
	auth?: Partial<AuthState>;
	program?: Partial<ProgramState>;
	settings?: { voiceEnabled?: boolean };
}

interface RenderConfig {
	preloadedState?: PreloadedState;
	routerProps?: MemoryRouterProps;
	renderOptions?: Omit<RenderOptions, 'wrapper'>;
}

// ─── Store de test (sans persist pour éviter les effets de bord) ────────────

export function buildTestStore(preloadedState: PreloadedState = {}) {
	const authDefaults: AuthState = {
		status: 'idle',
		error: null,
		isAuthenticated: false,
		hasCompletedQuestionnaire: false,
		userId: null,
		userPrenom: null,
		userEmail: null,
		isCoach: false,
		isAdmin: false,
		coachApproved: null,
	};
	const programDefaults: ProgramState = {
		current: null,
		loading: false,
		error: null,
	};
	return configureStore({
		reducer: { auth: authReducer, program: programReducer, settings: settingsReducer },
		preloadedState: {
			auth: { ...authDefaults, ...preloadedState.auth },
			program: { ...programDefaults, ...preloadedState.program },
			settings: { voiceEnabled: false, ...preloadedState.settings },
		},
	});
}

// ─── renderWithProviders ────────────────────────────────────────────────────

export function renderWithProviders(
	ui: React.ReactElement,
	{ preloadedState, routerProps, renderOptions }: RenderConfig = {},
) {
	const store = buildTestStore(preloadedState);

	function Wrapper({ children }: { children: React.ReactNode }) {
		return (
			<Provider store={store}>
				<MemoryRouter {...routerProps}>{children}</MemoryRouter>
			</Provider>
		);
	}

	return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// ─── Mock fetch ─────────────────────────────────────────────────────────────

/**
 * Remplace window.fetch par un mock qui retourne `body` avec le status donné.
 * À appeler dans beforeEach / dans chaque test.
 * Retourne le vi.fn() pour pouvoir faire des assertions dessus.
 */
export function mockFetch(body: unknown, status = 200) {
	const fn = vi.fn().mockResolvedValue({
		ok: status >= 200 && status < 300,
		status,
		json: () => Promise.resolve(body),
		text: () => Promise.resolve(String(body)),
	});
	vi.stubGlobal('fetch', fn);
	return fn;
}

// ─── Mock react-i18next (à utiliser via vi.mock dans chaque fichier de test) ─

/**
 * Factory pour vi.mock('react-i18next').
 * Retourne la clé i18n telle quelle, avec interpolation basique {{var}}.
 */
export const i18nMock = {
	useTranslation: () => ({
		t: (key: string, opts?: Record<string, string>) => {
			if (!opts) return key;
			return Object.entries(opts).reduce(
				(acc, [k, v]) => acc.replace(`{{${k}}}`, v),
				key,
			);
		},
		i18n: { changeLanguage: vi.fn(), language: 'fr' },
	}),
	Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
};
