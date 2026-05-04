import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import {
	TrendingUp,
	Clock,
	Target,
	Calendar,
	Flame,
	Dumbbell,
	CheckCircle2,
} from 'lucide-react';
import XpLevelCard from '../../components/XpLevelCard';
import type { AppDispatch, RootState } from '../../store/store';
import type { Session } from '../../types';
import { fetchUserProgram } from '../../store/program/programSlice';
import AppLayout from '../../components/AppLayout';
import { fetchUser } from '../../api/userApi';

/* ── helpers ─────────────────────────────────────────────── */

function getWeekBounds(date: Date): { start: Date; end: Date } {
	const d = new Date(date);
	const day = d.getDay();
	const mondayOffset = day === 0 ? -6 : 1 - day;
	const start = new Date(d);
	start.setHours(0, 0, 0, 0);
	start.setDate(d.getDate() + mondayOffset);
	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	end.setHours(23, 59, 59, 999);
	return { start, end };
}

function isInWeek(dateStr: string | null, weekStart: Date, weekEnd: Date): boolean {
	if (!dateStr) return false;
	const d = new Date(dateStr);
	return d >= weekStart && d <= weekEnd;
}

function isCompletedThisWeek(completedAt: string | null): boolean {
	if (!completedAt) return false;
	const { start, end } = getWeekBounds(new Date());
	return isInWeek(completedAt, start, end);
}

/* ── component ───────────────────────────────────────────── */

