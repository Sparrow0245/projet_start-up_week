import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
	const { t } = useTranslation();

	const sections = [
		'controller',
		'dataCollected',
		'healthData',
		'legalBasis',
		'purposes',
		'retention',
		'sharing',
		'rights',
		'cookies',
		'security',
		'minors',
		'changes',
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
					{t('privacy.title')}
				</h1>
				<p className="mt-2 text-sm text-text-muted">
					{t('privacy.lastUpdated', { date: t('privacy.updateDate') })}
				</p>

				<hr className="my-8 border-border" />

				{/* Preamble */}
				<p className="text-sm leading-relaxed text-text-muted">
					{t('privacy.preamble')}
				</p>

				{/* RGPD Badge */}
				<div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
					<span className="text-xs font-bold uppercase tracking-wider text-primary">
						RGPD
					</span>
					<span className="text-xs text-text-muted">
						{t('privacy.rgpdBadge')}
					</span>
				</div>

				{/* Sections */}
				{sections.map((key, i) => (
					<section key={key} className="mt-10">
						<h2 className="text-lg font-bold text-text">
							{`${i + 1}. ${t(`privacy.sections.${key}.title`)}`}
						</h2>
						<p className="mt-3 text-sm leading-relaxed text-text-muted whitespace-pre-line">
							{t(`privacy.sections.${key}.content`)}
						</p>
					</section>
				))}

				{/* DPO Contact */}
				<section className="mt-10 rounded-xl border border-primary/20 bg-primary/5 p-6">
					<h2 className="text-lg font-bold text-text">
						{t('privacy.dpo.title')}
					</h2>
					<p className="mt-2 text-sm leading-relaxed text-text-muted whitespace-pre-line">
						{t('privacy.dpo.content')}
					</p>
				</section>

				{/* CNIL */}
				<section className="mt-6 rounded-xl border border-border bg-card p-6">
					<h2 className="text-lg font-bold text-text">
						{t('privacy.cnil.title')}
					</h2>
					<p className="mt-2 text-sm leading-relaxed text-text-muted whitespace-pre-line">
						{t('privacy.cnil.content')}
					</p>
				</section>

				{/* Footer nav */}
				<div className="mt-12 flex flex-wrap gap-4 border-t border-border pt-6 text-xs text-text-muted">
					<Link to="/terms" className="underline hover:text-primary">
						{t('legal.termsLink')}
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
