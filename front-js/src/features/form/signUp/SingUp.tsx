import { useEffect, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router';
import type { AppDispatch, RootState } from '../../../store/store';
import { signupThunk, resetAuth } from '../../../store/auth/authSlice';
import AuthLayout from '../AuthLayout';
import FormField from '../FormField';

export default function SingUp() {
	const { t } = useTranslation();
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();

	const { status, error } = useSelector((state: RootState) => state.auth);

	const [formData, setFormData] = useState({
		name: '',
		surname: '',
		email: '',
		password: '',
		isCoach: false,
	});

	const [consent, setConsent] = useState(false);

	useEffect(() => {
		if (status === 'success') {
			dispatch(resetAuth());
			navigate('/verify-email');
		}
	}, [status, dispatch, navigate]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		dispatch(
			signupThunk({
				prenom: formData.name,
				nom: formData.surname,
				email: formData.email,
				password: formData.password,
				isCoach: formData.isCoach,
			})
		);
	};

	return (
		<AuthLayout
			linkText={t('signup.alreadyAccount')}
			linkLabel={t('signup.loginLink')}
			linkTo="/login"
		>
			<form onSubmit={handleSubmit} className="card space-y-4 text-left">
				<h1 className="text-xl font-bold text-center">{t('signup.title')}</h1>
				{status === 'error' && (
					<p className="text-red-500 text-sm text-center">{error}</p>
				)}
				<div className="flex gap-3">
					<div className="flex-1">
						<FormField
							label={t('signup.name')}
							type="text"
							name="name"
							value={formData.name}
							onChange={handleChange}
							placeholder="Jean"
							required
						/>
					</div>
					<div className="flex-1">
						<FormField
							label={t('signup.surname')}
							type="text"
							name="surname"
							value={formData.surname}
							onChange={handleChange}
							placeholder="Dupont"
							required
						/>
					</div>
				</div>
				<FormField
					label={t('signup.email')}
					type="email"
					name="email"
					value={formData.email}
					onChange={handleChange}
					placeholder="email@exemple.com"
					required
				/>
				<FormField
					label={t('signup.password')}
					type="password"
					name="password"
					value={formData.password}
					onChange={handleChange}
					placeholder="••••••••"
					required
				/>
				<label className="flex items-center gap-3 cursor-pointer py-1">
					<input
						type="checkbox"
						checked={formData.isCoach}
						onChange={e => setFormData(prev => ({ ...prev, isCoach: e.target.checked }))}
						className="h-4 w-4 rounded border-border text-primary accent-primary"
					/>
					<span className="text-sm">{t('signup.isCoach')}</span>
				</label>
				<label className="flex items-start gap-3 cursor-pointer">
					<input
						type="checkbox"
						checked={consent}
						onChange={(e) => setConsent(e.target.checked)}
						className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary"
						required
					/>
					<span className="text-xs leading-relaxed text-text-muted">
						<Trans i18nKey="signup.consent">
							J'accepte les <Link to="/terms" className="underline text-primary hover:text-primary/80" target="_blank">conditions d'utilisation</Link> et la <Link to="/privacy" className="underline text-primary hover:text-primary/80" target="_blank">politique de confidentialité</Link>, y compris le traitement de mes données de santé.
						</Trans>
					</span>
				</label>
				<button type="submit" className="btn-primary" disabled={status === 'loading' || !consent}>
					{status === 'loading' ? '...' : t('signup.submit')}
				</button>
			</form>
		</AuthLayout>
	);
}
