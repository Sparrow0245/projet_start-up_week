import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { MessageSquare, CheckCircle, ArrowLeft } from 'lucide-react';
import { fetchContact } from '../../api/contactApi';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

const SUBJECTS_KEYS = [
	'contact.subjects.sport',
	'contact.subjects.bug',
	'contact.subjects.question',
	'contact.subjects.other',
];

export default function Contact() {
	const { t } = useTranslation();
	const user = useSelector((state: RootState) => state.auth);

	const [email, setEmail] = useState(user.userEmail ?? '');
	const [name, setName] = useState(user.userPrenom ?? '');
	const [subject, setSubject] = useState(SUBJECTS_KEYS[0]);
	const [message, setMessage] = useState('');
	const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setStatus('loading');
		try {
			const result = await fetchContact({
				email,
				name,
				subject: t(subject),
				message,
			});
			if (result === 'ok') {
				setStatus('sent');
			} else {
				setStatus('error');
			}
		} catch {
			setStatus('error');
		}
	}

	if (status === 'sent') {
		return (
			<div className="flex min-h-screen items-center justify-center px-4 py-10">
				<div className="w-full max-w-sm space-y-8 text-center">
					<div className="card space-y-6 text-center">
						<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
							<CheckCircle className="h-8 w-8 text-green-500" />
						</div>
						<h1 className="text-xl font-bold text-text">
							{t('contact.sentTitle')}
						</h1>
						<p className="text-sm leading-relaxed text-text-muted">
							{t('contact.sentDescription', { email })}
						</p>
						<p className="text-xs text-text-muted">
							{t('contact.sentHint')}
						</p>
						<Link to={user.isAuthenticated ? '/home' : '/'} className="btn-primary inline-block">
							{t('contact.backHome')}
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center px-4 py-10">
			<div className="w-full max-w-sm space-y-8">
				{/* Header */}
				<div className="flex flex-col items-center gap-4">
					<img
						src="/images/logo.png"
						alt="LevelUP"
						className="h-24 w-24 rounded-xl"
					/>
				</div>

				<form onSubmit={handleSubmit} className="card space-y-4 text-left">
					<div className="text-center">
						<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
							<MessageSquare className="h-6 w-6 text-primary" />
						</div>
						<h1 className="text-xl font-bold text-text">
							{t('contact.title')}
						</h1>
						<p className="mt-2 text-sm text-text-muted">
							{t('contact.description')}
						</p>
					</div>

					{status === 'error' && (
						<p className="text-center text-sm text-red-500">
							{t('contact.error')}
						</p>
					)}

					{/* Email */}
					<div className="flex flex-col gap-1">
						<label className="label-field">{t('contact.email')}</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="email@exemple.com"
							className="input-field"
							required
						/>
					</div>

					{/* Nom */}
					<div className="flex flex-col gap-1">
						<label className="label-field">{t('contact.name')}</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={t('contact.namePlaceholder')}
							className="input-field"
							required
						/>
					</div>

					{/* Sujet */}
					<div className="flex flex-col gap-1">
						<label className="label-field">{t('contact.subject')}</label>
						<select
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							className="input-field"
							required
						>
							{SUBJECTS_KEYS.map((key) => (
								<option key={key} value={key}>
									{t(key)}
								</option>
							))}
						</select>
					</div>

					{/* Message */}
					<div className="flex flex-col gap-1">
						<label className="label-field">{t('contact.message')}</label>
						<textarea
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder={t('contact.messagePlaceholder')}
							className="input-field min-h-[120px] resize-none"
							required
						/>
					</div>

					<button
						type="submit"
						className="btn-primary"
						disabled={status === 'loading' || !email || !name || !message}
					>
						{status === 'loading' ? '...' : t('contact.submit')}
					</button>
				</form>

				<p className="text-center text-sm text-text-muted">
					<Link
						to={user.isAuthenticated ? '/home' : '/'}
						className="inline-flex items-center gap-1 text-primary font-medium"
					>
						<ArrowLeft className="h-4 w-4" />
						{t('contact.back')}
					</Link>
				</p>
			</div>
		</div>
	);
}
