import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import type { Exercise } from '../../types';

interface Props {
	exercice: Exercise;
	canEdit?: boolean;
	canDelete?: boolean;
	onEdit?: () => void;
	onDelete?: () => void;
}

export default function ExercicePreview({ exercice, canEdit, canDelete, onEdit, onDelete }: Props) {
	const { t } = useTranslation();

	return (
		<article className="card flex flex-col gap-4">
			<div className="flex items-start justify-between gap-3">
				<div style={{ maxWidth: '60%' }}>
					<p className="text-sm text-[var(--color-text-muted)]">
						{exercice.objectifs?.map(o => o.nom).join(', ')}
					</p>
					<h2 className="text-lg font-semibold">{exercice.nom}</h2>
					<p className="text-sm text-[var(--color-text-muted)]">
						{exercice.typesDeJoueur?.map(r => r.nom).join(', ')}
					</p>
				</div>
				<div className="text-right">
					<span className="rounded-full bg-[var(--color-background)] px-3 py-1 text-xs font-medium">
						{exercice.intensite}
					</span>
					<p className="text-sm text-[var(--color-text-muted)]">
						{exercice.dureeMin} minutes
					</p>
					<p className="text-sm text-[var(--color-text-muted)]">
						{exercice.xpGagnee} XP
					</p>
				</div>
			</div>

			<p className="text-sm text-[var(--color-text-muted)]">
				{exercice.descriptionDetaillee}
			</p>

			<div className="flex flex-wrap gap-2">
				<span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs">
					{exercice.sport.nom}
				</span>
				{exercice.materielNecessaire?.map(eq => (
					<span
						key={eq.id}
						className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs"
					>
						{eq.nom}
					</span>
				))}
			</div>

			{exercice.createdBy && (
				<p className="text-xs text-text-muted">
					{t('coach.createdBy', { name: `${exercice.createdBy.prenom} ${exercice.createdBy.nom}` })}
				</p>
			)}

			{canEdit && onEdit && (
				<button
					type="button"
					onClick={onEdit}
					className="btn-outline mt-auto flex items-center justify-center gap-2"
				>
					<Pencil className="h-4 w-4" />
					{t('coach.editExercise')}
				</button>
			)}

			{canDelete && onDelete && (
				<button
					type="button"
					onClick={onDelete}
					className="flex items-center justify-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
				>
					<Trash2 className="h-4 w-4" />
					{t('admin.deleteExercise')}
				</button>
			)}
		</article>
	);
}
