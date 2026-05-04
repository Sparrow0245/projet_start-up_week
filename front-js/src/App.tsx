import { Routes, Route } from 'react-router';
import LandingPage from './features/landing/LandingPage';
import SplashScreen from './features/splash/SplashScreen';
import Home from './features/home/Home';
import Login from './features/form/signIn/Login';
import SingUp from './features/form/signUp/SingUp';
import ExerciseLibrary from './features/exerciseList/List';
import ExerciseForm from './features/exerciseList/ExerciseForm';
import SessionStart from './features/session/SessionStart';
import ActiveWorkout from './features/session/ActiveWorkout';
import SubscriptionChoice from './features/subscription/SubscriptionChoice';
import Payment from './features/subscription/Payment';
import MySubscription from './features/subscription/MySubscription';
import SportForm from './features/form/sportForm/SportForm';
import ProgramPage from './features/program/ProgramPage';
import ProgressionPage from './features/progression/ProgressionPage';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import NotFound from './features/notFound/NotFound';
import TermsOfService from './features/legal/TermsOfService';
import PrivacyPolicy from './features/legal/PrivacyPolicy';
import ForgotPassword from './features/form/forgotPassword/ForgotPassword';
import ResetPassword from './features/form/resetPassword/ResetPassword';
import VerifyEmail from './features/form/verifyEmail/VerifyEmail';
import Contact from './features/contact/Contact';
import UserProfile from './features/profile/UserProfile';
import AdminPanel from './features/admin/AdminPanel';
import ContestsPage from './features/contests/ContestsPage';

function App() {
	return (
		<Routes>
			<Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
			<Route path="/splash" element={<SplashScreen />} />
			<Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
			<Route path="/signup" element={<GuestRoute><SingUp /></GuestRoute>} />
			<Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
			<Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
			<Route path="/verify-email" element={<VerifyEmail />} />
			<Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
			<Route path="/programme" element={<ProtectedRoute><ProgramPage /></ProtectedRoute>} />
			<Route path="/progression" element={<ProtectedRoute><ProgressionPage /></ProtectedRoute>} />
			<Route path="/subscription" element={<ProtectedRoute><SubscriptionChoice /></ProtectedRoute>} />
			<Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
			<Route path="/my-subscription" element={<ProtectedRoute><MySubscription /></ProtectedRoute>} />
			<Route path="/exercices" element={<ProtectedRoute><ExerciseLibrary /></ProtectedRoute>} />
			<Route path="/exercices/new" element={<ProtectedRoute><ExerciseForm /></ProtectedRoute>} />
			<Route path="/exercices/:exerciseId/edit" element={<ProtectedRoute><ExerciseForm /></ProtectedRoute>} />
			<Route path="/session/:sessionIndex" element={<ProtectedRoute><SessionStart /></ProtectedRoute>} />
			<Route path="/session/:sessionIndex/workout" element={<ProtectedRoute><ActiveWorkout /></ProtectedRoute>} />
			<Route path="/sportForm" element={<ProtectedRoute><SportForm /></ProtectedRoute>} />
			<Route path="/terms" element={<TermsOfService />} />
			<Route path="/privacy" element={<PrivacyPolicy />} />
			<Route path="/contact" element={<Contact />} />
			<Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
			<Route path="/contests" element={<ProtectedRoute><ContestsPage /></ProtectedRoute>} />
			<Route path="*" element={<NotFound />} />
			<Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
		</Routes>
	);
}

export default App;
