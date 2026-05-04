import type { Exercise, Sport } from '../../types';
import ExercisePreview from './ExercicePreview';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X } from 'lucide-react';
import type { RootState } from '../../store/store';
import AppLayout from '../../components/AppLayout';
import { fetchExercises, deleteExercise } from '../../api/exerciseApi';
import { fetchSports } from '../../api/sportApi';

const INTENSITIES = ['FAIBLE', 'MOYENNE', 'ELEVEE'] as const;

function ExerciseLibrary() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const isCoach = useSelector((state: RootState) => state.auth.isCoach);
	const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);
	const coachApproved = useSelector((state: RootState) => state.auth.coachApproved);
	const userId = useSelector((state: RootState) => state.auth.userId);
	const [isLoading, setIsLoading] = useState(true);
	const [fetchError, setFetchError] = useState(false);
	const [exercices, setExercices] = useState<Exercise[]>([]);
	const [sports, setSports] = useState<Sport[]>([]);
	const [search, setSearch] = useState('');
	const [selectedSport, setSelectedSport] = useState<number | null>(null);
	const [selectedIntensity, setSelectedIntensity] = useState<string | null>(
		null
	);
	const [showMyExercises, setShowMyExercises] = useState(false);

	useEffect(() => {
		Promise.all([
			fetchExercises(9999),
			fetchSports(),
		])
			.then(([exerciseData, sportsData]) => {
				setExercices(exerciseData.exercices);
				setSports(sportsData);
			})
			.catch(() => setFetchError(true))
			.finally(() => setIsLoading(false));
	}, []);

	const hasActiveFilters = search.trim() || selectedSport || selectedIntensity || showMyExercises;

	const filtered = useMemo(() => {
		return exercices.filter(ex => {
			if (showMyExercises && ex.createdBy?.id !== userId) return false;
			if (selectedSport && ex.sport?.id !== selectedSport) return false;
			if (selectedIntensity && ex.intensite !== selectedIntensity) return false;
			if (search.trim()) {
				const q = search.toLowerCase();
				const matchesText =
					ex.nom.toLowerCase().includes(q) ||
					ex.descriptionDetaillee?.toLowerCase().includes(q) ||
					ex.objectifs?.some(o => o.nom.toLowerCase().includes(q));
				if (!matchesText) return false;
			}
			return true;
		});
	}, [exercices, search, selectedSport, selectedIntensity, showMyExercises, userId]);

	function clearFilters() {
		setSearch('');
		setSelectedSport(null);
		setSelectedIntensity(null);
		setShowMyExercises(false);
	}

	return (
		<AppLayout>
			<div>
				<p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
					{t('exerciseLibrary.subtitle')}
				</p>
				<h1 className="text-3xl font-bold md:text-4xl">
					{t('exerciseLibrary.title')}
				</h1>
			</div>

			{(isCoach || isAdmin) && (
				<div>
					<button
						onClick={() => navigate('/exercices/new')}
						disabled={isCoach && !coachApproved}
						className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Plus className="h-4 w-4" />
						{t('coach.createExercise')}
					</button>
					{isCoach && !coachApproved && (
						<p className="text-xs text-amber-600 mt-2">{t('coach.pendingApproval')}</p>
					)}
				</div>
			)}

		{fetchError && (
			<p className="text-sm text-red-500 text-center py-2">{t('exerciseLibrary.loadError')}</p>
		)}
		<div className="card space-y-4">
			{/* Barre de recherche */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
					<input
						type="text"
						value={search}
						onChange={e => setSearch(e.target.value)}
						placeholder={t('exerciseLibrary.searchPlaceholder')}
						className="input-field pl-10"
					/>
				</div>

				{/* Filtres */}
				<div className="flex flex-wrap gap-2">
					{/* Filtre sport */}
					<select
						value={selectedSport ?? ''}
						onChange={e =>
							setSelectedSport(e.target.value ? Number(e.target.value) : null)
						}
						className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary-light focus:outline-none focus:border-primary"
					>
						<option value="">{t('exerciseLibrary.allSports')}</option>
						{sports.map(s => (
							<option key={s.id} value={s.id}>
								{s.nom}
							</option>
						))}
					</select>

					{/* Filtre intensité */}
					{INTENSITIES.map(i => (
						<button
							key={i}
							type="button"
							onClick={() =>
								setSelectedIntensity(selectedIntensity === i ? null : i)
							}
							className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
								selectedIntensity === i
									? 'bg-primary text-text-light border-primary'
									: 'bg-surface border-border hover:border-primary-light'
							}`}
						>
							{t(`exerciseLibrary.intensity.${i}`)}
						</button>
					))}

					{/* Filtre mes exos */}
					{isCoach && (
						<button
							type="button"
							onClick={() => setShowMyExercises(!showMyExercises)}
							className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
								showMyExercises
									? 'bg-primary text-text-light border-primary'
									: 'bg-surface border-border hover:border-primary-light'
							}`}
						>
							{t('exerciseLibrary.myExercises')}
						</button>
					)}

					{/* Bouton reset */}
					{hasActiveFilters && (
						<button
							type="button"
							onClick={clearFilters}
							className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
						>
							<X className="h-3 w-3" />
							{t('exerciseLibrary.clearFilters')}
						</button>
					)}
				</div>

				{/* Compteur */}
				<p className="text-sm text-text-muted">
					{filtered.length === 0
						? t('exerciseLibrary.noResults')
						: filtered.length === exercices.length
							? t('exerciseLibrary.total', { count: exercices.length })
							: t('exerciseLibrary.filtered', {
									count: filtered.length,
									total: exercices.length,
								})}
				</p>

				{/* Grille */}
				<div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
					{isLoading ? (
						<p className="col-span-full text-center text-text-muted py-8">
							{t('exerciseLibrary.loading')}
						</p>
					) : (
						filtered.map(exercice => (
							<ExercisePreview
								key={exercice.id}
								exercice={exercice}
								canEdit={isAdmin || (isCoach && exercice.createdBy?.id === userId)}
								canDelete={isAdmin}
								onEdit={() => navigate(`/exercices/${exercice.id}/edit`)}
								onDelete={async () => {
									if (!confirm(t('admin.confirmDeleteExercise'))) return;
									try {
										await deleteExercise(exercice.id, userId!);
										setExercices(prev => prev.filter(e => e.id !== exercice.id));
									} catch {
										// ignore
									}
								}}
							/>
						))
					)}
				</div>
			</div>
		</AppLayout>
	);
}

export default ExerciseLibrary;
