import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Send, Loader2, CheckCircle2, AlertCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import type { AppDispatch, RootState } from '../../store/store';
import { sendFeedbackThunk } from '../../store/program/programSlice';
import { useSpeech } from '../../hooks/useSpeech';

export default function ProgramFeedback() {
	const { t, i18n } = useTranslation();
	const dispatch = useDispatch<AppDispatch>();
	const userId = useSelector((state: RootState) => state.auth.userId);
	const loading = useSelector((state: RootState) => state.program.loading);

	const [text, setText] = useState('');
	const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
	const [isOpen, setIsOpen] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const recognitionRef = useRef<any>(null);

	const { supported: _voiceSupported } = useSpeech();

	// Dictée vocale (SpeechRecognition, différent de SpeechSynthesis)
	const startListening = () => {
		const SpeechRecognition =
			(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!SpeechRecognition) return;

		const recognition: any = new SpeechRecognition();
		recognition.lang = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';
		recognition.continuous = false;
		recognition.interimResults = false;

		recognition.onresult = (event: any) => {
			const transcript = event.results[0][0].transcript;
			setText(prev => (prev ? prev + ' ' + transcript : transcript));
			setIsListening(false);
		};

		recognition.onerror = () => setIsListening(false);
		recognition.onend = () => setIsListening(false);

		recognitionRef.current = recognition;
		recognition.start();
		setIsListening(true);
	};

	const stopListening = () => {
		recognitionRef.current?.stop();
		setIsListening(false);
	};

	const handleSubmit = async () => {
		if (!text.trim() || !userId) return;
		setStatus('idle');
		const lang = i18n.language.startsWith('fr') ? 'fr' : 'en';
		const result = await dispatch(sendFeedbackThunk({ userId, feedback: text.trim(), language: lang }));
		if (sendFeedbackThunk.fulfilled.match(result)) {
			setStatus('success');
			setText('');
			setTimeout(() => setStatus('idle'), 3000);
		} else {
			setStatus('error');
		}
	};

	const hasSpeechRecognition =
		typeof window !== 'undefined' &&
		((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

	return (
		<div className="card border border-border">
			{/* Header — toujours visible */}
			<button
				className="flex items-center gap-3 w-full text-left"
				onClick={() => setIsOpen(o => !o)}
			>
				<div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10">
					<Sparkles className="h-5 w-5 text-primary" />
				</div>
				<div className="flex-1">
					<p className="font-semibold text-sm">{t('program.feedback.title')}</p>
					<p className="text-xs text-text-muted">{t('program.feedback.subtitle')}</p>
				</div>
				{isOpen
					? <ChevronUp className="h-5 w-5 text-text-muted shrink-0" />
					: <ChevronDown className="h-5 w-5 text-text-muted shrink-0" />
				}
			</button>

			{/* Panneau dépliable */}
			{isOpen && (
				<div className="mt-4 space-y-3">
					<div className="relative">
						<textarea
							className="w-full rounded-xl border border-border bg-surface p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[90px]"
							placeholder={t('program.feedback.placeholder')}
							value={text}
							onChange={e => setText(e.target.value)}
							disabled={loading}
						/>
						{hasSpeechRecognition && (
							<button
								type="button"
								onClick={isListening ? stopListening : startListening}
								className={`absolute bottom-3 right-3 p-1.5 rounded-full transition-colors ${
									isListening
										? 'bg-red-100 text-red-500 animate-pulse'
										: 'bg-primary/10 text-primary hover:bg-primary/20'
								}`}
								title={isListening ? t('program.feedback.micStop') : t('program.feedback.micStart')}
							>
								{isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
							</button>
						)}
					</div>

					{status === 'success' && (
						<div className="flex items-center gap-2 text-green-600 text-sm">
							<CheckCircle2 className="h-4 w-4" />
							{t('program.feedback.success')}
						</div>
					)}
					{status === 'error' && (
						<div className="flex items-center gap-2 text-red-500 text-sm">
							<AlertCircle className="h-4 w-4" />
							{t('program.feedback.error')}
						</div>
					)}

					<button
						className="btn-primary flex items-center justify-center gap-2 w-full"
						onClick={handleSubmit}
						disabled={loading || !text.trim()}
					>
						{loading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								{t('program.feedback.sending')}
							</>
						) : (
							<>
								<Send className="h-4 w-4" />
								{t('program.feedback.send')}
							</>
						)}
					</button>
				</div>
			)}
		</div>
	);
}
