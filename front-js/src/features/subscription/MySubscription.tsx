import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
	Crown,
	CreditCard,
	CalendarDays,
	RefreshCw,
	AlertTriangle,
} from 'lucide-react';
import AppLayout from '../../components/AppLayout';

export default function MySubscription() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [showCancel, setShowCancel] = useState(false);
	const [isCancelled, setIsCancelled] = useState(false);

	// Donnees factices
	const mockSubscription = {
		plan: 'Premium',
		price: '9.99',
		startDate: '15/02/2026',
		nextPayment: '15/03/2026',
		cardLast4: '4821',
	};

	function handleCancel() {
		setIsCancelled(true);
		setShowCancel(false);
	}

	return (
		<AppLayout showBack>
			{/* Titre */}
			<div className="text-center space-y-2">
				<p className="text-sm tracking-widest uppercase text-text-muted">
					{t('mySubscription.subtitle')}
				</p>
				<h1 className="text-2xl font-bold">{t('mySubscription.title')}</h1>
			</div>

			{/* Info abonnement */}
			<div className="card space-y-4">
				<div className="flex items-center gap-3">
					<span className="flex items-center justify-center h-10 w-10 rounded-full bg-accent-light/30 text-accent shrink-0">
						<Crown className="h-5 w-5" />
					</span>
					<div className="flex-1">
						<p className="text-xs text-text-muted">
							{t('mySubscription.plan')}
						</p>
						<p className="font-semibold">{mockSubscription.plan}</p>
					</div>
					<p className="text-lg font-bold text-accent">
						{mockSubscription.price}€
						<span className="text-xs font-normal text-text-muted">
							/{t('mySubscription.month')}
						</span>
					</p>
				</div>

				<hr className="border-border" />

				<div className="flex items-center gap-3">
					<span className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-light/30 text-primary shrink-0">
						<CalendarDays className="h-5 w-5" />
					</span>
					<div>
						<p className="text-xs text-text-muted">
							{t('mySubscription.startDate')}
						</p>
						<p className="font-semibold">{mockSubscription.startDate}</p>
					</div>
				</div>

				<hr className="border-border" />

				<div className="flex items-center gap-3">
					<span className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-light/30 text-primary shrink-0">
						<CreditCard className="h-5 w-5" />
					</span>
					<div>
						<p className="text-xs text-text-muted">
							{t('mySubscription.nextPayment')}
						</p>
						<p className="font-semibold">{mockSubscription.nextPayment}</p>
						<p className="text-xs text-text-muted mt-0.5">
							{t('mySubscription.cardEnding')} {mockSubscription.cardLast4}
						</p>
					</div>
				</div>
			</div>

			{/* Actions */}
			<div className="space-y-3">
				{/* Changer d'abonnement */}
				<button
					onClick={() => navigate('/subscription')}
					className="card w-full text-left flex items-center gap-3 border border-border transition-colors hover:border-accent-light"
				>
					<span className="flex items-center justify-center h-10 w-10 rounded-xl bg-accent-light/30 text-accent shrink-0">
						<RefreshCw className="h-5 w-5" />
					</span>
					<div className="flex-1">
						<p className="font-semibold">{t('mySubscription.changePlan')}</p>
						<p className="text-xs text-text-muted">
							{t('mySubscription.changePlanDesc')}
						</p>
					</div>
				</button>

				{/* Resilier */}
				{!isCancelled ? (
					<button
						onClick={() => setShowCancel(true)}
						className="w-full text-center text-sm text-text-muted underline underline-offset-2 transition-colors hover:text-primary py-2"
					>
						{t('mySubscription.cancel')}
					</button>
				) : (
					<div className="card border border-primary-light/50 text-center space-y-1">
						<p className="font-semibold text-primary">
							{t('mySubscription.cancelled')}
						</p>
						<p className="text-xs text-text-muted">
							{t('mySubscription.cancelledDesc')}
						</p>
					</div>
				)}
			</div>

			{/* Modal de confirmation resiliation */}
			{showCancel && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-text/40 px-6">
					<div className="card w-full max-w-sm space-y-4 text-center">
						<span className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-light/30 text-primary mx-auto">
							<AlertTriangle className="h-6 w-6" />
						</span>
						<h2 className="text-lg font-bold">
							{t('mySubscription.cancelModal.title')}
						</h2>
						<p className="text-sm text-text-muted">
							{t('mySubscription.cancelModal.message')}
						</p>
						<div className="flex gap-3">
							<button
								onClick={() => setShowCancel(false)}
								className="btn-outline flex-1"
							>
								{t('mySubscription.cancelModal.keep')}
							</button>
							<button onClick={handleCancel} className="btn-primary flex-1">
								{t('mySubscription.cancelModal.confirm')}
							</button>
						</div>
					</div>
				</div>
			)}
		</AppLayout>
	);
}
