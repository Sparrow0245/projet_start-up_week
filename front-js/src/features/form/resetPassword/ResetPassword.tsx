import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router';
import { Lock, CheckCircle, XCircle } from 'lucide-react';
import { fetchResetPassword } from '../../../api/authApi';
import AuthLayout from '../AuthLayout';
import FormField from '../FormField';

export default function ResetPassword() {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token') || '';

	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [status, setStatus] = useState<
		'idle' | 'loading' | 'success' | 'error' | 'invalid_token' | 'token_expired' | 'token_used' | 'mismatch'
	>('idle');

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		if (password !== confirmPassword) {
			setStatus('mismatch');
			return;
		}

		setStatus('loading');

		try {
			const result = await fetchResetPassword(token, password);

			if (result === 'ok') {
				setStatus('success');
			} else if (result === 'invalid_token') {
				setStatus('invalid_token');
			} else if (result === 'token_expired') {
				setStatus('token_expired');
			} else if (result === 'token_used') {
				setStatus('token_used');
			} else {
				setStatus('error');
			}
		} catch {
			setStatus('error');
		}
	}

	// Pas de token dans l'URL
	if (!token) {
		return (
			<AuthLayout linkText="" linkLabel="" linkTo="/login">
				<div className="card space-y-6 text-center">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
						<XCircle className="h-8 w-8 text-red-500" />
					</div>
					<h1 className="text-xl font-bold text-text">
						{t('resetPassword.invalidTitle')}
					</h1>
					<p className="text-sm text-text-muted">
						{t('resetPassword.invalidDescription')}
					</p>
					<Link to="/forgot-password" className="btn-primary inline-block">
						{t('resetPassword.requestNew')}
					</Link>
				</div>
			</AuthLayout>
		);
	}

	// Succès
	if (status === 'success') {
		return (
			<AuthLayout linkText="" linkLabel="" linkTo="/login">
				<div className="card space-y-6 text-center">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
						<CheckCircle className="h-8 w-8 text-green-500" />
					</div>
					<h1 className="text-xl font-bold text-text">
						{t('resetPassword.successTitle')}
					</h1>
					<p className="text-sm text-text-muted">
						{t('resetPassword.successDescription')}
					</p>
					<Link to="/login" className="btn-primary inline-block">
						{t('resetPassword.goToLogin')}
					</Link>
				</div>
			</AuthLayout>
		);
	}

	// Token invalide / expiré / utilisé
	if (['invalid_token', 'token_expired', 'token_used'].includes(status)) {
		return (
			<AuthLayout linkText="" linkLabel="" linkTo="/login">
				<div className="card space-y-6 text-center">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
						<XCircle className="h-8 w-8 text-red-500" />
					</div>
					<h1 className="text-xl font-bold text-text">
						{t(`resetPassword.${status}Title`)}
					</h1>
					<p className="text-sm text-text-muted">
						{t(`resetPassword.${status}Description`)}
					</p>
					<Link to="/forgot-password" className="btn-primary inline-block">
						{t('resetPassword.requestNew')}
					</Link>
				</div>
			</AuthLayout>
		);
	}

	// Formulaire
	return (
		<AuthLayout linkText="" linkLabel="" linkTo="/login">
			<form onSubmit={handleSubmit} className="card space-y-4 text-left">
				<div className="text-center">
					<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
						<Lock className="h-6 w-6 text-primary" />
					</div>
					<h1 className="text-xl font-bold text-text">
						{t('resetPassword.title')}
					</h1>
					<p className="mt-2 text-sm text-text-muted">
						{t('resetPassword.description')}
					</p>
				</div>

				{status === 'error' && (
					<p className="text-sm text-center text-red-500">
						{t('resetPassword.error')}
					</p>
				)}
				{status === 'mismatch' && (
					<p className="text-sm text-center text-red-500">
						{t('resetPassword.mismatch')}
					</p>
				)}

				<FormField
					label={t('resetPassword.newPassword')}
					type="password"
					name="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="••••••••"
					required
				/>

				<FormField
					label={t('resetPassword.confirmPassword')}
					type="password"
					name="confirmPassword"
					value={confirmPassword}
					onChange={(e) => setConfirmPassword(e.target.value)}
					placeholder="••••••••"
					required
				/>

				<button
					type="submit"
					className="btn-primary"
					disabled={status === 'loading' || !password || !confirmPassword}
				>
					{status === 'loading' ? '...' : t('resetPassword.submit')}
				</button>
			</form>
		</AuthLayout>
	);
}