export default function ProgressionPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();

	const userId = useSelector((s: RootState) => s.auth.userId);
	const program = useSelector((s: RootState) => s.program.current);
	const loading = useSelector((s: RootState) => s.program.loading);

	const [userXp, setUserXp] = useState(0);
	const [userLevel, setUserLevel] = useState(1);

	useEffect(() => {
		if (userId) dispatch(fetchUserProgram(userId));
	}, [userId, dispatch]);

	useEffect(() => {
		if (!userId) return;
		fetchUser(userId)
			.then(u => {
				setUserXp(u.experience ?? 0);
				setUserLevel(u.level ?? 1);
			})
			.catch(() => {});
	}, [userId]);

	/* ── derived stats ─────────────────────────────────── */

	const sessions: Session[] = program?.sessions ?? [];
	const totalSessions = sessions.length * (program?.durationWeeks ?? 0);
	const sessionsPerWeek = sessions.length;

	// All-time completed (any completedAt, not just this week)
	const completedSessions = sessions.filter(s => s.completedAt !== null);
	const completedCount = completedSessions.length;

	// Total training time for the entire program (weekly template × durationWeeks)
	const weeklyMinutes = sessions.reduce(
		(sum, s) => s.exercices.reduce((a, ex) => a + ex.dureeMin, 0) + sum,
		0,
	);
	const totalMinutes = weeklyMinutes * (program?.durationWeeks ?? 0);
	const totalHours = Math.floor(totalMinutes / 60);
	const remainingMinutes = totalMinutes % 60;

	// Weekly goal
	const completedThisWeek = sessions.filter(s => isCompletedThisWeek(s.completedAt)).length;

	// Last completed session
	const lastCompleted = completedSessions
		.filter(s => s.completedAt)
		.sort((a, b) => {
			const diff = new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime();
			return diff !== 0 ? diff : b.jourNumero - a.jourNumero;
		})[0] ?? null;

	// Streak: count consecutive weeks (going backwards from current week) where
	// the user completed at least sessionsPerWeek sessions.
	const computeStreak = (): number => {
		if (sessionsPerWeek === 0 || completedSessions.length === 0) return 0;
		let streak = 0;
		const now = new Date();

		// Start from this week and go back
		for (let weekOffset = 0; weekOffset < (program?.durationWeeks ?? 52); weekOffset++) {
			const ref = new Date(now);
			ref.setDate(ref.getDate() - weekOffset * 7);
			const { start, end } = getWeekBounds(ref);
			const count = sessions.filter(s => isInWeek(s.completedAt, start, end)).length;
			if (count >= sessionsPerWeek) {
				streak++;
			} else if (weekOffset > 0) {
				// don't break on current week (in progress)
				break;
			}
		}
		return streak;
	};
	const streak = computeStreak();

	// Overall completion percentage
	const completionPercent = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0;

	// Circular progress ring params
	const radius = 54;
	const circumference = 2 * Math.PI * radius;
	const strokeOffset = circumference - (completionPercent / 100) * circumference;

	/* ── render ─────────────────────────────────────────── */

	return (
		<AppLayout>
			<div>
				<p className="text-xs font-medium uppercase tracking-widest text-primary">
					{t('progression.subtitle')}
				</p>
				<h1 className="text-2xl font-bold mt-1">{t('progression.title')}</h1>
			</div>

			{/* ── Bloc XP / Niveau ────────────────────────────── */}
			<XpLevelCard level={userLevel} experience={userXp} />

			{loading ? (
				<div className="flex flex-col items-center gap-3 py-12">
					<div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			) : program ? (
				<>
					{/* ── Circular progress ───────────────────── */}
					<div className="card flex flex-col items-center gap-2 py-6">
						<div className="relative flex items-center justify-center">
							<svg width="132" height="132" className="-rotate-90">
								<circle
									cx="66" cy="66" r={radius}
									stroke="currentColor"
									className="text-border"
									strokeWidth="10"
									fill="none"
								/>
								<circle
									cx="66" cy="66" r={radius}
									stroke="currentColor"
									className="text-primary transition-all duration-700"
									strokeWidth="10"
									fill="none"
									strokeLinecap="round"
									strokeDasharray={circumference}
									strokeDashoffset={strokeOffset}
								/>
							</svg>
							<div className="absolute flex flex-col items-center">
								<span className="text-2xl font-bold">{completionPercent}%</span>
								<span className="text-[11px] text-text-muted">{t('progression.completion')}</span>
							</div>
						</div>
						<p className="text-sm text-text-muted mt-1">
							{completedCount} / {totalSessions} {t('progression.sessionsCompleted')}
						</p>
					</div>

					{/* ── Stat cards grid ─────────────────────── */}
					<div className="grid grid-cols-2 gap-3">
						{/* Total training time */}
						<div className="card flex flex-col items-center gap-1.5 py-4 px-3">
							<Clock className="h-5 w-5 text-accent" />
							<p className="text-lg font-bold">
								{totalHours > 0 ? `${totalHours}h${remainingMinutes > 0 ? remainingMinutes : ''}` : `${totalMinutes}min`}
							</p>
							<p className="text-[11px] text-text-muted text-center leading-tight">
								{t('progression.totalTime')}
							</p>
						</div>

						{/* Weekly goal */}
						<div className="card flex flex-col items-center gap-1.5 py-4 px-3">
							<Target className="h-5 w-5 text-primary" />
							<p className="text-lg font-bold">
								{completedThisWeek} / {sessionsPerWeek}
							</p>
							<p className="text-[11px] text-text-muted text-center leading-tight">
								{t('progression.weeklyGoal')}
							</p>
						</div>

						{/* Streak */}
						<div className="card flex flex-col items-center gap-1.5 py-4 px-3">
							<Flame className="h-5 w-5 text-orange-500" />
							<p className="text-lg font-bold">{streak}</p>
							<p className="text-[11px] text-text-muted text-center leading-tight">
								{t('progression.streak')}
							</p>
						</div>

						{/* Program duration */}
						<div className="card flex flex-col items-center gap-1.5 py-4 px-3">
							<Calendar className="h-5 w-5 text-primary" />
							<p className="text-lg font-bold">{program.durationWeeks}</p>
							<p className="text-[11px] text-text-muted text-center leading-tight">
								{t('progression.programWeeks')}
							</p>
						</div>
					</div>

					{/* ── Last completed session ─────────────── */}
					{lastCompleted ? (
						<div className="card border border-green-300/50 space-y-2">
							<div className="flex items-center gap-2">
								<CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
								<p className="text-xs font-medium uppercase tracking-widest text-green-700">
									{t('progression.lastSession.label')}
								</p>
							</div>
							<div>
								<h2 className="font-semibold">
									{t('progression.lastSession.session')} {lastCompleted.jourNumero}
								</h2>
								<p className="text-sm text-text-muted">
									{lastCompleted.exercices.length} {t('progression.lastSession.exercises')} ·{' '}
									{new Date(lastCompleted.completedAt!).toLocaleDateString()}
								</p>
							</div>
						</div>
					) : (
						<div className="card border border-dashed border-border flex flex-col items-center gap-2 py-6">
							<TrendingUp className="h-8 w-8 text-text-muted" />
							<p className="text-sm text-text-muted text-center">
								{t('progression.noSessionYet')}
							</p>
						</div>
					)}
				</>
			) : (
				/* ── No program ────────────────────────────── */
				<div className="card border border-dashed border-border flex flex-col items-center gap-3 py-8">
					<Dumbbell className="h-10 w-10 text-text-muted" />
					<p className="text-text-muted text-center text-sm max-w-xs">
						{t('progression.noProgram.description')}
					</p>
					<button
						className="btn-primary"
						onClick={() => navigate('/sportForm')}
					>
						{t('progression.noProgram.cta')}
					</button>
				</div>
			)}
		</AppLayout>
	);
}
