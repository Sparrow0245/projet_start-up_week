import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildTestStore, mockFetch } from '../../test/utils';
import {
	fetchUserProgram,
	setProgram,
	clearProgram,
	markSessionCompleted,
} from './programSlice';
import type { Program } from '../../types';

// ─── Fixture ────────────────────────────────────────────────────────────────

const MOCK_PROGRAM: Program = {
	id: 10,
	dateCreation: '2026-01-01',
	durationWeeks: 4,
	sessions: [
		{
			id: 1,
			jourNumero: 1,
			completedAt: null,
			exercices: [],
		},
		{
			id: 2,
			jourNumero: 2,
			completedAt: null,
			exercices: [],
		},
	],
};

function getProgram(store: ReturnType<typeof buildTestStore>) {
	return store.getState().program;
}

// ─── Tests reducers synchrones ──────────────────────────────────────────────

describe('programSlice — reducers synchrones', () => {
	it('setProgram stocke le programme', () => {
		const store = buildTestStore();
		store.dispatch(setProgram(MOCK_PROGRAM));
		expect(getProgram(store).current).toEqual(MOCK_PROGRAM);
	});

	it('clearProgram vide le programme', () => {
		const store = buildTestStore({ program: { current: MOCK_PROGRAM } });
		store.dispatch(clearProgram());
		expect(getProgram(store).current).toBeNull();
	});

	it('markSessionCompleted met à jour completedAt de la bonne séance', () => {
		const store = buildTestStore({ program: { current: MOCK_PROGRAM } });
		const completedAt = '2026-03-12T10:00:00Z';
		store.dispatch(markSessionCompleted({ sessionId: 1, completedAt }));
		const sessions = getProgram(store).current!.sessions;
		expect(sessions.find(s => s.id === 1)?.completedAt).toBe(completedAt);
		expect(sessions.find(s => s.id === 2)?.completedAt).toBeNull();
	});

	it('markSessionCompleted ne fait rien si pas de programme', () => {
		const store = buildTestStore();
		// ne doit pas lever d'exception
		expect(() =>
			store.dispatch(markSessionCompleted({ sessionId: 1, completedAt: '2026-01-01' })),
		).not.toThrow();
	});

	it('markSessionCompleted ne fait rien si sessionId inconnu', () => {
		const store = buildTestStore({ program: { current: MOCK_PROGRAM } });
		store.dispatch(markSessionCompleted({ sessionId: 999, completedAt: '2026-01-01' }));
		const { sessions } = getProgram(store).current!;
		expect(sessions.every(s => s.completedAt === null)).toBe(true);
	});
});

// ─── Tests fetchUserProgram thunk ────────────────────────────────────────────

describe('programSlice — fetchUserProgram', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('pending → loading = true', async () => {
		mockFetch(MOCK_PROGRAM);
		const store = buildTestStore();
		const promise = store.dispatch(fetchUserProgram(1));
		expect(getProgram(store).loading).toBe(true);
		await promise;
	});

	it('fulfilled → current = programme récupéré, loading = false', async () => {
		mockFetch(MOCK_PROGRAM);
		const store = buildTestStore();
		await store.dispatch(fetchUserProgram(1));
		expect(getProgram(store).current).toEqual(MOCK_PROGRAM);
		expect(getProgram(store).loading).toBe(false);
	});

	it('rejected (404) → current = null, loading = false', async () => {
		mockFetch({}, 404);
		const store = buildTestStore();
		await store.dispatch(fetchUserProgram(1));
		expect(getProgram(store).current).toBeNull();
		expect(getProgram(store).loading).toBe(false);
	});
});
