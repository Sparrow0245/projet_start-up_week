import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Check, X, Crown } from 'lucide-react';
import AppLayout from '../../components/AppLayout';

interface PlanFeature {
	label: string;
	free: boolean;
	premium: boolean;
}

export default function SubscriptionChoice() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const features: PlanFeature[] = [
		{
			label: t('subscription.features.basicProgram'),
			free: true,
			premium: true,
		},
		{
			label: t('subscription.features.exerciseLibrary'),
			free: true,
			premium: true,
		},
		{
			label: t('subscription.features.progressTracking'),
			free: false,
			premium: true,
		},
		{
			label: t('subscription.features.customProgram'),
			free: false,
			premium: true,
		},
		{
			label: t('subscription.features.voiceCoaching'),
			free: false,
			premium: true,
		},
		{
			label: t('subscription.features.postureAnalysis'),
			free: false,
			premium: true,
		},
		{
			label: t('subscription.features.physicalTests'),
			free: false,
			premium: true,
		},
		{
			label: t('subscription.features.prioritySupport'),
			free: false,
			premium: true,
		},
	];

	function handleSelectFree() {
		navigate('/exercices');
	}

	function handleSelectPremium() {
		navigate('/payment');
	}

	return (
		<AppLayout showBack>
			<div className="text-center space-y-2">
				<p className="text-sm tracking-widest uppercase text-text-muted">
					{t('subscription.subtitle')}
				</p>
				<h1 className="text-2xl font-bold">{t('subscription.title')}</h1>
				<p className="text-sm text-text-muted max-w-md mx-auto">
					{t('subscription.description')}
				</p>
			</div>

			{/* Plan Gratuit */}
			<div className="card border border-border space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-lg font-bold">{t('subscription.free.name')}</h2>
						<p className="text-sm text-text-muted">
							{t('subscription.free.tagline')}
						</p>
					</div>
					<div className="text-right">
						<p className="text-2xl font-bold">0€</p>
						<p className="text-xs text-text-muted">
							{t('subscription.forever')}
						</p>
					</div>
				</div>

				<hr className="border-border" />

				<ul className="space-y-2.5">
					{features.map((feat, i) => (
						<li key={i} className="flex items-center gap-2.5 text-sm">
							{feat.free ? (
								<span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary-light/30 text-primary shrink-0">
									<Check className="h-3 w-3" />
								</span>
							) : (
								<span className="flex items-center justify-center h-5 w-5 rounded-full bg-border shrink-0">
									<X className="h-3 w-3 text-text-muted" />
								</span>
							)}
							<span className={!feat.free ? 'text-text-muted' : ''}>
								{feat.label}
							</span>
						</li>
					))}
				</ul>

				<button onClick={handleSelectFree} className="btn-outline">
					{t('subscription.free.cta')}
				</button>
			</div>

			{/* Plan Premium */}
			<div className="card border-2 border-accent space-y-4 relative overflow-hidden">
				{/* Badge populaire */}
				<div className="absolute top-0 right-0 bg-accent text-text-light text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
					{t('subscription.popular')}
				</div>

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="flex items-center justify-center h-8 w-8 rounded-full bg-accent-light/30 text-accent">
							<Crown className="h-4 w-4" />
						</span>
						<div>
							<h2 className="text-lg font-bold">
								{t('subscription.premium.name')}
							</h2>
							<p className="text-sm text-text-muted">
								{t('subscription.premium.tagline')}
							</p>
						</div>
					</div>
					<div className="text-right">
						<p className="text-2xl font-bold text-accent">9.99€</p>
						<p className="text-xs text-text-muted">
							/{t('subscription.month')}
						</p>
					</div>
				</div>

				<hr className="border-border" />

				<ul className="space-y-2.5">
					{features.map((feat, i) => (
						<li key={i} className="flex items-center gap-2.5 text-sm">
							<span className="flex items-center justify-center h-5 w-5 rounded-full bg-accent-light/30 text-accent shrink-0">
								<Check className="h-3 w-3" />
							</span>
							<span>{feat.label}</span>
						</li>
					))}
				</ul>

				<button onClick={handleSelectPremium} className="btn-accent">
					{t('subscription.premium.cta')}
				</button>
			</div>

			{/* Mention légale */}
			<p className="text-center text-xs text-text-muted px-4">
				{t('subscription.legal')}
			</p>
		</AppLayout>
	);
}
