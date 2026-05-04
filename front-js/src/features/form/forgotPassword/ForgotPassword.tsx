import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { fetchForgotPassword } from '../../../api/authApi';
import AuthLayout from '../AuthLayout';
import FormField from '../FormField';

export default function ForgotPassword() {
	const { t } = useTranslation();

	const [email, setEmail] = useState('');
	const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'not_found' | 'email_error'>(
		'idle',
	);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setStatus('loading');

		try {
			const result = await fetchForgotPassword(email);
			if (result === 'not_found') {
				setStatus('not_found');
			} else if (result === 'email_error') {
				setStatus('email_error');
			} else {
				setStatus('sent');
			}
		} catch {
			setStatus('email_error');
		}
	}

	if (status === 'sent') {
		return (
			<AuthLayout linkText="" linkLabel="" linkTo="/login">
				<div className="card space-y-6 text-center">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
						<CheckCircle className="h-8 w-8 text-green-500" />
					</div>
					<h1 className="text-xl font-bold text-text">
						{t('forgotPassword.sentTitle')}
					</h1>
					<p className="text-sm leading-relaxed text-text-muted">
						{t('forgotPassword.sentDescription', { email })}
					</p>
					<p className="text-xs text-text-muted">
						{t('forgotPassword.sentHint')}
					</p>
					<Link to="/login" className="btn-primary inline-block">
						{t('forgotPassword.backToLogin')}
					</Link>
				</div>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout
			linkText={t('forgotPassword.noAccount')}
			linkLabel={t('forgotPassword.signUpLink')}
			linkTo="/signup"
		>
			<form onSubmit={handleSubmit} className="card space-y-4 text-left">
				<div className="text-center">
					<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
						<Mail className="h-6 w-6 text-primary" />
					</div>
					<h1 className="text-xl font-bold text-text">
						{t('forgotPassword.title')}
					</h1>
					<p className="mt-2 text-sm text-text-muted">
						{t('forgotPassword.description')}
					</p>
				</div>

			{status === 'not_found' && (
				<p className="text-sm text-center text-red-500">
					{t('forgotPassword.notFound')}
				</p>
			)}
			{status === 'email_error' && (
				<p className="text-sm text-center text-red-500">
					{t('forgotPassword.emailError')}
				</p>
			)}				<FormField
					label={t('forgotPassword.email')}
					type="email"
					name="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="email@exemple.com"
					required
				/>

				<button
					type="submit"
					className="btn-primary"
					disabled={status === 'loading' || !email}
				>
					{status === 'loading'
						? '...'
						: t('forgotPassword.submit')}
				</button>
			</form>

			<Link
				to="/login"
				className="mt-4 inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				{t('forgotPassword.backToLogin')}
			</Link>
		</AuthLayout>
	);
}
