import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchLogin, fetchSignup } from '../../api/authApi';

export interface AuthState {
	status: 'idle' | 'loading' | 'success' | 'error';
	error: string | null;
	isAuthenticated: boolean;
	hasCompletedQuestionnaire: boolean;
	userId: number | null;
	userPrenom: string | null;
	userEmail: string | null;
	isCoach: boolean;
	isAdmin: boolean;
	coachApproved: boolean | null;
}

const initialState: AuthState = {
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

export const loginThunk = createAsyncThunk(
	'auth/login',
	async (
		credentials: { email: string; password: string },
		{ rejectWithValue },
	) => {
		try {
			return await fetchLogin(credentials.email, credentials.password);
		} catch (err) {
			if (err instanceof Error && err.message === 'email_not_verified') {
				return rejectWithValue('email_not_verified');
			}
			return rejectWithValue('Identifiants incorrects');
		}
	},
);

export const signupThunk = createAsyncThunk(
	'auth/signup',
	async (
		data: { prenom: string; nom: string; email: string; password: string; isCoach?: boolean },
		{ rejectWithValue },
	) => {
		try {
			return await fetchSignup(
				data.prenom,
				data.nom,
				data.email,
				data.password,
				data.isCoach ?? false,
			);
		} catch (err) {
			return rejectWithValue(err instanceof Error ? err.message : 'Cet email est déjà utilisé');
		}
	},
);

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		resetAuth(state) {
			state.status = 'idle';
			state.error = null;
		},
		logout(state) {
			state.isAuthenticated = false;
			state.hasCompletedQuestionnaire = false;
			state.userId = null;
			state.userPrenom = null;
			state.userEmail = null;
			state.isCoach = false;
			state.isAdmin = false;
			state.coachApproved = null;
			state.status = 'idle';
			state.error = null;
		},
		completeQuestionnaire(state) {
			state.hasCompletedQuestionnaire = true;
		},
	},
	extraReducers: builder => {
		builder
			.addCase(loginThunk.pending, state => {
				state.status = 'loading';
				state.error = null;
			})
		.addCase(loginThunk.fulfilled, (state, action) => {
				state.status = 'success';
				state.error = null;
				state.isAuthenticated = true;
				state.isCoach = action.payload.coach;
				state.isAdmin = action.payload.admin;
				state.coachApproved = action.payload.coachApproved;
				state.hasCompletedQuestionnaire = action.payload.sportChoisi !== null;
				state.userId = action.payload.id;
				state.userPrenom = action.payload.prenom;
				state.userEmail = action.payload.email;
			})
			.addCase(loginThunk.rejected, (state, action) => {
				state.status = 'error';
				state.error = action.payload as string;
			});

		builder
			.addCase(signupThunk.pending, state => {
				state.status = 'loading';
				state.error = null;
			})
			.addCase(signupThunk.fulfilled, (state) => {
				state.status = 'success';
				state.error = null;
				// Ne pas authentifier : l'utilisateur doit d'abord vérifier son email
			})
			.addCase(signupThunk.rejected, (state, action) => {
				state.status = 'error';
				state.error = action.payload as string;
			});
	},
});

export const { resetAuth, logout, completeQuestionnaire } = authSlice.actions;
export default authSlice.reducer;
