import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Home } from 'lucide-react';

function NotFound() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
			<p className="text-8xl font-bold text-primary">404</p>
			<h1 className="mt-4 text-2xl font-semibold text-text">
				{t('notFound.title')}
			</h1>
			<p className="mt-2 max-w-md text-text-muted">
				{t('notFound.description')}
			</p>
			<button
				onClick={() => navigate('/')}
				className="mt-8 flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
			>
				<Home className="h-4 w-4" />
				{t('notFound.cta')}
			</button>
		</div>
	);
}

export default NotFound;
