import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CreditCard, Lock, ShieldCheck, PartyPopper } from 'lucide-react';
import AppLayout from '../../components/AppLayout';

export default function Payment() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const [form, setForm] = useState({
		cardName: '',
		cardNumber: '',
		expiry: '',
		cvv: '',
	});
	const [isPaid, setIsPaid] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		if (name === 'cardNumber') {
			const digits = value.replace(/\D/g, '').slice(0, 16);
			const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
			setForm(prev => ({ ...prev, cardNumber: formatted }));
			return;
		}

		if (name === 'expiry') {
			const digits = value.replace(/\D/g, '').slice(0, 4);
			const formatted =
				digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
			setForm(prev => ({ ...prev, expiry: formatted }));
			return;
		}

		if (name === 'cvv') {
			const digits = value.replace(/\D/g, '').slice(0, 3);
			setForm(prev => ({ ...prev, cvv: digits }));
			return;
		}

		setForm(prev => ({ ...prev, [name]: value }));
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsProcessing(true);

		// Simule un délai de paiement
		setTimeout(() => {
			setIsProcessing(false);
			setIsPaid(true);
		}, 2000);
	};

	// Écran de confirmation
	if (isPaid) {
		return (
			<AppLayout>
				<div className="flex flex-col items-center justify-center text-center space-y-6 py-12">
					<span className="flex items-center justify-center h-20 w-20 rounded-full bg-primary-light/30 text-primary">
						<PartyPopper className="h-10 w-10" />
					</span>

					<div className="space-y-2">
						<h1 className="text-2xl font-bold">{t('payment.success.title')}</h1>
						<p className="text-text-muted text-sm max-w-xs mx-auto">
							{t('payment.success.message')}
						</p>
					</div>

					<div className="card text-left w-full space-y-3">
						<div className="flex justify-between text-sm">
							<span className="text-text-muted">
								{t('payment.success.plan')}
							</span>
							<span className="font-semibold">Premium</span>
						</div>
						<hr className="border-border" />
						<div className="flex justify-between text-sm">
							<span className="text-text-muted">
								{t('payment.success.amount')}
							</span>
							<span className="font-semibold">
								9.99€/{t('subscription.month')}
							</span>
						</div>
						<hr className="border-border" />
						<div className="flex justify-between text-sm">
							<span className="text-text-muted">
								{t('payment.success.date')}
							</span>
							<span className="font-semibold">
								{new Date().toLocaleDateString('fr-FR')}
							</span>
						</div>
					</div>

					<button
						onClick={() => navigate('/exercices')}
						className="btn-primary"
					>
						{t('payment.success.cta')}
					</button>
				</div>
			</AppLayout>
		);
	}

	const footerContent = (
		<div className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
			<Lock className="h-3 w-3" />
			<span>{t('payment.securedBy')}</span>
		</div>
	);

	return (
		<AppLayout footer={footerContent} showBack>
			{/* En-tête */}
			<div className="text-center space-y-2">
				<p className="text-sm tracking-widest uppercase text-text-muted">
					{t('payment.subtitle')}
				</p>
				<h1 className="text-2xl font-bold">{t('payment.title')}</h1>
			</div>

			{/* Récap abonnement */}
			<div className="card flex items-center justify-between">
				<div>
					<p className="font-semibold">Premium</p>
					<p className="text-xs text-text-muted">{t('payment.recurring')}</p>
				</div>
				<div className="text-right">
					<p className="text-xl font-bold text-accent">9.99€</p>
					<p className="text-xs text-text-muted">/{t('subscription.month')}</p>
				</div>
			</div>

			{/* Formulaire de paiement */}
			<form onSubmit={handleSubmit} className="card space-y-4 text-left">
				<div className="flex items-center gap-2 mb-1">
					<CreditCard className="h-5 w-5 text-primary" />
					<h2 className="font-semibold">{t('payment.cardInfo')}</h2>
				</div>

				{/* Nom sur la carte */}
				<div className="flex flex-col gap-1">
					<label className="label-field">{t('payment.cardName')}</label>
					<input
						type="text"
						name="cardName"
						value={form.cardName}
						onChange={handleChange}
						placeholder="Jean Dupont"
						className="input-field"
						required
					/>
				</div>

				{/* Numéro de carte */}
				<div className="flex flex-col gap-1">
					<label className="label-field">{t('payment.cardNumber')}</label>
					<input
						type="text"
						name="cardNumber"
						value={form.cardNumber}
						onChange={handleChange}
						placeholder="1234 5678 9012 3456"
						className="input-field"
						inputMode="numeric"
						required
					/>
				</div>

				{/* Expiration + CVV */}
				<div className="flex gap-3">
					<div className="flex-1 flex flex-col gap-1">
						<label className="label-field">{t('payment.expiry')}</label>
						<input
							type="text"
							name="expiry"
							value={form.expiry}
							onChange={handleChange}
							placeholder="MM/AA"
							className="input-field"
							inputMode="numeric"
							required
						/>
					</div>
					<div className="flex-1 flex flex-col gap-1">
						<label className="label-field">{t('payment.cvv')}</label>
						<input
							type="text"
							name="cvv"
							value={form.cvv}
							onChange={handleChange}
							placeholder="123"
							className="input-field"
							inputMode="numeric"
							required
						/>
					</div>
				</div>

				{/* Bouton payer */}
				<button type="submit" disabled={isProcessing} className="btn-accent">
					{isProcessing ? (
						<span className="flex items-center justify-center gap-2">
							<svg
								className="animate-spin h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
								/>
							</svg>
							{t('payment.processing')}
						</span>
					) : (
						t('payment.cta')
					)}
				</button>
			</form>

			{/* Sécurité */}
			<div className="flex items-center gap-2 justify-center text-xs text-text-muted">
				<ShieldCheck className="h-4 w-4" />
				<span>{t('payment.guarantee')}</span>
			</div>
		</AppLayout>
	);
}
