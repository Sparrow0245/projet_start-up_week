import { configureStore } from '@reduxjs/toolkit';
import {
	persistStore,
	persistReducer,
	FLUSH,
	REHYDRATE,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './auth/authSlice';
import programReducer from './program/programSlice';
import settingsReducer from './settings/settingsSlice';

const authPersistConfig = {
	key: 'auth',
	storage,
	whitelist: ['isAuthenticated', 'hasCompletedQuestionnaire', 'userId', 'userPrenom', 'isCoach', 'isAdmin', 'coachApproved'],
};

const programPersistConfig = {
	key: 'program',
	storage,
	whitelist: ['current'],
};

const settingsPersistConfig = {
	key: 'settings',
	storage,
	whitelist: ['voiceEnabled'],
};

export const store = configureStore({
	reducer: {
		auth: persistReducer(authPersistConfig, authReducer),
		program: persistReducer(programPersistConfig, programReducer),
		settings: persistReducer(settingsPersistConfig, settingsReducer),
	},
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
