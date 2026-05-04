import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router';
import type { RootState } from '../store/store';

interface Props {
	children: React.ReactNode;
}

function ProtectedRoute({ children }: Props) {
	const { isAuthenticated, hasCompletedQuestionnaire, isCoach, isAdmin } = useSelector(
		(state: RootState) => state.auth
	);
	const location = useLocation();

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	if (!isCoach && !isAdmin && !hasCompletedQuestionnaire && location.pathname !== '/sportForm') {
		return <Navigate to="/sportForm" replace />;
	}

	return <>{children}</>;
}

export default ProtectedRoute;
