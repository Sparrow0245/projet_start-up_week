import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
	Trophy,
	Gift,
	Calendar,
	Lock,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Loader2,
} from 'lucide-react';
import type { RootState } from '../../store/store';
import type { Contest } from '../../types';
import { fetchContests, fetchUserContestEntries, enterContest, withdrawContest } from '../../api/contestApi';
import { fetchUser } from '../../api/userApi';
import AppLayout from '../../components/AppLayout';
import XpLevelCard from '../../components/XpLevelCard';

export default function ContestsPage() {
	const { t } = useTranslation();
	const userId = useSelector((s: RootState) => s.auth.userId);

	const [contests, setContests] = useState<Contest[]>([]);
	const [enteredIds, setEnteredIds] = useState<Set<number>>(new Set());
	const [userLevel, setUserLevel] = useState<number>(1);
	const [userXp, setUserXp] = useState<number>(0);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);
	const [actionLoading, setActionLoading] = useState<number | null>(null);
	const [expandedId, setExpandedId] = useState<number | null>(null);
	const [feedback, setFeedback] = useState<{ id: number; msg: string; ok: boolean } | null>(null);

	useEffect(() => {
		async function load() {
			setLoading(true);
			setLoadError(false);
			try {
				const [data, entries] = await Promise.all([
					fetchContests(),
					userId ? fetchUserContestEntries(userId) : Promise.resolve([]),
				]);
				setContests(data);
				setEnteredIds(new Set(entries));

				if (userId) {
					const user = await fetchUser(userId);
					setUserLevel(user.level ?? 1);
					setUserXp(user.experience ?? 0);
				}
			} catch {
				setLoadError(true);
			} finally {
				setLoading(false);
			}
		}
		load();
	}, [userId]);

	async function handleEnter(contestId: number) {
		if (!userId) return;
		setActionLoading(contestId);
		setFeedback(null);
		try {
			await enterContest(contestId, userId);
			setEnteredIds(prev => new Set([...prev, contestId]));
			setFeedback({ id: contestId, msg: t('contests.registered'), ok: true });
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'error';
			if (msg === 'level_insufficient') {
				setFeedback({ id: contestId, msg: t('contests.levelInsufficient'), ok: false });
			} else if (msg === 'already_registered') {
				setFeedback({ id: contestId, msg: t('contests.alreadyRegistered'), ok: false });
			} else {
				setFeedback({ id: contestId, msg: t('contests.error'), ok: false });
			}
		} finally {
			setActionLoading(null);
		}
	}

	async function handleWithdraw(contestId: number) {
		if (!userId) return;
		setActionLoading(contestId);
		setFeedback(null);
		try {
			await withdrawContest(contestId, userId);
			setEnteredIds(prev => {
				const next = new Set(prev);
				next.delete(contestId);
				return next;
			});
			setFeedback({ id: contestId, msg: t('contests.withdrawn'), ok: true });
		} catch {
			setFeedback({ id: contestId, msg: t('contests.error'), ok: false });
		} finally {
			setActionLoading(null);
		}
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString(undefined, {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});
	}

	function isExpired(dateStr: string) {
		return new Date(dateStr) < new Date();
	}

	if (loading) {
		return (
			<AppLayout>
				<div className="flex flex-col items-center justify-center py-16 gap-4">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			</AppLayout>
		);
	}

	return (
		<AppLayout>
			{loadError && (
				<p className="text-sm text-red-500 text-center py-2">{t('contests.loadError')}</p>
			)}
			{/* Header */}
			<div className="flex items-center gap-3 mb-1">
				<div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary-light/20 text-primary">
					<Trophy className="h-5 w-5" />
				</div>
				<div>
					<h1 className="text-lg font-bold">{t('contests.title')}</h1>
					<p className="text-xs text-text-muted">{t('contests.subtitle')}</p>
				</div>
			</div>

			{/* Niveau actuel */}
			<XpLevelCard level={userLevel} experience={userXp} />

			{/* Liste des concours */}
			<div className="space-y-3">
				{contests.length === 0 && (
					<p className="text-sm text-text-muted text-center py-8">{t('contests.none')}</p>
				)}

				{contests.map(contest => {
					const locked = userLevel < contest.levelRequis;
					const entered = enteredIds.has(contest.id);
					const expired = isExpired(contest.dateLimite);
					const expanded = expandedId === contest.id;
					const isLoading = actionLoading === contest.id;
					const currentFeedback = feedback?.id === contest.id ? feedback : null;

					return (
						<div
							key={contest.id}
							className={`card transition-all ${locked ? 'opacity-60' : ''}`}
						>
							{/* Header carte */}
							<button
								className="w-full flex items-center justify-between gap-2 text-left"
								onClick={() => setExpandedId(expanded ? null : contest.id)}
							>
								<div className="flex items-center gap-3 min-w-0">
									{entered && !locked ? (
										<CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
									) : locked ? (
										<Lock className="h-5 w-5 text-text-muted shrink-0" />
									) : (
										<Trophy className="h-5 w-5 text-primary shrink-0" />
									)}
									<div className="min-w-0">
										<p className="text-sm font-semibold truncate">{contest.titre}</p>
										<p className="text-xs text-text-muted">{t('contests.levelRequired', { level: contest.levelRequis })}</p>
									</div>
								</div>
								{expanded ? <ChevronUp className="h-4 w-4 text-text-muted shrink-0" /> : <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />}
							</button>

							{/* Contenu étendu */}
							{expanded && (
								<div className="mt-3 space-y-3 border-t border-border pt-3">
									<p className="text-sm text-text-muted">{contest.description}</p>

									{/* Récompense */}
									<div className="flex items-center gap-2 rounded-lg bg-primary-light/10 px-3 py-2">
										<Gift className="h-4 w-4 text-primary shrink-0" />
										<span className="text-sm font-medium text-primary">{contest.recompense}</span>
									</div>

									{/* Date limite */}
									<div className="flex items-center gap-2 text-xs text-text-muted">
										<Calendar className="h-3.5 w-3.5 shrink-0" />
										<span>
											{expired
												? t('contests.closed')
												: t('contests.deadline', { date: formatDate(contest.dateLimite) })}
										</span>
									</div>

									{/* Gagnant */}
									{contest.tirageEffectue && contest.gagnant && (
										<div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-2">
											<Trophy className="h-4 w-4 text-green-500 shrink-0" />
											<span className="text-sm font-medium text-green-600 dark:text-green-400">
												{t('contests.winner', {
													name: `${contest.gagnant.prenom} ${contest.gagnant.nom}`,
												})}
											</span>
										</div>
									)}

									{/* Feedback */}
									{currentFeedback && (
										<p className={`text-xs font-medium ${currentFeedback.ok ? 'text-green-600' : 'text-red-500'}`}>
											{currentFeedback.msg}
										</p>
									)}

									{/* Bouton action */}
									{!expired && !contest.tirageEffectue && (
										<>
											{locked ? (
												<div className="flex items-center gap-2 rounded-xl bg-background px-4 py-2.5">
													<Lock className="h-4 w-4 text-text-muted" />
													<span className="text-xs text-text-muted">
														{t('contests.lockHint', { level: contest.levelRequis })}
													</span>
												</div>
											) : entered ? (
												<button
													onClick={() => handleWithdraw(contest.id)}
													disabled={isLoading}
													className="w-full flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-text-muted hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
												>
													{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
													{isLoading ? t('contests.loading') : t('contests.withdraw')}
												</button>
											) : (
												<button
													onClick={() => handleEnter(contest.id)}
													disabled={isLoading}
													className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
												>
													{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
													{isLoading ? t('contests.loading') : t('contests.enter')}
												</button>
											)}
										</>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</AppLayout>
	);
}
