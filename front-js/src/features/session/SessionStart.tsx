import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Clock, Dumbbell, List } from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import InfoRow from '../../components/InfoRow';
import type { RootState } from '../../store/store';
import type { Exercise, Equipment } from '../../types';

export default function SessionStart() {
	const { t } = useTranslation();
	const { sessionIndex } = useParams<{ sessionIndex: string }>();
	const navigate = useNavigate();

	const program = useSelector((state: RootState) => state.program.current);
	const idx = Number(sessionIndex);
	const session = program?.sessions[idx];

	if (!session) {
		return (
			<AppLayout>
				<div className="flex flex-col items-center justify-center gap-4 py-16">
					<p className="text-text-muted">{t('workout.noSession')}</p>
					<button className="btn-primary" onClick={() => navigate('/programme')}>
						{t('workout.backToProgram')}
					</button>
				</div>
			</AppLayout>
		);
	}

	const totalDuration = session.exercices.reduce((sum: number, ex: Exercise) => sum + ex.dureeMin, 0);

	const equipmentSet = new Map<number, string>();
	session.exercices.forEach((ex: Exercise) =>
		ex.materielNecessaire?.forEach((eq: Equipment) => equipmentSet.set(eq.id, eq.nom)),
	);
	const materials = [...equipmentSet.values()];

	function handleStart() {
		navigate(`/session/${sessionIndex}/workout`);
	}

	const footerContent = (
		<div className="flex justify-center">
			<button onClick={handleStart} className="btn-primary py-4 text-lg w-3/5">
				{t('session.start')}
			</button>
		</div>
	);

	return (
		<AppLayout footer={footerContent} showBack>
			<div className="text-center space-y-2">
				<p className="text-sm tracking-widest uppercase text-text-muted">
					{t('session.title')}
				</p>
				<h1 className="text-xl font-bold">
					{t('program.session')} {session.jourNumero}
				</h1>
			</div>

			<div className="card space-y-3">
				<InfoRow icon={Clock} label={t('session.duration')}>
					{totalDuration} {t('session.minutes')}
				</InfoRow>

				<hr className="border-border" />

				<InfoRow
					icon={Dumbbell}
					iconBg="bg-accent-light/30"
					iconColor="text-accent"
					label={t('session.materials')}
				>
					<div className="flex flex-wrap gap-1.5 mt-1 font-normal">
						{materials.length > 0 ? (
							materials.map(name => (
								<span
									key={name}
									className="rounded-full bg-background px-3 py-0.5 text-sm"
								>
									{name}
								</span>
							))
						) : (
							<span className="text-sm text-text-muted">
								{t('session.noEquipment')}
							</span>
						)}
					</div>
				</InfoRow>

				<hr className="border-border" />

				<InfoRow icon={List} label={t('session.exerciseCount')}>
					{session.exercices.length} {t('program.exercises')}
				</InfoRow>
			</div>

			<div className="space-y-2">
				{session.exercices.map((ex: Exercise, index: number) => (
					<div
						key={ex.id}
						className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-primary-light"
					>
						<span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-text-light text-xs font-bold shrink-0">
							{index + 1}
						</span>
						<div className="flex-1 min-w-0">
							<p className="font-medium">{ex.nom}</p>
							<p className="text-xs text-text-muted">
								{ex.series} {t('program.series')} · {ex.repTemps} · {ex.dureeMin} min
							</p>
						</div>
						<span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-text-muted border border-border">
							{ex.intensite}
						</span>
					</div>
				))}
			</div>
		</AppLayout>
	);
}
