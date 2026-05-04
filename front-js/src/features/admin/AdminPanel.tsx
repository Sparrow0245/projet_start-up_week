import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, UserCheck, UserX, Trash2, Loader2, Trophy, Gift, Calendar, PlusCircle, X } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import ConfirmModal from '../../components/ConfirmModal';
import { fetchPendingCoaches, fetchApprovedCoaches, approveCoach, rejectCoach, deleteCoach } from '../../api/adminApi';
import type { UserResponse, CoachInfo } from '../../api/adminApi';
import { fetchContests, drawContestWinner, createContest } from '../../api/contestApi';
import type { Contest } from '../../types';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

export default function AdminPanel() {
	const { t } = useTranslation();
	const adminId = useSelector((s: RootState) => s.auth.userId);
	const [pending, setPending] = useState<UserResponse[]>([]);
	const [approved, setApproved] = useState<CoachInfo[]>([]);
	const [contests, setContests] = useState<Contest[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState<number | null>(null);
	const [drawLoading, setDrawLoading] = useState<number | null>(null);
	const [drawFeedback, setDrawFeedback] = useState<{ id: number; msg: string } | null>(null);
	const [confirmModal, setConfirmModal] = useState<{ message: string; variant: 'danger' | 'primary'; onConfirm: () => void } | null>(null);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [createLoading, setCreateLoading] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [loadError, setLoadError] = useState(false);
	const [createForm, setCreateForm] = useState({
		titre: '',
		description: '',
		recompense: '',
		levelRequis: 10,
		dateLimite: '',
	});

	useEffect(() => {
		loadData();
	}, []);

	async function loadData() {
		setLoading(true);
		setLoadError(false);
		try {
			const [p, a, c] = await Promise.all([fetchPendingCoaches(), fetchApprovedCoaches(), fetchContests()]);
			setPending(p);
			setApproved(a);
			setContests(c);
		} catch {
			setLoadError(true);
		} finally {
			setLoading(false);
		}
	}

	async function handleApprove(id: number) {
		setActionLoading(id);
		setActionError(null);
		try {
			await approveCoach(id);
			await loadData();
		} catch {
			setActionError(t('admin.actionError'));
		} finally {
			setActionLoading(null);
		}
	}

	async function handleReject(id: number) {
		setConfirmModal({
			message: t('admin.confirmReject'),
			variant: 'danger',
			onConfirm: async () => {
				setConfirmModal(null);
				setActionLoading(id);
				setActionError(null);
				try { await rejectCoach(id); await loadData(); } catch { setActionError(t('admin.actionError')); } finally { setActionLoading(null); }
			},
		});
	}

	async function handleDelete(id: number) {
		setConfirmModal({
			message: t('admin.confirmDelete'),
			variant: 'danger',
			onConfirm: async () => {
				setConfirmModal(null);
				setActionLoading(id);
				setActionError(null);
				try { await deleteCoach(id); await loadData(); } catch { setActionError(t('admin.actionError')); } finally { setActionLoading(null); }
			},
		});
	}

	async function handleDraw(contestId: number) {
		if (!adminId) return;
		setConfirmModal({
			message: t('admin.contests.confirmDraw'),
			variant: 'primary',
			onConfirm: async () => {
				setConfirmModal(null);
				setDrawLoading(contestId);
				setDrawFeedback(null);
				try {
					const updated = await drawContestWinner(contestId, adminId);
					setContests(prev => prev.map(c => c.id === contestId ? updated : c));
					setDrawFeedback({ id: contestId, msg: t('admin.contests.drawDone', { name: `${updated.gagnant?.prenom} ${updated.gagnant?.nom}` }) });
				} catch (err) {
					const msg = err instanceof Error ? err.message : '';
					if (msg.includes('draw_already_done')) {
						setDrawFeedback({ id: contestId, msg: t('admin.contests.alreadyDrawn') });
					} else if (msg.includes('no_entries')) {
						setDrawFeedback({ id: contestId, msg: t('admin.contests.noEntries') });
					} else {
						setDrawFeedback({ id: contestId, msg: t('admin.contests.error') });
					}
				} finally {
					setDrawLoading(null);
				}
			},
		});
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
	}

	async function handleCreateContest(e: React.FormEvent) {
		e.preventDefault();
		setCreateLoading(true);
		setCreateError(null);
		try {
			const created = await createContest(createForm);
			setContests(prev => [...prev, created].sort((a, b) => a.dateLimite.localeCompare(b.dateLimite)));
			setShowCreateForm(false);
			setCreateForm({ titre: '', description: '', recompense: '', levelRequis: 10, dateLimite: '' });
		} catch {
			setCreateError(t('admin.contests.createError'));
		} finally {
			setCreateLoading(false);
		}
	}

	return (
		<AppLayout>
			{loadError && (
				<p className="text-sm text-red-500 text-center py-2">{t('admin.loadError')}</p>
			)}
			{actionError && (
				<p className="text-sm text-red-500 text-center py-2">{actionError}</p>
			)}
			<div>
				<p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
					{t('admin.subtitle')}
				</p>
				<h1 className="text-3xl font-bold md:text-4xl flex items-center gap-3">
					<ShieldCheck className="h-8 w-8 text-primary" />
					{t('admin.title')}
				</h1>
			</div>

			{loading ? (
				<div className="flex justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			) : (
				<div className="space-y-8">
					{/* Pending coaches section */}
					<section className="card">
						<h2 className="text-xl font-bold mb-4">{t('admin.pendingTitle')}</h2>
						{pending.length === 0 ? (
							<p className="text-text-muted text-sm">{t('admin.noPending')}</p>
						) : (
							<div className="space-y-3">
								{pending.map(coach => (
									<div
										key={coach.id}
										className="flex items-center justify-between p-4 rounded-xl border border-border bg-background"
									>
										<div>
											<p className="font-semibold">
												{coach.prenom} {coach.nom}
											</p>
											<p className="text-sm text-text-muted">{coach.email}</p>
										</div>
										<div className="flex gap-2">
											<button
												onClick={() => handleApprove(coach.id)}
												disabled={actionLoading === coach.id}
												className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors disabled:opacity-50"
											>
												{actionLoading === coach.id ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<UserCheck className="h-4 w-4" />
												)}
												{t('admin.approve')}
											</button>
											<button
												onClick={() => handleReject(coach.id)}
												disabled={actionLoading === coach.id}
												className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
											>
												<UserX className="h-4 w-4" />
												{t('admin.reject')}
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</section>

					{/* Contests section */}
					<section className="card">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-bold flex items-center gap-2">
								<Trophy className="h-5 w-5 text-primary" />
								{t('admin.contests.title')}
							</h2>
							<button
								onClick={() => setShowCreateForm(v => !v)}
								className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
							>
								{showCreateForm ? <X className="h-3.5 w-3.5" /> : <PlusCircle className="h-3.5 w-3.5" />}
								{showCreateForm ? t('admin.contests.cancelCreate') : t('admin.contests.create')}
							</button>
						</div>

						{/* Formulaire création */}
						{showCreateForm && (
							<form onSubmit={handleCreateContest} className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
								<p className="text-sm font-semibold text-primary">{t('admin.contests.createTitle')}</p>
								<input
									required
									placeholder={t('admin.contests.form.titre')}
									value={createForm.titre}
									onChange={e => setCreateForm(f => ({ ...f, titre: e.target.value }))}
									className="input-field w-full"
								/>
								<textarea
									required
									placeholder={t('admin.contests.form.description')}
									value={createForm.description}
									onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
									className="input-field w-full min-h-[80px]"
								/>
								<input
									required
									placeholder={t('admin.contests.form.recompense')}
									value={createForm.recompense}
									onChange={e => setCreateForm(f => ({ ...f, recompense: e.target.value }))}
									className="input-field w-full"
								/>
								<div className="flex gap-3">
									<div className="flex-1">
										<label className="text-xs text-text-muted mb-1 block">{t('admin.contests.form.levelRequis')}</label>
										<input
											required
											type="number"
											min={1}
											value={createForm.levelRequis}
											onChange={e => setCreateForm(f => ({ ...f, levelRequis: Number(e.target.value) }))}
											className="input-field w-full"
										/>
									</div>
									<div className="flex-1">
										<label className="text-xs text-text-muted mb-1 block">{t('admin.contests.form.dateLimite')}</label>
										<input
											required
											type="date"
											value={createForm.dateLimite}
											onChange={e => setCreateForm(f => ({ ...f, dateLimite: e.target.value }))}
											className="input-field w-full"
										/>
									</div>
								</div>
								{createError && <p className="text-sm text-red-500">{createError}</p>}
								<button
									type="submit"
									disabled={createLoading}
									className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
								>
									{createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
									{t('admin.contests.form.submit')}
								</button>
							</form>
						)}

						{contests.length === 0 ? (
							<p className="text-text-muted text-sm">{t('admin.contests.none')}</p>
						) : (
							<div className="space-y-3">
								{contests.map(contest => {
									const fb = drawFeedback?.id === contest.id ? drawFeedback : null;
									return (
										<div key={contest.id} className="rounded-xl border border-border bg-background p-4 space-y-2">
											<div className="flex items-start justify-between gap-3">
												<div>
													<p className="font-semibold text-sm">{contest.titre}</p>
													<div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
														<span className="flex items-center gap-1">
															<Gift className="h-3.5 w-3.5" />
															{contest.recompense}
														</span>
														<span className="flex items-center gap-1">
															<Calendar className="h-3.5 w-3.5" />
															{formatDate(contest.dateLimite)}
														</span>
													</div>
												</div>
												{contest.tirageEffectue ? (
													<span className="shrink-0 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-1 text-xs font-semibold text-green-600">
														{t('admin.contests.drawn')}
													</span>
												) : (
													<button
														onClick={() => handleDraw(contest.id)}
														disabled={drawLoading === contest.id}
														className="shrink-0 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
													>
														{drawLoading === contest.id ? (
															<Loader2 className="h-3.5 w-3.5 animate-spin" />
														) : (
															<Trophy className="h-3.5 w-3.5" />
														)}
														{t('admin.contests.draw')}
													</button>
												)}
											</div>
											{contest.gagnant && (
												<p className="text-xs font-medium text-green-600">
													🏆 {t('admin.contests.winner', { name: `${contest.gagnant.prenom} ${contest.gagnant.nom}` })}
												</p>
											)}
											{fb && (
												<p className="text-xs font-medium text-primary">{fb.msg}</p>
											)}
										</div>
									);
								})}
							</div>
						)}
					</section>

					{/* Approved coaches section */}
					<section className="card">
						<h2 className="text-xl font-bold mb-4">{t('admin.approvedTitle')}</h2>
						{approved.length === 0 ? (
							<p className="text-text-muted text-sm">{t('admin.noApproved')}</p>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-left text-sm">
									<thead>
										<tr className="border-b border-border">
											<th className="pb-3 font-semibold">{t('admin.table.name')}</th>
											<th className="pb-3 font-semibold">{t('admin.table.email')}</th>
											<th className="pb-3 font-semibold text-center">
												{t('admin.table.exercises')}
											</th>
											<th className="pb-3 font-semibold text-right">
												{t('admin.table.actions')}
											</th>
										</tr>
									</thead>
									<tbody>
										{approved.map(coach => (
											<tr key={coach.id} className="border-b border-border/50">
												<td className="py-3 font-medium">
													{coach.prenom} {coach.nom}
												</td>
												<td className="py-3 text-text-muted">{coach.email}</td>
												<td className="py-3 text-center">
													<span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
														{coach.exerciseCount}
													</span>
												</td>
												<td className="py-3 text-right">
													<button
														onClick={() => handleDelete(coach.id)}
														disabled={actionLoading === coach.id}
														className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
													>
														{actionLoading === coach.id ? (
															<Loader2 className="h-3.5 w-3.5 animate-spin" />
														) : (
															<Trash2 className="h-3.5 w-3.5" />
														)}
														{t('admin.deleteCoach')}
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</section>
				</div>
			)}

			{/* Modale de confirmation */}
			{confirmModal && (
				<ConfirmModal
					message={confirmModal.message}
					variant={confirmModal.variant}
					confirmLabel={t('common.confirm')}
					cancelLabel={t('common.cancel')}
					onConfirm={confirmModal.onConfirm}
					onCancel={() => setConfirmModal(null)}
				/>
			)}
		</AppLayout>
	);
}
