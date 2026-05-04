import { Link } from 'react-router';

interface AuthLayoutProps {
	children: React.ReactNode;
	linkText: string;
	linkLabel: string;
	linkTo: string;
}

export default function AuthLayout({
	children,
	linkText,
	linkLabel,
	linkTo,
}: AuthLayoutProps) {

	return (
		<div className="flex min-h-screen items-center justify-center px-4 py-10">
			<div className="w-full max-w-sm space-y-8 text-center">
				{/* Logo */}
				<div className="flex flex-col items-center gap-4">
					<img
						src="/images/logo.png"
						alt="LevelUP"
						className="h-24 w-24 rounded-xl"
					/>
				</div>

				{children}

				<p className="text-sm text-text-muted">
					{linkText}{' '}
					<Link to={linkTo} className="text-primary font-medium">
						{linkLabel}
					</Link>
				</p>
			</div>
		</div>
	);
}
