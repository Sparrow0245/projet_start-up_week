import { useEffect } from 'react';
import { useNavigate } from 'react-router';

function SplashScreen() {
	const navigate = useNavigate();

	useEffect(() => {
		const timer = setTimeout(() => {
			navigate('/home', { replace: true });
		}, 2500);

		return () => clearTimeout(timer);
	}, [navigate]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background">
			<img
				src="/images/logo.png"
				alt="LevelUP"
				className="splash-logo w-48 rounded-xl"
			/>
			<p className="splash-tagline mt-6 text-lg font-medium tracking-wide text-text-muted">
				Votre coach personnel
			</p>
		</div>
	);
}

export default SplashScreen;
