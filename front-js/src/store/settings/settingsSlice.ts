import { createSlice } from '@reduxjs/toolkit';

interface SettingsState {
	voiceEnabled: boolean;
}

const initialState: SettingsState = {
	voiceEnabled: false,
};

const settingsSlice = createSlice({
	name: 'settings',
	initialState,
	reducers: {
		toggleVoice(state) {
			state.voiceEnabled = !state.voiceEnabled;
		},
		setVoiceEnabled(state, action: { payload: boolean }) {
			state.voiceEnabled = action.payload;
		},
	},
});

export const { toggleVoice, setVoiceEnabled } = settingsSlice.actions;
export default settingsSlice.reducer;
