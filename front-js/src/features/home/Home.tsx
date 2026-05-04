import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import {
	ClipboardList,
	ChevronRight,
	Calendar,
	Layers,
	Clock,
	Play,
	Dumbbell,
	CheckCircle2,
	TrendingUp,
} from 'lucide-react';
import type { AppDispatch, RootState } from '../../store/store';
import type { Session } from '../../types';
import { fetchUserProgram } from '../../store/program/programSlice';
import AppLayout from '../../components/AppLayout';

function isCompletedThisWeek(completedAt: string | null): boolean {
	if (!completedAt) return false;
	const completed = new Date(completedAt);
	const now = new Date();
	const day = now.getDay();
	const mondayOffset = day === 0 ? -6 : 1 - day;
	const monday = new Date(now);
	monday.setHours(0, 0, 0, 0);
	monday.setDate(now.getDate() + mondayOffset);
	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);
	sunday.setHours(23, 59, 59, 999);
	return completed >= monday && completed <= sunday;
}

export default function Home() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();

	const userPrenom = useSelector(
		(state: RootState) => state.auth.userPrenom,
	);
	const userId = useSelector(
		(state: RootState) => state.auth.userId,
	);
	const program = useSelector(
		(state: RootState) => state.program.current,
	);
	const programLoading = useSelector(
		(state: RootState) => state.program.loading,
	);

	useEffect(() => {
		if (userId && !program) {
			dispatch(fetchUserProgram(userId));
		}
	}, [userId, program, dispatch]);

	const sessions: Session[] = program?.sessions ?? [];
	const totalExercises = sessions.reduce(
		(sum: number, s: Session) => sum + s.exercices.length,
		0,
	);
	const totalDuration = sessions.reduce(
		(sum: number, s: Session) =>
			s.exercices.reduce((a: number, ex) => a + ex.dureeMin, 0) + sum,
		0,
	);

	const completedCount = sessions.filter(s => isCompletedThisWeek(s.completedAt)).length;
	const nextSessionIdx = sessions.findIndex(s => !isCompletedThisWeek(s.completedAt));
	const nextSession = nextSessionIdx >= 0 ? sessions[nextSessionIdx] : null;
	const allDone = sessions.length > 0 && completedCount === sessions.length;
	const nextSessionDuration = nextSession
		? nextSession.exercices.reduce((a: number, ex) => a + ex.dureeMin, 0)
		: 0;

	return (
		<AppLayout>
			<div>
				<p className="text-3xl font-bold">
					{userPrenom
						? t('home.greeting', { name: userPrenom })
						: t('home.greetingDefault')}
				</p>
			</div>

			{programLoading ? (
				<div className="flex flex-col items-center gap-3 py-12">
					<div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			) : program ? (
				<>
					{/* Stats du programme */}
					<div className="grid grid-cols-3 gap-3">
						<div className="card flex flex-col items-center gap-1 py-3 px-2">
							<Calendar className="h-5 w-5 text-primary" />
							<p className="text-lg font-bold">{sessions.length}</p>
							<p className="text-[11px] text-text-muted text-center leading-tight">
								{t('home.stats.weekSessions')}
							</p>
						</div>
						<div className="card flex flex-col items-center gap-1 py-3 px-2">
							<Layers className="h-5 w-5 text-accent" />
							<p className="text-lg font-bold">{totalExercises}</p>
							<p className="text-[11px] text-text-muted text-center leading-tight">
								{t('home.stats.totalExercises')}
							</p>
						</div>
						<div className="card flex flex-col items-center gap-1 py-3 px-2">
							<Clock className="h-5 w-5 text-primary" />
							<p className="text-lg font-bold">{totalDuration}</p>
							<p className="text-[11px] text-text-muted text-center leading-tight">
								{t('home.stats.totalMinutes')}
							</p>
						</div>
					</div>

					{/* Prochaine séance ou toutes terminées */}
					{allDone ? (
						<div className="card border border-green-300 bg-green-50/30 space-y-3">
							<div className="flex items-center gap-3">
								<CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
								<div>
									<h2 className="font-semibold text-green-700">
										{t('home.nextSession.allDone')}
									</h2>
									<p className="text-sm text-green-600">
										{t('home.nextSession.allDoneDesc')}
									</p>
								</div>
							</div>
						</div>
					) : nextSession && (
						<div className="card border border-primary-light/50 space-y-3">
							<p className="text-xs font-medium uppercase tracking-widest text-primary">
								{t('home.nextSession.label')}
							</p>
							<div className="flex items-center justify-between">
								<div>
									<h2 className="font-semibold">
										{t('home.nextSession.session')} {nextSession.jourNumero}
									</h2>
									<p className="text-sm text-text-muted">
										{nextSession.exercices.length} {t('home.nextSession.exercises')} · {nextSessionDuration} min
									</p>
								</div>
								<button
									onClick={() => navigate(`/session/${nextSessionIdx}`)}
									className="flex items-center justify-center h-11 w-11 rounded-full bg-primary text-text-light shrink-0 transition-transform hover:scale-105 active:scale-95"
								>
									<Play className="h-5 w-5 ml-0.5" />
								</button>
							</div>
						</div>
					)}
				</>
			) : (
				/* Pas de programme */
				<div className="card border border-dashed border-border flex flex-col items-center gap-3 py-8">
					<Dumbbell className="h-10 w-10 text-text-muted" />
					<p className="text-text-muted text-center text-sm max-w-xs">
						{t('home.noProgram.description')}
					</p>
					<button
						className="btn-primary"
						onClick={() => navigate('/sportForm')}
					>
						{t('home.noProgram.cta')}
					</button>
				</div>
			)}

			{/* Cartes navigation */}
			<div className="flex flex-col gap-3 flex-1">
				<button
					onClick={() => navigate('/programme')}
					className="card w-full text-left flex items-center gap-4 border border-border transition-colors hover:border-accent-light flex-1"
				>
					<span className="flex items-center justify-center h-12 w-12 rounded-xl bg-accent-light/30 text-accent shrink-0">
						<ClipboardList className="h-6 w-6" />
					</span>
					<div className="flex-1">
						<h2 className="font-semibold">{t('home.program.title')}</h2>
						<p className="text-sm text-text-muted mt-0.5">
							{t('home.program.description')}
						</p>
					</div>
					<ChevronRight className="h-5 w-5 text-text-muted shrink-0" />
				</button>

				<button
					onClick={() => navigate('/progression')}
					className="card w-full text-left flex items-center gap-4 border border-border transition-colors hover:border-green-400 flex-1"
				>
					<span className="flex items-center justify-center h-12 w-12 rounded-xl bg-green-100/30 text-green-600 shrink-0">
						<TrendingUp className="h-6 w-6" />
					</span>
					<div className="flex-1">
						<h2 className="font-semibold">{t('home.progression.title')}</h2>
						<p className="text-sm text-text-muted mt-0.5">
							{t('home.progression.description')}
						</p>
					</div>
					<ChevronRight className="h-5 w-5 text-text-muted shrink-0" />
				</button>

				<button
					onClick={() => navigate('/exercices')}
					className="card w-full text-left flex items-center gap-4 border border-border transition-colors hover:border-primary-light flex-1"
				>
					<span className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary-light/30 text-primary shrink-0">
						<Dumbbell className="h-6 w-6" />
					</span>
					<div className="flex-1">
						<h2 className="font-semibold">{t('home.exercises.title')}</h2>
						<p className="text-sm text-text-muted mt-0.5">
							{t('home.exercises.description')}
						</p>
					</div>
					<ChevronRight className="h-5 w-5 text-text-muted shrink-0" />
				</button>
			</div>
		</AppLayout>
	);
}
