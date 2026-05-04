interface ConfirmModalProps {
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: 'danger' | 'primary';
	onConfirm: () => void;
	onCancel: () => void;
}

export default function ConfirmModal({
	message,
	confirmLabel = 'Confirmer',
	cancelLabel = 'Annuler',
	variant = 'danger',
	onConfirm,
	onCancel,
}: ConfirmModalProps) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/40 backdrop-blur-sm"
				onClick={onCancel}
			/>

			{/* Panel */}
			<div className="relative w-full max-w-sm rounded-2xl bg-surface border border-border shadow-xl p-6 space-y-5">
				<p className="text-sm text-text text-center leading-relaxed">{message}</p>

				<div className="flex gap-3">
					<button
						onClick={onCancel}
						className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-text-muted hover:bg-border/30 transition-colors"
					>
						{cancelLabel}
					</button>
					<button
						onClick={onConfirm}
						className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors ${
							variant === 'danger'
								? 'bg-red-500 hover:bg-red-600'
								: 'bg-primary hover:bg-primary/90'
						}`}
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
