import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useSelector} from 'react-redux';
import {
	User,
	Mail,
	Shield,
	ClipboardList,
	ChevronRight,
	LogOut,
	Dumbbell,
	AlertTriangle,
} from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import { fetchUser } from '../../api/userApi';
import type { UserResponse } from '../../api/apiClient';
import { useEffect, useState } from 'react';
import type { RootState } from '../../store/store';
import XpLevelCard from '../../components/XpLevelCard';

export default function UserProfile() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const [user, setUser] = useState<UserResponse | null>(null);
	const [loadingUser, setLoadingUser] = useState(true);
	const [fetchError, setFetchError] = useState(false);

	const userId = useSelector(
		(state: RootState) => state.auth.userId,
	);
	
	useEffect(() => {
		if (!userId) return;
		setLoadingUser(true);
		setFetchError(false);
		fetchUser(userId)
			.then(setUser)
			.catch(() => setFetchError(true))
			.finally(() => setLoadingUser(false));
	}, [userId]);

	if (loadingUser) {
		return (
			<AppLayout>
				<div className="flex items-center justify-center py-16">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
				</div>
			</AppLayout>
		);
	}

	if (fetchError || !user) {
		return (
			<AppLayout>
				<div className="flex flex-col items-center justify-center py-16 gap-3">
					<p className="text-text-muted text-sm">{t('profile.loadError')}</p>
					<button className="btn-primary" onClick={() => window.location.reload()}>
						{t('common.retry')}
					</button>
				</div>
			</AppLayout>
		);
	}

	return (
		<AppLayout>
			<div className="flex flex-col items-center gap-3 py-4">
				<div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary-light/30 text-primary">
					<User className="h-10 w-10" />
				</div>
				<div>
					<XpLevelCard level={user.level} experience={user.experience} />
				</div>
				<div className="text-center">
					<h1 className="text-xl font-bold">{user.prenom} {user.nom}</h1>
				</div>
			</div>
			<div className="card space-y-4">
				<h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted">
					{t('profile.info.title')}
				</h2>
				<div className="space-y-3">
					<div className="flex items-center gap-3">
						<Mail className="h-4 w-4 text-text-muted shrink-0" />
						<span className="text-sm">{user.email}</span>
					</div>

					{user.sportChoisi && (
						<div className="flex items-center gap-3">
							<ClipboardList className="h-4 w-4 text-text-muted shrink-0" />
							<span className="text-sm">{user.sportChoisi.nom}</span>
						</div>
					)}

					{user.poste && (
						<div className="flex items-center gap-3">
							<User className="h-4 w-4 text-text-muted shrink-0" />
							<span className="text-sm">{user.poste.nom}</span>
						</div>
					)}

					{user.materielPossede && user.materielPossede.length > 0 && (
						<div className="space-y-1.5">
							<p className="text-xs text-text-muted flex items-center gap-1.5">
								<Dumbbell className="h-3.5 w-3.5" />
								{t('profile.info.equipment')}
							</p>
							<div className="flex flex-wrap gap-1.5">
								{user.materielPossede.map(eq => (
									<span
										key={eq.id}
										className="rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-text-muted border border-border"
									>
										{eq.nom}
									</span>
								))}
							</div>
						</div>
					)}

					{user.blessures && user.blessures.length > 0 && (
						<div className="space-y-1.5">
							<p className="text-xs text-text-muted flex items-center gap-1.5">
								<AlertTriangle className="h-3.5 w-3.5" />
								{t('profile.info.injuries')}
							</p>
							<div className="flex flex-wrap gap-1.5">
								{user.blessures.includes('AUCUNE') ? (
									<span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600 border border-green-200">
										{t('profile.info.noInjury')}
									</span>
								) : (
									user.blessures.map(b => (
										<span
											key={b}
											className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600 border border-red-200"
										>
											{t(`questionnaire.constraint.${b}`)}
										</span>
									))
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			<div className="card space-y-1 divide-y divide-border">
				<button
					onClick={() => navigate('/sportForm')}
					className="w-full flex items-center gap-3 py-3 text-left hover:text-primary transition-colors"
				>
					<ClipboardList className="h-5 w-5 text-text-muted shrink-0" />
					<span className="flex-1 text-sm font-medium">{t('profile.actions.editSport')}</span>
					<ChevronRight className="h-4 w-4 text-text-muted" />
				</button>
				<button
					onClick={() => navigate('/my-subscription')}
					className="w-full flex items-center gap-3 py-3 text-left hover:text-primary transition-colors"
				>
					<Shield className="h-5 w-5 text-text-muted shrink-0" />
					<span className="flex-1 text-sm font-medium">{t('profile.actions.subscription')}</span>
					<ChevronRight className="h-4 w-4 text-text-muted" />
				</button>
				<button
					onClick={() => navigate('/')}
					className="w-full flex items-center gap-3 py-3 text-left hover:text-primary transition-colors"
				>
					<LogOut className="h-5 w-5 text-text-muted shrink-0" />
					<span className="flex-1 text-sm font-medium text-primary">{t('profile.actions.logout')}</span>
				</button>
			</div>
		</AppLayout>
	);
}