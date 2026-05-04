import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { toggleVoice } from '../store/settings/settingsSlice';

/**
 * Hook wrappant la Web Speech API (window.speechSynthesis).
 * L'état enabled est persisté dans le store Redux.
 */
export function useSpeech(lang = 'fr-FR') {
	const dispatch = useDispatch();
	const enabled = useSelector((state: RootState) => state.settings.voiceEnabled);
	const [supported] = [typeof window !== 'undefined' && 'speechSynthesis' in window];
	const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

	// Annuler toute synthèse en cours quand le composant se démonte
	useEffect(() => {
		return () => {
			if (supported) window.speechSynthesis.cancel();
		};
	}, [supported]);

	const speak = useCallback(
		(text: string) => {
			if (!supported || !enabled || !text.trim()) return;

			window.speechSynthesis.cancel();

			const utter = new SpeechSynthesisUtterance(text);
			utter.lang = lang;
			utter.rate = 1.0;
			utter.pitch = 1.0;
			utter.volume = 1.0;

			utteranceRef.current = utter;
			window.speechSynthesis.speak(utter);
		},
		[supported, enabled, lang],
	);

	const cancel = useCallback(() => {
		if (supported) window.speechSynthesis.cancel();
	}, [supported]);

	const toggle = useCallback(() => {
		if (supported && enabled) window.speechSynthesis.cancel();
		dispatch(toggleVoice());
	}, [supported, enabled, dispatch]);

	return { enabled, supported, speak, cancel, toggle };
}
