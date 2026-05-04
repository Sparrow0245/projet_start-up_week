import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildTestStore, mockFetch } from '../../test/utils';
import {
	loginThunk,
	signupThunk,
	logout,
	resetAuth,
	completeQuestionnaire,
} from './authSlice';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const MOCK_USER = {
	id: 1,
	email: 'jean@example.com',
	nom: 'Dupont',
	prenom: 'Jean',
	coach: false,
};

const MOCK_COACH = { ...MOCK_USER, id: 2, coach: true };

// ─── Helpers ────────────────────────────────────────────────────────────────

function getAuth(store: ReturnType<typeof buildTestStore>) {
	return store.getState().auth;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('authSlice — reducers synchrones', () => {
	it('resetAuth remet status à idle et efface error', () => {
		const store = buildTestStore({ auth: { status: 'error', error: 'oups' } });
		store.dispatch(resetAuth());
		expect(getAuth(store).status).toBe('idle');
		expect(getAuth(store).error).toBeNull();
	});

	it('logout remet tout à zéro', () => {
		const store = buildTestStore({
			auth: {
				isAuthenticated: true,
				userId: 42,
				userPrenom: 'Jean',
				isCoach: true,
				hasCompletedQuestionnaire: true,
			},
		});
		store.dispatch(logout());
		const auth = getAuth(store);
		expect(auth.isAuthenticated).toBe(false);
		expect(auth.userId).toBeNull();
		expect(auth.userPrenom).toBeNull();
		expect(auth.isCoach).toBe(false);
		expect(auth.hasCompletedQuestionnaire).toBe(false);
		expect(auth.status).toBe('idle');
		expect(auth.error).toBeNull();
	});

	it('completeQuestionnaire passe hasCompletedQuestionnaire à true', () => {
		const store = buildTestStore({ auth: { hasCompletedQuestionnaire: false } });
		store.dispatch(completeQuestionnaire());
		expect(getAuth(store).hasCompletedQuestionnaire).toBe(true);
	});
});

describe('authSlice — loginThunk', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('pending → status = loading', async () => {
		mockFetch(MOCK_USER);
		const store = buildTestStore();
		const promise = store.dispatch(loginThunk({ email: 'a@b.com', password: '123' }));
		// pendant l'attente
		expect(getAuth(store).status).toBe('loading');
		await promise;
	});

	it('fulfilled → authentifié avec les données user', async () => {
		mockFetch(MOCK_USER);
		const store = buildTestStore();
		await store.dispatch(loginThunk({ email: MOCK_USER.email, password: '123' }));
		const auth = getAuth(store);
		expect(auth.status).toBe('success');
		expect(auth.isAuthenticated).toBe(true);
		expect(auth.userId).toBe(MOCK_USER.id);
		expect(auth.userPrenom).toBe(MOCK_USER.prenom);
		expect(auth.isCoach).toBe(false);
	});

	it('fulfilled coach → isCoach = true + hasCompletedQuestionnaire = true', async () => {
		mockFetch(MOCK_COACH);
		const store = buildTestStore();
		await store.dispatch(loginThunk({ email: MOCK_COACH.email, password: '123' }));
		const auth = getAuth(store);
		expect(auth.isCoach).toBe(true);
		expect(auth.hasCompletedQuestionnaire).toBe(true);
	});

	it('rejected (fetch échoue) → status = error', async () => {
		mockFetch({}, 401);
		const store = buildTestStore();
		await store.dispatch(loginThunk({ email: 'bad@b.com', password: 'wrong' }));
		const auth = getAuth(store);
		expect(auth.status).toBe('error');
		expect(auth.error).toBe('Identifiants incorrects');
		expect(auth.isAuthenticated).toBe(false);
	});
});

describe('authSlice — signupThunk', () => {
	beforeEach(() => vi.clearAllMocks());
	afterEach(() => vi.unstubAllGlobals());

	const PAYLOAD = {
		prenom: 'Jean',
		nom: 'Dupont',
		email: 'jean@example.com',
		password: 'secret',
	};

	it('fulfilled user normal → status = success, non authentifié (vérif email requise)', async () => {
		mockFetch(MOCK_USER);
		const store = buildTestStore();
		await store.dispatch(signupThunk(PAYLOAD));
		const auth = getAuth(store);
		expect(auth.status).toBe('success');
		expect(auth.isAuthenticated).toBe(false); // pas authentifié avant vérif email
		expect(auth.isCoach).toBe(false);
		expect(auth.hasCompletedQuestionnaire).toBe(false);
	});

	it('fulfilled coach → status = success, non authentifié (vérif email requise)', async () => {
		mockFetch(MOCK_COACH);
		const store = buildTestStore();
		await store.dispatch(signupThunk({ ...PAYLOAD, isCoach: true }));
		const auth = getAuth(store);
		expect(auth.status).toBe('success');
		expect(auth.isAuthenticated).toBe(false); // pas authentifié avant vérif email
		expect(auth.isCoach).toBe(false);
	});

	it('rejected (fetch échoue) → status = error', async () => {
		mockFetch({}, 409);
		const store = buildTestStore();
		await store.dispatch(signupThunk(PAYLOAD));
		const auth = getAuth(store);
		expect(auth.status).toBe('error');
		expect(auth.error).toBe('Cet email est déjà utilisé');
	});
});
