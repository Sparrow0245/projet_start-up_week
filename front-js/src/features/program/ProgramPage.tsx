import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
	Clock,
	Dumbbell,
	ChevronDown,
	ChevronUp,
	Calendar,
	Layers,
	Play,
	CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';
import type { RootState } from '../../store/store';
import type { Session } from '../../types';
import AppLayout from '../../components/AppLayout';
import ProgramFeedback from './ProgramFeedback';

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

function SessionCard({
	session,
	sessionIndex,
}: {
	session: Session;
	sessionIndex: number;
}) {
	const isCompleted = isCompletedThisWeek(session.completedAt);
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);

	const totalDuration = session.exercices.reduce(
		(sum, ex) => sum + ex.dureeMin,
		0,
	);

	const equipmentSet = new Map<number, string>();
	session.exercices.forEach(ex =>
		ex.materielNecessaire?.forEach(eq => equipmentSet.set(eq.id, eq.nom)),
	);
	const equipmentList = [...equipmentSet.values()];

	return (
		<div className={`card border ${isCompleted ? 'border-green-300 bg-green-50/30' : 'border-border'}`}>
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="flex-1 flex items-center justify-between gap-3"
				>
					<div className="flex items-center gap-3">
						{isCompleted ? (
							<span className="flex items-center justify-center h-10 w-10 rounded-xl bg-green-100 text-green-600 shrink-0">
								<CheckCircle2 className="h-5 w-5" />
							</span>
						) : (
							<span className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary-light/30 text-primary shrink-0 font-bold text-sm">
								J{session.jourNumero}
							</span>
						)}
						<div className="text-left">
							<h3 className="font-semibold">
								{t('program.session')} {session.jourNumero}
							</h3>
							<div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
								<span className="flex items-center gap-1">
									<Clock className="h-3 w-3" />
									{totalDuration} min
								</span>
								<span className="flex items-center gap-1">
									<Layers className="h-3 w-3" />
									{session.exercices.length} {t('program.exercises')}
								</span>
							</div>
						</div>
					</div>
					{isOpen ? (
						<ChevronUp className="h-5 w-5 text-text-muted shrink-0" />
					) : (
						<ChevronDown className="h-5 w-5 text-text-muted shrink-0" />
					)}
				</button>
				{!isCompleted && (
					<button
						onClick={() => navigate(`/session/${sessionIndex}`)}
						className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-text-light shrink-0 transition-transform hover:scale-105 active:scale-95"
					>
						<Play className="h-4 w-4 ml-0.5" />
					</button>
				)}
			</div>

			{isOpen && (
				<div className="mt-4 space-y-4">
					{equipmentList.length > 0 && (
						<div className="flex flex-wrap gap-1.5">
							<Dumbbell className="h-4 w-4 text-text-muted mt-0.5" />
							{equipmentList.map(name => (
								<span
									key={name}
									className="rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-text-muted"
								>
									{name}
								</span>
							))}
						</div>
					)}

					<div className="space-y-3">
						{session.exercices.map((ex, idx) => (
							<div
								key={ex.id}
								className="flex gap-3 p-3 rounded-lg bg-background"
							>
								<span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-text-light text-xs font-bold shrink-0 mt-0.5">
									{idx + 1}
								</span>
								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between gap-2">
										<h4 className="font-semibold text-sm">{ex.nom}</h4>
										<span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-text-muted shrink-0 border border-border">
											{ex.intensite}
										</span>
									</div>
									<div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
										<span>
											{ex.series} {t('program.series')}
										</span>
										<span>·</span>
										<span>{ex.repTemps}</span>
										<span>·</span>
										<span>{ex.dureeMin} min</span>
									</div>
									<p className="text-xs text-text-muted mt-1.5 leading-relaxed">
										{ex.descriptionDetaillee}
									</p>
								</div>
							</div>
						))}
					</div>

					{isCompleted ? (
						<div className="flex items-center justify-center gap-2 mt-2 py-2.5 rounded-lg bg-green-100 text-green-700 text-sm font-medium">
							<CheckCircle2 className="h-4 w-4" />
							{t('program.sessionDone')}
						</div>
					) : (
						<button
							onClick={() => navigate(`/session/${sessionIndex}`)}
							className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
						>
							<Play className="h-4 w-4" />
							{t('program.startSession')}
						</button>
					)}
				</div>
			)}
		</div>
	);
}

export default function ProgramPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const program = useSelector((state: RootState) => state.program.current);

	if (!program) {
		return (
			<AppLayout>
				<div className="flex flex-col items-center justify-center gap-4 py-16">
					<ClipboardEmpty className="h-16 w-16 text-text-muted" />
					<h2 className="text-xl font-bold">{t('program.empty.title')}</h2>
					<p className="text-text-muted text-center max-w-sm">
						{t('program.empty.description')}
					</p>
					<button
						className="btn-primary"
						onClick={() => navigate('/sportForm')}
					>
						{t('program.empty.cta')}
					</button>
				</div>
			</AppLayout>
		);
	}

	const sessions: Session[] = program.sessions;
	const totalExercises = sessions.reduce(
		(sum: number, s: Session) => sum + s.exercices.length,
		0,
	);
	const totalDuration = sessions.reduce(
		(sum: number, s: Session) =>
			s.exercices.reduce((a: number, ex) => a + ex.dureeMin, 0) + sum,
		0,
	);

	return (
		<AppLayout>
			<div className="space-y-2">
				<p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
					{t('program.subtitle')}
				</p>
				<h1 className="text-3xl font-bold">{t('program.title')}</h1>
				<p className="text-sm text-text-muted">
					{t('program.createdOn')} {program.dateCreation}
					{program.durationWeeks > 0 &&
						` · ${t('program.durationWeeks', { count: program.durationWeeks })}`}
				</p>
			</div>

			<div className="grid grid-cols-3 gap-3">
				<div className="card flex flex-col items-center gap-1 py-3 px-2">
					<Calendar className="h-5 w-5 text-primary" />
					<p className="text-lg font-bold">{program.sessions.length}</p>
					<p className="text-[11px] text-text-muted text-center leading-tight">
						{t('program.sessionsCount')}
					</p>
				</div>
				<div className="card flex flex-col items-center gap-1 py-3 px-2">
					<Layers className="h-5 w-5 text-accent" />
					<p className="text-lg font-bold">{totalExercises}</p>
					<p className="text-[11px] text-text-muted text-center leading-tight">
						{t('program.exercisesCount')}
					</p>
				</div>
				<div className="card flex flex-col items-center gap-1 py-3 px-2">
					<Clock className="h-5 w-5 text-primary" />
					<p className="text-lg font-bold">{totalDuration}</p>
					<p className="text-[11px] text-text-muted text-center leading-tight">
						{t('program.totalMinutes')}
					</p>
				</div>
			</div>

			<div className="space-y-3">
				{sessions
					.map((session: Session, idx: number) => ({ session, idx }))
					.sort((a, b) => {
						const aDone = isCompletedThisWeek(a.session.completedAt) ? 1 : 0;
						const bDone = isCompletedThisWeek(b.session.completedAt) ? 1 : 0;
						return aDone !== bDone ? aDone - bDone : a.idx - b.idx;
					})
					.map(({ session, idx }) => (
					<SessionCard
						key={session.id}
						session={session}
						sessionIndex={idx}
					/>
				))}
			</div>

			<ProgramFeedback />
		</AppLayout>
	);
}

function ClipboardEmpty({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={1.5}
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
			/>
		</svg>
	);
}
