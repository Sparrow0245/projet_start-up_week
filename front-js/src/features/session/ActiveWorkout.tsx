import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { markSessionCompleted } from '../../store/program/programSlice';
import { completeSession } from '../../api/programApi';
import type { AppDispatch, RootState } from '../../store/store';
import { useSpeech } from '../../hooks/useSpeech';
import XpLevelCard from '../../components/XpLevelCard';
import {
	Play,
	Pause,
	SkipForward,
	SkipBack,
	Dumbbell,
	RotateCcw,
	CheckCircle2,
	ChevronLeft,
	Plus,
	Minus,
	Coffee,
	FastForward,
	Volume2,
	VolumeX,
	Zap,
	Star,
} from 'lucide-react';
import type { Exercise } from '../../types';

type Phase = 'exercise' | 'rest';

const DEFAULT_REST_SECONDS = 60;

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ActiveWorkout() {
	const { t, i18n } = useTranslation();
	const { sessionIndex } = useParams<{ sessionIndex: string }>();
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();

	const program = useSelector((state: RootState) => state.program.current);
	const idx = Number(sessionIndex);
	const session = program?.sessions[idx];

	const speechLang = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';
	const { enabled: voiceEnabled, supported: voiceSupported, speak, toggle: toggleVoice } = useSpeech(speechLang);

	const [currentIdx, setCurrentIdx] = useState(0);
	const [phase, setPhase] = useState<Phase>('exercise');
	const [elapsed, setElapsed] = useState(0);
	const [isRunning, setIsRunning] = useState(false);
	const [isFinished, setIsFinished] = useState(false);
	const [sessionResult, setSessionResult] = useState<{ xpGained: number; newLevel: number; newXp: number; levelUp: boolean; newContests: string[] } | null>(null);
	const [completeError, setCompleteError] = useState<string | null>(null);
	const [isCompleting, setIsCompleting] = useState(false);
	const [restDuration, setRestDuration] = useState(DEFAULT_REST_SECONDS);
	const [restRemaining, setRestRemaining] = useState(DEFAULT_REST_SECONDS);
	const [restRunning, setRestRunning] = useState(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const exercise: Exercise | undefined = session?.exercices[currentIdx];
	const nextExercise: Exercise | undefined = session?.exercices[currentIdx + 1];
	const total = session?.exercices.length ?? 0;

	const stopTimer = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
		setIsRunning(false);
	}, []);

	const startTimer = useCallback(() => {
		if (intervalRef.current) return;
		setIsRunning(true);
		intervalRef.current = setInterval(() => {
			setElapsed(prev => prev + 1);
		}, 1000);
	}, []);

	const resetTimer = useCallback(() => {
		stopTimer();
		setElapsed(0);
	}, [stopTimer]);

	const stopRestTimer = useCallback(() => {
		if (restIntervalRef.current) {
			clearInterval(restIntervalRef.current);
			restIntervalRef.current = null;
		}
		setRestRunning(false);
	}, []);

	useEffect(() => {
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
			if (restIntervalRef.current) clearInterval(restIntervalRef.current);
		};
	}, []);

	useEffect(() => {
		resetTimer();
	}, [currentIdx, resetTimer]);

	// Annonce vocale au changement d'exercice
	useEffect(() => {
		if (!voiceEnabled || !exercise) return;
		if (phase !== 'exercise') return;
		const key = currentIdx === 0 ? 'workout.voice.firstExercise' : 'workout.voice.exerciseAnnounce';
		speak(t(key, { name: exercise.nom, series: exercise.series, reps: exercise.repTemps }));
	}, [currentIdx, voiceEnabled, phase]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (phase === 'rest') {
			setRestRemaining(restDuration);
			setRestRunning(false);
			stopRestTimer();
			if (voiceEnabled) {
				speak(t('workout.voice.restAnnounce', { seconds: restDuration }));
			}
		}
	}, [phase, restDuration, stopRestTimer]); // eslint-disable-line react-hooks/exhaustive-deps

	function startRestCountdown() {
		if (restIntervalRef.current) return;
		setRestRunning(true);
		restIntervalRef.current = setInterval(() => {
			setRestRemaining(prev => {
				if (prev <= 1) {
					if (restIntervalRef.current) {
						clearInterval(restIntervalRef.current);
						restIntervalRef.current = null;
					}
					moveToNextExercise();
					return 0;
				}
				// Décompte vocal 3-2-1
				if (prev <= 4 && prev > 1) {
					speak(String(prev - 1));
				}
				return prev - 1;
			});
		}, 1000);
	}

	function moveToNextExercise() {
		stopRestTimer();
		setPhase('exercise');
		setCurrentIdx(prev => prev + 1);
		if (voiceEnabled) {
			speak(t('workout.voice.restEnd'));
		}
	}

	function adjustRestTime(delta: number) {
		setRestDuration(prev => Math.max(5, prev + delta));
		if (!restRunning) {
			setRestRemaining(prev => Math.max(5, prev + delta));
		}
	}

	function goNext() {
		stopTimer();
		if (currentIdx < total - 1) {
			setPhase('rest');
		} else {
			if (voiceEnabled) speak(t('workout.voice.finishAnnounce'));
			if (session) {
				setIsCompleting(true);
				setCompleteError(null);
				completeSession(session.id)
					.then((updated) => {
						dispatch(
							markSessionCompleted({
								sessionId: updated.id,
								completedAt: updated.completedAt,
							})
						);
						setSessionResult({
							xpGained: updated.xpGained,
							newLevel: updated.newLevel,
							newXp: updated.newExperience,
							levelUp: updated.levelUp,
							newContests: updated.unlockedContests,
						});
						setIsFinished(true);
					})
					.catch(() => {
						setCompleteError(t('workout.completeError'));
					})
					.finally(() => {
						setIsCompleting(false);
					});
			}
		}
	}

	function goPrev() {
		if (phase === 'rest') {
			stopRestTimer();
			setPhase('exercise');
			return;
		}
		if (currentIdx > 0) {
			setCurrentIdx(prev => prev - 1);
		}
	}

	if (!session || !exercise) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-4 px-4">
				<p className="text-text-muted">{t('workout.noSession')}</p>
				<button className="btn-primary" onClick={() => navigate('/programme')}>
					{t('workout.backToProgram')}
				</button>
			</div>
		);
	}

	if (isFinished) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-5 px-4 py-8 overflow-y-auto">
				<CheckCircle2 className="h-16 w-16 text-primary" />
				<h1 className="text-2xl font-bold text-center">
					{t('workout.finished.title')}
				</h1>
				<p className="text-text-muted text-center max-w-sm">
					{t('workout.finished.description', { count: total })}
				</p>

				{/* Résultat XP */}
				{sessionResult && (
					<div className="w-full max-w-sm space-y-3">
						{/* Gains de la séance */}
						<div className="rounded-2xl border border-border bg-surface px-5 py-4 flex items-center justify-between">
							<span className="flex items-center gap-2 text-sm font-medium text-text-muted">
								<Zap className="h-4 w-4 text-primary" />
								{t('workout.finished.xpGained')}
							</span>
							<span className="text-base font-bold text-primary">+{sessionResult.xpGained} XP</span>
						</div>

						{/* Level-up */}
						{sessionResult.levelUp && (
							<div className="rounded-2xl border border-primary/30 bg-primary/8 px-5 py-4 flex items-center justify-between">
								<span className="flex items-center gap-2 text-sm font-medium text-primary">
									<Star className="h-4 w-4 text-primary" />
									{t('workout.levelUp.title', { level: sessionResult.newLevel })}
								</span>
								{sessionResult.newContests.length > 0 && (
									<span className="text-xs text-text-muted truncate ml-3">
										{sessionResult.newContests.join(', ')}
									</span>
								)}
							</div>
						)}

						{/* Barre XP après gain */}
						<XpLevelCard
							level={sessionResult.newLevel}
							experience={sessionResult.newXp}
							xpGained={sessionResult.xpGained}
						/>
					</div>
				)}

				<button className="btn-primary w-full max-w-sm" onClick={() => navigate('/programme')}>
					{t('workout.finished.cta')}
				</button>
			</div>
		);
	}

	if (phase === 'rest' && nextExercise) {
		const restProgress = restRunning
			? ((restDuration - restRemaining) / restDuration) * 100
			: 0;

		return (
			<div className="flex h-screen flex-col px-4 py-6">
				{/* Header */}
				<div className="flex items-center justify-between">
				<button
					onClick={goPrev}
					className="flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors"
				>
					<ChevronLeft className="h-4 w-4" />
					{t('workout.back')}
				</button>
				<span className="text-sm font-medium text-text-muted">
					{currentIdx + 1} / {total}
				</span>
				{voiceSupported && (
					<button
						onClick={toggleVoice}
						title={voiceEnabled ? t('workout.voice.disable') : t('workout.voice.enable')}
						className={`flex items-center justify-center h-8 w-8 rounded-full border transition-colors ${
							voiceEnabled
								? 'border-primary bg-primary/10 text-primary'
								: 'border-border bg-surface text-text-muted hover:text-text'
						}`}
					>
						{voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
					</button>
				)}
			</div>				{/* Progress bar */}
				<div className="mt-3 h-1.5 w-full rounded-full bg-border overflow-hidden">
					<div
						className="h-full rounded-full bg-primary transition-all duration-300"
						style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
					/>
				</div>

				<div className="mt-6 flex-1 overflow-y-auto flex flex-col items-center gap-6">
					{/* Titre repos */}
					<div className="text-center space-y-2">
						<Coffee className="h-10 w-10 text-accent mx-auto" />
						<h1 className="text-2xl font-bold">{t('workout.rest.title')}</h1>
						<p className="text-sm text-text-muted">
							{t('workout.rest.subtitle')}
						</p>
					</div>

					{/* Timer repos circulaire */}
					<div className="relative flex items-center justify-center">
						<svg className="w-48 h-48 -rotate-90" viewBox="0 0 120 120">
							<circle
								cx="60"
								cy="60"
								r="52"
								fill="none"
								stroke="currentColor"
								className="text-border"
								strokeWidth="6"
							/>
							<circle
								cx="60"
								cy="60"
								r="52"
								fill="none"
								stroke="currentColor"
								className="text-accent transition-all duration-1000"
								strokeWidth="6"
								strokeLinecap="round"
								strokeDasharray={2 * Math.PI * 52}
								strokeDashoffset={2 * Math.PI * 52 * (1 - restProgress / 100)}
							/>
						</svg>
						<div className="absolute text-center">
							<div className="text-4xl font-mono font-bold tabular-nums">
								{formatTime(restRemaining)}
							</div>
						</div>
					</div>

					{/* Boutons ajustement temps */}
					<div className="flex items-center gap-2">
						<button
							onClick={() => adjustRestTime(-15)}
							disabled={restRunning}
							className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface transition-colors disabled:opacity-30"
						>
							<Minus className="h-3 w-3" /> 15s
						</button>
						<button
							onClick={() => adjustRestTime(-5)}
							disabled={restRunning}
							className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface transition-colors disabled:opacity-30"
						>
							<Minus className="h-3 w-3" /> 5s
						</button>
						<span className="px-3 text-sm font-semibold tabular-nums">
							{formatTime(restDuration)}
						</span>
						<button
							onClick={() => adjustRestTime(5)}
							disabled={restRunning}
							className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface transition-colors disabled:opacity-30"
						>
							<Plus className="h-3 w-3" /> 5s
						</button>
						<button
							onClick={() => adjustRestTime(15)}
							disabled={restRunning}
							className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface transition-colors disabled:opacity-30"
						>
							<Plus className="h-3 w-3" /> 15s
						</button>
					</div>

					{/* Bouton Play / Pause repos */}
					<button
						onClick={restRunning ? stopRestTimer : startRestCountdown}
						className="flex items-center justify-center h-16 w-16 rounded-full bg-accent text-text-light shadow-lg hover:opacity-90 transition-opacity"
					>
						{restRunning ? (
							<Pause className="h-7 w-7" />
						) : (
							<Play className="h-7 w-7 ml-0.5" />
						)}
					</button>

					{/* Aperçu exercice suivant */}
					<div className="w-full card border border-accent-light/40 space-y-2">
						<p className="text-xs font-medium uppercase tracking-widest text-accent">
							{t('workout.rest.nextUp')}
						</p>
						<h3 className="font-semibold">{nextExercise.nom}</h3>
						<div className="flex items-center gap-3 text-sm text-text-muted">
							<span>
								{nextExercise.series} {t('workout.series')}
							</span>
							<span>·</span>
							<span>{nextExercise.repTemps}</span>
							<span>·</span>
							<span>{nextExercise.dureeMin} min</span>
						</div>
						<span className="inline-block rounded-full bg-primary-light/20 px-2.5 py-0.5 text-xs font-medium text-primary">
							{nextExercise.intensite}
						</span>
					</div>
				</div>

				{/* Bouton skip */}
				<div className="mt-4 pb-6">
					<button
						onClick={moveToNextExercise}
						className="btn-primary w-full flex items-center justify-center gap-2"
					>
						<FastForward className="h-4 w-4" />
						{t('workout.rest.skip')}
					</button>
				</div>
			</div>
		);
	}

	const equipmentList = exercise.materielNecessaire ?? [];
	const hasWeight = equipmentList.some(eq => {
		const n = eq.nom.toLowerCase();
		return (
			n.includes('haltère') ||
			n.includes('kettlebell') ||
			n.includes('poids') ||
			n.includes('médecine ball')
		);
	});
	console.log(exercise);

	return (
		<div className="flex h-screen flex-col px-4 py-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<button
					onClick={() => navigate(`/session/${sessionIndex}`)}
					className="flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors"
				>
					<ChevronLeft className="h-4 w-4" />
					{t('workout.back')}
				</button>
				<span className="text-sm font-medium text-text-muted">
					{currentIdx + 1} / {total}
				</span>
				{voiceSupported && (
					<button
						onClick={toggleVoice}
						title={voiceEnabled ? t('workout.voice.disable') : t('workout.voice.enable')}
						className={`flex items-center justify-center h-8 w-8 rounded-full border transition-colors ${
							voiceEnabled
								? 'border-primary bg-primary/10 text-primary'
								: 'border-border bg-surface text-text-muted hover:text-text'
						}`}
					>
						{voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
					</button>
				)}
			</div>

			{/* Progress bar */}
			<div className="mt-3 h-1.5 w-full rounded-full bg-border overflow-hidden">
				<div
					className="h-full rounded-full bg-primary transition-all duration-300"
					style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
				/>
			</div>

			{/* Contenu scrollable */}
			<div className="mt-6 flex-1 overflow-y-auto space-y-5">
				{/* Titre et intensité */}
				<div className="text-center space-y-2">
					<h1 className="text-2xl font-bold">{exercise.nom}</h1>
					<span className="inline-block rounded-full bg-primary-light/20 px-3 py-1 text-xs font-medium text-primary">
						{exercise.intensite}
					</span>
				</div>

				{exercise.img != null && (
					<img className="block mx-auto max-h-1/3" src={exercise.img}></img>
				)}

				{/* Chronomètre */}
				<div className="flex flex-col items-center gap-4">
					<div className="text-5xl font-mono font-bold tabular-nums tracking-wider">
						{formatTime(elapsed)}
					</div>
					<div className="flex items-center gap-4">
						<button
							onClick={resetTimer}
							className="flex items-center justify-center h-12 w-12 rounded-full border border-border bg-surface text-text-muted hover:text-text transition-colors"
						>
							<RotateCcw className="h-5 w-5" />
						</button>
						<button
							onClick={isRunning ? stopTimer : startTimer}
							className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-text-light shadow-lg hover:opacity-90 transition-opacity"
						>
							{isRunning ? (
								<Pause className="h-7 w-7" />
							) : (
								<Play className="h-7 w-7 ml-0.5" />
							)}
						</button>
						<button
							onClick={goNext}
							className="flex items-center justify-center h-12 w-12 rounded-full border border-border bg-surface text-text-muted hover:text-text transition-colors"
						>
							<SkipForward className="h-5 w-5" />
						</button>
					</div>
				</div>

				{/* Détails exercice */}
				<div className="card space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<div className="rounded-lg bg-background p-3 text-center">
							<p className="text-xs text-text-muted">{t('workout.series')}</p>
							<p className="text-lg font-bold">{exercise.series}</p>
						</div>
						<div className="rounded-lg bg-background p-3 text-center">
							<p className="text-xs text-text-muted">{t('workout.reps')}</p>
							<p className="text-lg font-bold">{exercise.repTemps}</p>
						</div>
						<div className="rounded-lg bg-background p-3 text-center">
							<p className="text-xs text-text-muted">{t('workout.duration')}</p>
							<p className="text-lg font-bold">{exercise.dureeMin} min</p>
						</div>
						{hasWeight && (
							<div className="rounded-lg bg-background p-3 text-center">
								<p className="text-xs text-text-muted">{t('workout.weight')}</p>
								<p className="text-lg font-bold">—</p>
							</div>
						)}
					</div>

					{equipmentList.length > 0 && (
						<div>
							<p className="text-xs text-text-muted mb-2 flex items-center gap-1.5">
								<Dumbbell className="h-3.5 w-3.5" />
								{t('workout.equipment')}
							</p>
							<div className="flex flex-wrap gap-1.5">
								{equipmentList.map(eq => (
									<span
										key={eq.id}
										className="rounded-full bg-background px-3 py-1 text-xs font-medium"
									>
										{eq.nom}
									</span>
								))}
							</div>
						</div>
					)}

					<p className="text-sm text-text-muted leading-relaxed">
						{exercise.descriptionDetaillee}
					</p>
				</div>
			</div>

			{/* Navigation bas */}
			<div className="mt-4 pb-6 space-y-2">
				{completeError && (
					<p className="text-center text-sm text-red-500">{completeError}</p>
				)}
				<div className="flex gap-3">
				<button
					onClick={goPrev}
					disabled={currentIdx === 0}
					className="btn-outline flex-1 flex items-center justify-center gap-2 disabled:opacity-30"
				>
					<SkipBack className="h-4 w-4" />
					{t('workout.prev')}
				</button>
				<button
					onClick={goNext}
					disabled={isCompleting}
					className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
				>
					{isCompleting ? (
						<>
							<span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
							{t('workout.finishing')}
						</>
					) : (
						<>
							{currentIdx < total - 1 ? t('workout.next') : t('workout.finish')}
							{currentIdx < total - 1 && <SkipForward className="h-4 w-4" />}
						</>
					)}
				</button>
				</div>
			</div>
		</div>
	);
}
