import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router';
import { Mail, CheckCircle, XCircle, Clock } from 'lucide-react';
import { fetchVerifyEmail } from '../../../api/authApi';
import AuthLayout from '../AuthLayout';

export default function VerifyEmail() {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token') || '';

	const [status, setStatus] = useState<
		'pending' | 'loading' | 'ok' | 'invalid_token' | 'token_expired' | 'token_used' | 'error'
	>('pending');

	useEffect(() => {
		if (!token) return;

		setStatus('loading');

		fetchVerifyEmail(token)
			.then(result => {
				if (result === 'ok') {
					setStatus('ok');
				} else if (result === 'invalid_token') {
					setStatus('invalid_token');
				} else if (result === 'token_expired') {
					setStatus('token_expired');
				} else if (result === 'token_used') {
					setStatus('token_used');
				} else {
					setStatus('error');
				}
			})
			.catch(() => setStatus('error'));
	}, [token]);

	// Pas de token dans l'URL → page "Check your inbox"
	if (!token) {
		return (
			<AuthLayout linkText="" linkLabel="" linkTo="/login">
				<div className="card space-y-6 text-center">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
						<Mail className="h-8 w-8 text-blue-500" />
					</div>
					<h1 className="text-xl font-bold text-text">
						{t('verifyEmail.pendingTitle')}
					</h1>
					<p className="text-sm leading-relaxed text-text-muted">
						{t('verifyEmail.pendingDescription')}
					</p>
					<p className="text-xs text-text-muted">
						{t('verifyEmail.pendingHint')}
					</p>
					<Link to="/login" className="btn-primary inline-block">
						{t('verifyEmail.backToLogin')}
					</Link>
				</div>
			</AuthLayout>
		);
	}

	if (status === 'loading') {
		return (
			<AuthLayout linkText="" linkLabel="" linkTo="/login">
				<div className="card space-y-6 text-center">
					<p className="text-sm text-text-muted">{t('verifyEmail.verifying')}</p>
				</div>
			</AuthLayout>
		);
	}

	if (status === 'ok') {
		return (
			<AuthLayout linkText="" linkLabel="" linkTo="/login">
				<div className="card space-y-6 text-center">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
						<CheckCircle className="h-8 w-8 text-green-500" />
					</div>
					<h1 className="text-xl font-bold text-text">
						{t('verifyEmail.successTitle')}
					</h1>
					<p className="text-sm leading-relaxed text-text-muted">
						{t('verifyEmail.successDescription')}
					</p>
					<Link to="/login" className="btn-primary inline-block">
						{t('verifyEmail.goToLogin')}
					</Link>
				</div>
			</AuthLayout>
		);
	}

	if (status === 'token_expired') {
		return (
			<AuthLayout linkText="" linkLabel="" linkTo="/login">
				<div className="card space-y-6 text-center">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
						<Clock className="h-8 w-8 text-orange-500" />
					</div>
					<h1 className="text-xl font-bold text-text">
						{t('verifyEmail.expiredTitle')}
					</h1>
					<p className="text-sm leading-relaxed text-text-muted">
						{t('verifyEmail.expiredDescription')}
					</p>
					<Link to="/signup" className="btn-primary inline-block">
						{t('verifyEmail.requestNew')}
					</Link>
				</div>
			</AuthLayout>
		);
	}

	if (status === 'token_used') {
		return (
			<AuthLayout linkText="" linkLabel="" linkTo="/login">
				<div className="card space-y-6 text-center">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
						<CheckCircle className="h-8 w-8 text-green-500" />
					</div>
					<h1 className="text-xl font-bold text-text">
						{t('verifyEmail.alreadyVerifiedTitle')}
					</h1>
					<p className="text-sm leading-relaxed text-text-muted">
						{t('verifyEmail.alreadyVerifiedDescription')}
					</p>
					<Link to="/login" className="btn-primary inline-block">
						{t('verifyEmail.goToLogin')}
					</Link>
				</div>
			</AuthLayout>
		);
	}

	// invalid_token ou error
	return (
		<AuthLayout linkText="" linkLabel="" linkTo="/login">
			<div className="card space-y-6 text-center">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
					<XCircle className="h-8 w-8 text-red-500" />
				</div>
				<h1 className="text-xl font-bold text-text">
					{t('verifyEmail.invalidTitle')}
				</h1>
				<p className="text-sm leading-relaxed text-text-muted">
					{t('verifyEmail.invalidDescription')}
				</p>
				<Link to="/signup" className="btn-primary inline-block">
					{t('verifyEmail.requestNew')}
				</Link>
			</div>
		</AuthLayout>
	);
}
