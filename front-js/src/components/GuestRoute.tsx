import { useSelector } from 'react-redux';
import { Navigate } from 'react-router';
import type { RootState } from '../store/store';

interface Props {
	children: React.ReactNode;
}

function GuestRoute({ children }: Props) {
	const { isAuthenticated, hasCompletedQuestionnaire, isCoach, isAdmin } = useSelector(
		(state: RootState) => state.auth
	);

	if (isAuthenticated && !isCoach && !isAdmin && !hasCompletedQuestionnaire) {
		return <Navigate to="/sportForm" replace />;
	}

	if (isAuthenticated) {
		return <Navigate to="/splash" replace />;
	}

	return <>{children}</>;
}

export default GuestRoute;
