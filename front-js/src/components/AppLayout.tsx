import { Undo2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import Navbar from './Navbar';

interface AppLayoutProps {
	children: React.ReactNode;
	footer?: React.ReactNode;
	showBack?: boolean;
}

export default function AppLayout({
	children,
	footer,
	showBack = false,
}: AppLayoutProps) {
	const navigate = useNavigate();

	return (
		<div className="flex h-screen flex-col px-4 py-6 pb-16 md:pb-6">
			{/* Header avec Navbar */}
			<Navbar />

			{/* Zone scrollable */}
			<div className="mt-4 flex-1 overflow-y-auto space-y-5 pr-1">
				{children}
			</div>

			{/* Footer fixe */}
			{footer && (
				<div className="mt-4 relative pb-6">
					{footer}
					{showBack && (
						<button
							onClick={() => navigate(-1)}
							className="absolute -bottom-1 left-0 flex items-center justify-center rounded-md border border-primary bg-surface text-primary h-9 w-9 shadow-sm"
						>
							<Undo2 className="h-5 w-5" />
						</button>
					)}
				</div>
			)}
		</div>
	);
}
