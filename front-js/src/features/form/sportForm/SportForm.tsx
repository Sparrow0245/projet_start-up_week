import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../store/store';
import { completeQuestionnaire } from '../../../store/auth/authSlice';
import { setProgram } from '../../../store/program/programSlice';
import AppLayout from '../../../components/AppLayout';
import { fetchSports, fetchRolesBySport, fetchEquipmentBySport, fetchGoalsBySport } from '../../../api/sportApi';
import { generateProgram } from '../../../api/programApi';
import type {
	Sport,
	Role,
	Equipment as EquipmentType,
	Goal,
} from '../../../types';

const CONSTRAINTS: string[] = ['GENOUX', 'CHEVILLES', 'DOS', 'EPAULES'];
const TOTAL_STEPS = 4;

export default function SportForm() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();
	const userId = useSelector((state: RootState) => state.auth.userId);

	const [step, setStep] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [sports, setSports] = useState<Sport[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [equipment, setEquipment] = useState<EquipmentType[]>([]);
	const [goals, setGoals] = useState<Goal[]>([]);

	const [selectedSport, setSelectedSport] = useState<number | null>(null);
	const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
	const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
	const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
	const [selectedEquipment, setSelectedEquipment] = useState<number[]>([]);
	const [selectedGoals, setSelectedGoals] = useState<number[]>([]);
	const [durationWeeks, setDurationWeeks] = useState(8);

	useEffect(() => {
		fetchSports()
			.then(setSports)
			.catch(() => setError(t('questionnaire.loadError')));
	}, []);

	useEffect(() => {
		if (!selectedSport) return;
		Promise.all([
			fetchRolesBySport(selectedSport),
			fetchEquipmentBySport(selectedSport),
			fetchGoalsBySport(selectedSport),
		]).then(([r, e, g]) => {
			setRoles(r);
			setEquipment(e);
			setGoals(g);
			setSelectedRoles([]);
			setSelectedEquipment([]);
			setSelectedGoals([]);
		}).catch(() => setError(t('questionnaire.loadError')));
	}, [selectedSport]);

	function toggleItem<T>(
		item: T,
		setter: React.Dispatch<React.SetStateAction<T[]>>
	) {
		setter(prev =>
			prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
		);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (step < TOTAL_STEPS - 1) {
			setStep(s => s + 1);
			return;
		}

		setIsSubmitting(true);
		setError(null);

		generateProgram({
			sportId: selectedSport!,
			roleIds: selectedRoles,
			equipmentIds: selectedEquipment,
			constraints:
				selectedConstraints.length > 0 ? selectedConstraints : ['AUCUNE'],
			goalIds: selectedGoals,
			sessionsPerWeek,
			durationWeeks,
			userId,
		})
			.then(program => {
				dispatch(setProgram(program));
				dispatch(completeQuestionnaire());
				navigate('/programme');
			})
			.catch(() => setError(t('questionnaire.error')))
			.finally(() => setIsSubmitting(false));
	}

	const stepTitles = [
		t('questionnaire.step.sport'),
		t('questionnaire.step.constraints'),
		t('questionnaire.step.equipment'),
		t('questionnaire.step.goals'),
	];

	const chipClass = (active: boolean) =>
		`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
			active
				? 'bg-primary text-text-light border-primary'
				: 'bg-surface text-text border-border hover:border-primary'
		}`;

	return (
		<AppLayout>
			<div className="w-full max-w-lg mx-auto space-y-6">
				{/* Progress bar */}
				<div className="space-y-1">
					<div className="flex justify-between text-sm text-text-muted">
						<span>{stepTitles[step]}</span>
						<span>
							{step + 1} / {TOTAL_STEPS}
						</span>
					</div>
					<div className="h-2 w-full rounded-full bg-border overflow-hidden">
						<div
							className="h-full rounded-full bg-primary transition-all duration-300"
							style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
						/>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="card space-y-5">
					<h2 className="text-xl font-bold text-center">{stepTitles[step]}</h2>

					{/* Step 1: Sport, Rôle, Séances */}
					{step === 0 && (
						<>
							<div className="flex flex-col gap-1">
								<label className="label-field">
									{t('questionnaire.general.mainSport')}
								</label>
								<select
									value={selectedSport ?? ''}
									onChange={e => setSelectedSport(Number(e.target.value))}
									className="select-field"
									required
								>
									<option value="" disabled>
										{t('questionnaire.placeholder')}
									</option>
									{sports.map(s => (
										<option key={s.id} value={s.id}>
											{s.nom}
										</option>
									))}
								</select>
							</div>

							{selectedSport && roles.length > 0 && (
								<div className="flex flex-col gap-1">
									<label className="label-field">
										{t('questionnaire.general.position')}
									</label>
									<div className="flex flex-wrap gap-2">
										{roles.map(r => (
											<button
												key={r.id}
												type="button"
												onClick={() => toggleItem(r.id, setSelectedRoles)}
												className={chipClass(selectedRoles.includes(r.id))}
											>
												{r.nom}
											</button>
										))}
									</div>
								</div>
							)}

							<div className="flex flex-col gap-1">
								<label className="label-field">
									{t('questionnaire.general.sessions')}
								</label>
								<select
									value={sessionsPerWeek}
									onChange={e => setSessionsPerWeek(Number(e.target.value))}
									className="select-field"
								>
									{[1, 2, 3, 4, 5].map(n => (
										<option key={n} value={n}>
											{n}{' '}
											{n === 1
												? t('questionnaire.sessionLabel')
												: t('questionnaire.sessionsLabel')}
										</option>
									))}
								</select>
							</div>

							<div className="flex flex-col gap-1">
								<label className="label-field">
									{t('questionnaire.general.duration')}
								</label>
								<div className="flex flex-wrap gap-2">
									{[
										{ weeks: 8, label: t('questionnaire.duration.short') },
										{ weeks: 24, label: t('questionnaire.duration.medium') },
										{ weeks: 48, label: t('questionnaire.duration.long') },
									].map(opt => (
										<button
											key={opt.weeks}
											type="button"
											onClick={() => setDurationWeeks(opt.weeks)}
											className={chipClass(durationWeeks === opt.weeks)}
										>
											{opt.label}
										</button>
									))}
								</div>
							</div>
						</>
					)}

					{/* Step 2: Contraintes / Blessures */}
					{step === 1 && (
						<div className="space-y-3">
							<p className="text-sm text-text-muted">
								{t('questionnaire.constraints.description')}
							</p>
							<div className="flex flex-wrap gap-2">
								{CONSTRAINTS.map(c => (
									<button
										key={c}
										type="button"
										onClick={() => toggleItem(c, setSelectedConstraints)}
										className={chipClass(selectedConstraints.includes(c))}
									>
										{t(`questionnaire.constraint.${c}`)}
									</button>
								))}
							</div>
						</div>
					)}

					{/* Step 3: Matériel */}
					{step === 2 && (
						<div className="flex flex-wrap gap-2">
							{equipment.map(eq => (
								<button
									key={eq.id}
									type="button"
									onClick={() => toggleItem(eq.id, setSelectedEquipment)}
									className={chipClass(selectedEquipment.includes(eq.id))}
								>
									{eq.nom}
								</button>
							))}
						</div>
					)}

					{/* Step 4: Objectifs */}
					{step === 3 && (
						<div className="flex flex-wrap gap-2">
							{goals.map(g => (
								<button
									key={g.id}
									type="button"
									onClick={() => toggleItem(g.id, setSelectedGoals)}
									className={chipClass(selectedGoals.includes(g.id))}
								>
									{g.nom}
								</button>
							))}
						</div>
					)}

					{error && <p className="text-sm text-red-500 text-center">{error}</p>}

					<div className="flex gap-3 pt-2">
						{step > 0 && (
							<button
								type="button"
								onClick={() => setStep(s => s - 1)}
								className="btn-outline"
								disabled={isSubmitting}
							>
								{t('questionnaire.back')}
							</button>
						)}
						<button
							type="submit"
							className="btn-primary"
							disabled={isSubmitting}
						>
							{isSubmitting
								? t('questionnaire.loading')
								: step === TOTAL_STEPS - 1
									? t('questionnaire.submit')
									: t('questionnaire.next')}
						</button>
					</div>
				</form>
			</div>
		</AppLayout>
	);
}
