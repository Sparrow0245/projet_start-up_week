import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import type { RootState } from '../../store/store';
import type { Sport, Role, Equipment, Goal } from '../../types';
import AppLayout from '../../components/AppLayout';
import { fetchSports, fetchRolesBySport, fetchEquipmentBySport, fetchGoalsBySport } from '../../api/sportApi';
import { createExercise, updateExercise, fetchExerciseDetail } from '../../api/exerciseApi';

const INTENSITIES = ['FAIBLE', 'MOYENNE', 'ELEVEE'] as const;
const CONSTRAINTS = ['GENOUX', 'CHEVILLES', 'DOS', 'EPAULES'] as const;

export default function ExerciseForm() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { exerciseId } = useParams<{ exerciseId: string }>();
	const isEdit = Boolean(exerciseId);

	const userId = useSelector((state: RootState) => state.auth.userId);

	const [sports, setSports] = useState<Sport[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [equipment, setEquipment] = useState<Equipment[]>([]);
	const [goals, setGoals] = useState<Goal[]>([]);

	const [nom, setNom] = useState('');
	const [description, setDescription] = useState('');
	const [dureeMin, setDureeMin] = useState(5);
	const [series, setSeries] = useState(3);
	const [repTemps, setRepTemps] = useState('');
	const [sportId, setSportId] = useState<number | null>(null);
	const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
	const [selectedEquipment, setSelectedEquipment] = useState<number[]>([]);
	const [selectedGoals, setSelectedGoals] = useState<number[]>([]);
	const [intensite, setIntensite] = useState<string>('MOYENNE');
	const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);

	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');
	const [loadError, setLoadError] = useState('');

	const imgInputRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		fetchSports()
			.then(setSports)
			.catch(() => setLoadError(t('coach.exerciseForm.loadError')));
	}, []);

	useEffect(() => {
		if (!sportId) return;
		Promise.all([
			fetchRolesBySport(sportId),
			fetchEquipmentBySport(sportId),
			fetchGoalsBySport(sportId),
		])
			.then(([r, e, g]: [Role[], Equipment[], Goal[]]) => {
				setRoles(r);
				setEquipment(e);
				setGoals(g);
			})
			.catch(() => setLoadError(t('coach.exerciseForm.loadError')));
	}, [sportId]);

	useEffect(() => {
		if (!exerciseId) return;
		fetchExerciseDetail(Number(exerciseId))
			.then(ex => {
				setNom(ex.nom);
				setDescription(ex.descriptionDetaillee || '');
				setDureeMin(ex.dureeMin);
				setSeries(ex.series);
				setRepTemps(ex.repTemps || '');
				setSportId(ex.sport?.id || null);
				setSelectedRoles(ex.typesDeJoueur?.map((r: Role) => r.id) || []);
				setSelectedEquipment(
					ex.materielNecessaire?.map((e: Equipment) => e.id) || []
				);
				setSelectedGoals(ex.objectifs?.map((g: Goal) => g.id) || []);
				setIntensite(ex.intensite || 'MOYENNE');
				setSelectedConstraints(ex.contraintesPhysiques || []);
			})
			.catch(() => setLoadError(t('coach.exerciseForm.loadError')));
	}, [exerciseId]);

	function toggleList(
		id: number,
		setter: React.Dispatch<React.SetStateAction<number[]>>
	) {
		setter(prev =>
			prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
		);
	}

	function toggleConstraint(c: string) {
		setSelectedConstraints(prev =>
			prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
		);
	}

	async function getBase64(file: File) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result);
			reader.onerror = error => reject(error);
		});
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!sportId || !nom.trim()) return;
		setSubmitting(true);
		setError('');

		let base64Image: string | null = null;
		const files = imgInputRef.current?.files;

		if (files && files.length > 0) {
			const file = files[0];
			base64Image = (await getBase64(file)) as string;
		}

		try {
			const body = {
				coachId: userId,
				nom,
				descriptionDetaillee: description,
				dureeMin,
				series,
				repTemps,
				sportId,
				roleIds: selectedRoles,
				equipmentIds: selectedEquipment,
				goalIds: selectedGoals,
				intensite,
				constraints: selectedConstraints,
				img: base64Image,
			};
			if (isEdit && exerciseId) {
				await updateExercise(Number(exerciseId), body);
			} else {
				await createExercise(body);
			}
			navigate('/exercices');
		} catch {
			setError(t('coach.exerciseForm.error'));
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<AppLayout>
			<div>
				<button
					onClick={() => navigate('/exercices')}
					className="flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors mb-3"
				>
					<ChevronLeft className="h-4 w-4" />
					{t('coach.exerciseForm.back')}
				</button>
				<h1 className="text-2xl font-bold">
					{isEdit
						? t('coach.exerciseForm.titleEdit')
						: t('coach.exerciseForm.titleCreate')}
				</h1>
			</div>

			{!isEdit && (
				<div className="card border border-amber-300 bg-amber-50/30 flex items-start gap-3">
					<AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
					<p className="text-sm text-amber-800">
						{t('coach.exerciseForm.warning')}
					</p>
				</div>
			)}

			<form onSubmit={handleSubmit} className="card space-y-5">
				{loadError && <p className="text-amber-600 text-sm">{loadError}</p>}
				{error && <p className="text-red-500 text-sm">{error}</p>}

				{/* Sport */}
				<div>
					<label className="block text-sm font-medium mb-1">
						{t('coach.exerciseForm.sport')}
					</label>
					<select
						value={sportId ?? ''}
						onChange={e => {
							setSportId(Number(e.target.value));
							setSelectedRoles([]);
							setSelectedEquipment([]);
							setSelectedGoals([]);
						}}
						className="input-field"
						required
					>
						<option value="">{t('questionnaire.placeholder')}</option>
						{sports.map(s => (
							<option key={s.id} value={s.id}>
								{s.nom}
							</option>
						))}
					</select>
				</div>

				{/* Nom */}
				<div>
					<label className="block text-sm font-medium mb-1">
						{t('coach.exerciseForm.name')}
					</label>
					<input
						type="text"
						value={nom}
						onChange={e => setNom(e.target.value)}
						className="input-field"
						required
					/>
				</div>

				{/* Description */}
				<div>
					<label className="block text-sm font-medium mb-1">
						{t('coach.exerciseForm.description')}
					</label>
					<textarea
						value={description}
						onChange={e => setDescription(e.target.value)}
						className="input-field min-h-[100px]"
					/>
				</div>

				{/* Durée, séries, reps */}
				<div className="grid grid-cols-3 gap-3">
					<div>
						<label className="block text-sm font-medium mb-1">
							{t('coach.exerciseForm.duration')}
						</label>
						<input
							type="number"
							value={dureeMin || ''}
							onChange={e =>
								setDureeMin(
									e.target.value === '' ? 0 : parseInt(e.target.value, 10)
								)
							}
							onFocus={e => e.target.select()}
							className="input-field"
							min={1}
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">
							{t('coach.exerciseForm.series')}
						</label>
						<input
							type="number"
							value={series || ''}
							onChange={e =>
								setSeries(
									e.target.value === '' ? 0 : parseInt(e.target.value, 10)
								)
							}
							onFocus={e => e.target.select()}
							className="input-field"
							min={1}
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">
							{t('coach.exerciseForm.reps')}
						</label>
						<input
							type="text"
							value={repTemps}
							onChange={e => setRepTemps(e.target.value)}
							className="input-field"
							placeholder="10 reps"
							required
						/>
					</div>
				</div>

				{/* Intensité */}
				<div>
					<label className="block text-sm font-medium mb-1">
						{t('coach.exerciseForm.intensity')}
					</label>
					<div className="flex gap-2">
						{INTENSITIES.map(i => (
							<button
								key={i}
								type="button"
								onClick={() => setIntensite(i)}
								className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border transition-colors ${intensite === i ? 'bg-primary text-text-light border-primary' : 'bg-surface border-border hover:border-primary-light'}`}
							>
								{t(`coach.exerciseForm.intensityLevel.${i}`)}
							</button>
						))}
					</div>
				</div>

				{/* Rôles */}
				{sportId && roles.length > 0 && (
					<div>
						<label className="block text-sm font-medium mb-1">
							{t('coach.exerciseForm.roles')}
						</label>
						<div className="flex flex-wrap gap-2">
							{roles.map(r => (
								<button
									key={r.id}
									type="button"
									onClick={() => toggleList(r.id, setSelectedRoles)}
									className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${selectedRoles.includes(r.id) ? 'bg-accent text-text-light border-accent' : 'bg-surface border-border hover:border-accent-light'}`}
								>
									{r.nom}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Équipement */}
				{sportId && equipment.length > 0 && (
					<div>
						<label className="block text-sm font-medium mb-1">
							{t('coach.exerciseForm.equipment')}
						</label>
						<div className="flex flex-wrap gap-2">
							{equipment.map(eq => (
								<button
									key={eq.id}
									type="button"
									onClick={() => toggleList(eq.id, setSelectedEquipment)}
									className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${selectedEquipment.includes(eq.id) ? 'bg-accent text-text-light border-accent' : 'bg-surface border-border hover:border-accent-light'}`}
								>
									{eq.nom}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Objectifs */}
				{sportId && goals.length > 0 && (
					<div>
						<label className="block text-sm font-medium mb-1">
							{t('coach.exerciseForm.goals')}
						</label>
						<div className="flex flex-wrap gap-2">
							{goals.map(g => (
								<button
									key={g.id}
									type="button"
									onClick={() => toggleList(g.id, setSelectedGoals)}
									className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${selectedGoals.includes(g.id) ? 'bg-accent text-text-light border-accent' : 'bg-surface border-border hover:border-accent-light'}`}
								>
									{g.nom}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Contraintes */}
				<div>
					<label className="block text-sm font-medium mb-1">
						{t('coach.exerciseForm.constraints')}
					</label>
					<div className="flex flex-wrap gap-2">
						{CONSTRAINTS.map(c => (
							<button
								key={c}
								type="button"
								onClick={() => toggleConstraint(c)}
								className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${selectedConstraints.includes(c) ? 'bg-red-500 text-white border-red-500' : 'bg-surface border-border hover:border-red-300'}`}
							>
								{t(`questionnaire.constraint.${c}`)}
							</button>
						))}
					</div>
				</div>

				{/* Image */}
				<div>
					<label className="block text-sm font-medium mb-1">
						{t('coach.exerciseForm.image')}
					</label>
					<div className="flex flex-wrap gap-2">
						<input type="file" id="img" name="img" ref={imgInputRef} />
					</div>
				</div>

				<button
					type="submit"
					className="btn-primary w-full"
					disabled={submitting}
				>
					{submitting
						? '...'
						: isEdit
							? t('coach.exerciseForm.submitEdit')
							: t('coach.exerciseForm.submitCreate')}
				</button>
			</form>
		</AppLayout>
	);
}
