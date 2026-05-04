import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
	const { t } = useTranslation();

	const sections = [
		'object',
		'access',
		'account',
		'healthData',
		'usage',
		'ip',
		'liability',
		'termination',
		'modifications',
		'law',
	] as const;

	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-2xl px-6 py-12">
				{/* Back link */}
				<Link
					to="/"
					className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
				>
					<ArrowLeft className="h-4 w-4" />
					{t('legal.back')}
				</Link>

				{/* Header */}
				<h1 className="text-3xl font-extrabold tracking-tight text-text">
					{t('terms.title')}
				</h1>
				<p className="mt-2 text-sm text-text-muted">
					{t('terms.lastUpdated', { date: t('terms.updateDate') })}
				</p>

				<hr className="my-8 border-border" />

				{/* Preamble */}
				<p className="text-sm leading-relaxed text-text-muted">
					{t('terms.preamble')}
				</p>

				{/* Sections */}
				{sections.map((key, i) => (
					<section key={key} className="mt-10">
						<h2 className="text-lg font-bold text-text">
							{`${i + 1}. ${t(`terms.sections.${key}.title`)}`}
						</h2>
						<p className="mt-3 text-sm leading-relaxed text-text-muted whitespace-pre-line">
							{t(`terms.sections.${key}.content`)}
						</p>
					</section>
				))}

				{/* Contact */}
				<section className="mt-10 rounded-xl border border-border bg-card p-6">
					<h2 className="text-lg font-bold text-text">
						{t('terms.contact.title')}
					</h2>
					<p className="mt-2 text-sm leading-relaxed text-text-muted whitespace-pre-line">
						{t('terms.contact.content')}
					</p>
				</section>

				{/* Footer nav */}
				<div className="mt-12 flex flex-wrap gap-4 border-t border-border pt-6 text-xs text-text-muted">
					<Link to="/privacy" className="underline hover:text-primary">
						{t('legal.privacyLink')}
					</Link>
					<Link to="/contact" className="underline hover:text-primary">
						{t('legal.contactLink')}
					</Link>
					<Link to="/" className="underline hover:text-primary">
						{t('legal.homeLink')}
					</Link>
				</div>
			</div>
		</div>
	);
}
