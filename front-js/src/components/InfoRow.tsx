import type { LucideIcon } from 'lucide-react';

interface InfoRowProps {
	icon: LucideIcon;
	iconBg?: string;
	iconColor?: string;
	label: string;
	children: React.ReactNode;
}

export default function InfoRow({
	icon: Icon,
	iconBg = 'bg-primary-light/30',
	iconColor = 'text-primary',
	label,
	children,
}: InfoRowProps) {
	return (
		<div className="flex items-start gap-3">
			<span className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 ${iconBg} ${iconColor}`}>
				<Icon className="h-4 w-4" />
			</span>
			<div>
				<p className="text-xs text-text-muted">{label}</p>
				<div className="font-semibold">{children}</div>
			</div>
		</div>
	);
}
