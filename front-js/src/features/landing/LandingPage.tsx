import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import {
	Brain,
	Target,
	TrendingUp,
	Shield,
	Mic,
	Trophy,
	ChevronRight,
	Sparkles,
} from 'lucide-react';

export default function LandingPage() {
	const { t } = useTranslation();

	const features = [
		{ icon: Brain, key: 'ai' },
		{ icon: Target, key: 'personalized' },
		{ icon: TrendingUp, key: 'progress' },
		{ icon: Mic, key: 'voice' },
		{ icon: Shield, key: 'safe' },
		{ icon: Trophy, key: 'compete' },
	];

	return (
		<div className="min-h-screen bg-background font-sans">
			{/* ─── Hero ─── */}
			<section className="relative flex flex-col items-center px-6 pt-16 pb-20 text-center overflow-hidden">
				{/* Subtle gradient orb */}
				<div className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

				<img
					src="/images/logo.png"
					alt="Level Up"
					className="relative z-10 w-28 rounded-2xl shadow-lg animate-[splash-fade-scale_0.8s_ease-out_both]"
				/>

				<h1 className="relative z-10 mt-8 text-4xl font-extrabold leading-tight tracking-tight text-text">
					{t('landing.hero.title1')}
					<span className="block text-primary">{t('landing.hero.title2')}</span>
				</h1>

				<p className="relative z-10 mt-4 max-w-xs text-base leading-relaxed text-text-muted animate-[splash-fade-up_0.6s_ease-out_0.3s_both]">
					{t('landing.hero.subtitle')}
				</p>

				<div className="relative z-10 mt-8 flex w-full max-w-xs flex-col gap-3">
					<Link to="/signup" className="btn-primary">
						{t('landing.hero.cta')}
						<ChevronRight className="ml-1 h-4 w-4" />
					</Link>
					<Link to="/login" className="btn-outline">
						{t('landing.hero.login')}
					</Link>
				</div>
			</section>

			{/* ─── Social proof ─── */}
			<section className="px-6 pb-12">
				<div className="card mx-auto flex max-w-sm items-center justify-around py-4">
					<div className="text-center">
						<p className="text-2xl font-bold text-primary">IA</p>
						<p className="mt-0.5 text-[11px] text-text-muted">{t('landing.proof.ai')}</p>
					</div>
					<div className="h-8 w-px bg-border" />
					<div className="text-center">
						<p className="text-2xl font-bold text-accent">100%</p>
						<p className="mt-0.5 text-[11px] text-text-muted">{t('landing.proof.personalized')}</p>
					</div>
					<div className="h-8 w-px bg-border" />
					<div className="text-center">
						<p className="text-2xl font-bold text-primary">24/7</p>
						<p className="mt-0.5 text-[11px] text-text-muted">{t('landing.proof.available')}</p>
					</div>
				</div>
			</section>

			{/* ─── Features ─── */}
			<section className="px-6 pb-16">
				<h2 className="text-center text-sm font-semibold uppercase tracking-widest text-primary">
					{t('landing.features.label')}
				</h2>
				<p className="mt-2 text-center text-2xl font-bold text-text">
					{t('landing.features.title')}
				</p>

				<div className="mx-auto mt-8 grid max-w-sm grid-cols-1 gap-4">
					{features.map(({ icon: Icon, key }) => (
						<div
							key={key}
							className="card flex items-start gap-4 transition-shadow hover:shadow-md"
						>
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
								<Icon className="h-5 w-5 text-primary" />
							</div>
							<div>
								<p className="text-sm font-semibold text-text">
									{t(`landing.features.${key}.title`)}
								</p>
								<p className="mt-0.5 text-xs leading-relaxed text-text-muted">
									{t(`landing.features.${key}.desc`)}
								</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* ─── How it works ─── */}
			<section className="bg-surface px-6 py-16">
				<h2 className="text-center text-sm font-semibold uppercase tracking-widest text-accent">
					{t('landing.steps.label')}
				</h2>
				<p className="mt-2 text-center text-2xl font-bold text-text">
					{t('landing.steps.title')}
				</p>

				<div className="mx-auto mt-10 flex max-w-xs flex-col gap-8">
					{[1, 2, 3, 4].map(step => (
						<div key={step} className="flex gap-4">
							<div className="flex flex-col items-center">
								<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
									{step}
								</div>
								{step < 4 && <div className="mt-1 h-full w-px bg-border" />}
							</div>
							<div className="pb-2">
								<p className="text-sm font-semibold text-text">
									{t(`landing.steps.s${step}.title`)}
								</p>
								<p className="mt-1 text-xs leading-relaxed text-text-muted">
									{t(`landing.steps.s${step}.desc`)}
								</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* ─── CTA final ─── */}
			<section className="relative px-6 py-20 text-center overflow-hidden">
				<div className="pointer-events-none absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />

				<Sparkles className="mx-auto h-8 w-8 text-accent" />
				<h2 className="relative z-10 mt-4 text-2xl font-bold text-text">
					{t('landing.cta.title')}
				</h2>
				<p className="relative z-10 mx-auto mt-3 max-w-xs text-sm leading-relaxed text-text-muted">
					{t('landing.cta.subtitle')}
				</p>

				<div className="relative z-10 mx-auto mt-8 flex max-w-xs flex-col gap-3">
					<Link to="/signup" className="btn-accent">
						{t('landing.cta.button')}
						<ChevronRight className="ml-1 h-4 w-4" />
					</Link>
				</div>
			</section>

			{/* ─── Footer ─── */}
			<footer className="border-t border-border px-6 py-8 text-center">
				<div className="mx-auto mb-4 flex flex-wrap justify-center gap-4 text-xs">
				<Link to="/terms" className="text-text-muted underline transition-colors hover:text-primary">
					{t('legal.termsLink')}
				</Link>
				<Link to="/privacy" className="text-text-muted underline transition-colors hover:text-primary">
					{t('legal.privacyLink')}
				</Link>
				<Link to="/contact" className="text-text-muted underline transition-colors hover:text-primary">
					{t('legal.contactLink')}
				</Link>
				</div>
				<p className="text-xs text-text-muted">
					© {new Date().getFullYear()} Level Up — {t('landing.footer.rights')}
				</p>
			</footer>
		</div>
	);
}
