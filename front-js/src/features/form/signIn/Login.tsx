import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router';
import type { AppDispatch, RootState } from '../../../store/store';
import { loginThunk, resetAuth } from '../../../store/auth/authSlice';
import AuthLayout from '../AuthLayout';
import FormField from '../FormField';

function Login() {
	const { t } = useTranslation();
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();

	const { status, error } = useSelector((state: RootState) => state.auth);

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	useEffect(() => {
		if (status === 'success') {
			dispatch(resetAuth());
			navigate('/home');
		}
	}, [status, dispatch, navigate]);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		dispatch(loginThunk({ email, password }));
	}

	return (
		<AuthLayout
			linkText={t('login.noAccount')}
			linkLabel={t('login.signupLink')}
			linkTo="/signup"
		>
			<form onSubmit={handleSubmit} className="card space-y-4 text-left">
				{status === 'error' && error === 'email_not_verified' && (
					<div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
						<p className="font-medium">{t('login.emailNotVerifiedTitle')}</p>
						<p className="mt-1">{t('login.emailNotVerifiedDescription')}</p>
						<Link to="/verify-email" className="mt-2 inline-block font-medium underline hover:text-yellow-900">
							{t('login.emailNotVerifiedLink')}
						</Link>
					</div>
				)}
				{status === 'error' && error !== 'email_not_verified' && (
					<p className="text-red-500 text-sm text-center">{error}</p>
				)}
				<FormField
					label={t('login.email')}
					type="email"
					name="email"
					value={email}
					onChange={e => setEmail(e.target.value)}
					placeholder="email@exemple.com"
				/>
				<FormField
					label={t('login.password')}
					type="password"
					name="password"
					value={password}
					onChange={e => setPassword(e.target.value)}
					placeholder="••••••••"
				/>
				<div className="text-right">
					<Link to="/forgot-password" className="text-xs text-primary hover:underline">
						{t('login.forgotPassword')}
					</Link>
				</div>
				<button type="submit" className="btn-primary" disabled={status === 'loading'}>
					{status === 'loading' ? '...' : t('login.submit')}
				</button>
			</form>
		</AuthLayout>
	);
}

export default Login;
