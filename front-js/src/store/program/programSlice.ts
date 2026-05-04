import {
	createAsyncThunk,
	createSlice,
	type PayloadAction,
} from '@reduxjs/toolkit';
import type { Program } from '../../types';
import { fetchProgram, sendProgramFeedback } from '../../api/programApi';

export const sendFeedbackThunk = createAsyncThunk(
	'program/sendFeedback',
	async (
		{ userId, feedback, language }: { userId: number; feedback: string; language: string },
		{ rejectWithValue }
	) => {
		try {
			return await sendProgramFeedback(userId, feedback, language);
		} catch {
			return rejectWithValue('gemini_error');
		}
	}
);

export const fetchUserProgram = createAsyncThunk(
	'program/fetchUserProgram',
	async (userId: number, { rejectWithValue }) => {
		try {
			return await fetchProgram(userId);
		} catch {
			return rejectWithValue('no_program');
		}
	}
);

export interface ProgramState {
	current: Program | null;
	loading: boolean;
	error: string | null;
}

const initialState: ProgramState = {
	current: null,
	loading: false,
	error: null,
};

const programSlice = createSlice({
	name: 'program',
	initialState,
	reducers: {
		setProgram(state, action: PayloadAction<Program>) {
			state.current = action.payload;
		},
		clearProgram(state) {
			state.current = null;
		},
		markSessionCompleted(
			state,
			action: PayloadAction<{ sessionId: number; completedAt: string }>
		) {
			if (!state.current) return;
			const session = state.current.sessions.find(
				s => s.id === action.payload.sessionId
			);
			if (session) {
				session.completedAt = action.payload.completedAt;
			}
		},
	},
	extraReducers: builder => {
		builder
			.addCase(fetchUserProgram.pending, state => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchUserProgram.fulfilled, (state, action) => {
				state.current = action.payload;
				state.loading = false;
				state.error = null;
			})
			.addCase(fetchUserProgram.rejected, (state, action) => {
				state.current = null;
				state.loading = false;
				state.error = action.payload === 'no_program' ? null : 'fetch_error';
			})
			.addCase(sendFeedbackThunk.pending, state => {
				state.loading = true;
				state.error = null;
			})
			.addCase(sendFeedbackThunk.fulfilled, (state, action) => {
				state.current = action.payload;
				state.loading = false;
				state.error = null;
			})
			.addCase(sendFeedbackThunk.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			});
	},
});

export const { setProgram, clearProgram, markSessionCompleted } =
	programSlice.actions;
export default programSlice.reducer;
