import { Star, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface XpLevelCardProps {
	level: number;
	experience: number;
	/** XP gagné lors de la dernière séance — si fourni, affiche le gain */
	xpGained?: number;
	className?: string;
}

const K = 0.081649;
const xpThreshold = (lvl: number) => Math.pow((lvl - 1) / K, 2);

export default function XpLevelCard({ level, experience, xpGained, className = '' }: XpLevelCardProps) {
	const { t } = useTranslation();

	const xpStartOfLevel = xpThreshold(level);
	const xpEndOfLevel = xpThreshold(level + 1);
	const xpInLevel = Math.floor(experience - xpStartOfLevel);
	const xpForLevel = Math.floor(xpEndOfLevel - xpStartOfLevel);
	const xpToNext = xpForLevel - xpInLevel;
	const progressPct = Math.min(Math.max((xpInLevel / xpForLevel) * 100, 0), 100);

	return (
		<div className={`card flex items-center gap-4 py-4 ${className}`}>
			{/* Badge niveau */}
			<div className="flex flex-col items-center justify-center h-14 w-14 rounded-2xl bg-primary text-white font-bold text-xl shrink-0 shadow">
				{level}
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-center justify-between mb-1">
					<span className="text-sm font-semibold flex items-center gap-1">
						<Star className="h-4 w-4 text-yellow-500" />
						{t('progression.level.title', { level })}
					</span>
					<span className="text-xs text-text-muted flex items-center gap-1">
						<Zap className="h-3.5 w-3.5 text-primary" />
						{xpInLevel} / {xpForLevel} XP
						{xpGained !== undefined && xpGained > 0 && (
							<span className="ml-1 text-primary font-bold">+{xpGained}</span>
						)}
					</span>
				</div>

				{/* Barre XP */}
				<div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
					<div
						className="h-full rounded-full bg-primary transition-all duration-700"
						style={{ width: `${progressPct}%` }}
					/>
				</div>

				<p className="text-xs text-text-muted mt-1">
					{t('progression.level.nextLevel', { xp: xpToNext })}
				</p>
			</div>
		</div>
	);
}
