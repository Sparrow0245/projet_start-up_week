import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
	Menu,
	X,
	Home,
	Dumbbell,
	CreditCard,
	ClipboardList,
	User,
	LogOut,
	Globe,
	MessageSquare,
	TrendingUp,
	ShieldCheck,
	Trophy,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/auth/authSlice';
import { clearProgram } from '../store/program/programSlice';
import type { AppDispatch, RootState } from '../store/store';

interface NavItem {
	label: string;
	path: string;
	icon: React.ReactNode;
}

export default function Navbar() {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useDispatch<AppDispatch>();
	const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);
	const [isOpen, setIsOpen] = useState(false);

	function toggleLanguage() {
		i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr');
	}

	function handleLogout() {
		dispatch(logout());
		dispatch(clearProgram());
		navigate('/login');
		setIsOpen(false);
	}

	const navItems: NavItem[] = [
		{ label: t('nav.home'), path: '/home', icon: <Home className="h-5 w-5" /> },
		{
			label: t('nav.exercises'),
			path: '/exercices',
			icon: <Dumbbell className="h-5 w-5" />,
		},
		{
			label: t('nav.program'),
			path: '/programme',
			icon: <ClipboardList className="h-5 w-5" />,
		},
		{
			label: t('nav.progression'),
			path: '/progression',
			icon: <TrendingUp className="h-5 w-5" />,
		},
		{
			label: t('nav.contests'),
			path: '/contests',
			icon: <Trophy className="h-5 w-5" />,
		},
		{
			label: t('nav.subscription'),
			path: '/my-subscription',
			icon: <CreditCard className="h-5 w-5" />,
		},
		{
			label: t('nav.profile'),
			path: '/profile',
			icon: <User className="h-5 w-5" />,
		},
		...(isAdmin ? [{
			label: t('nav.admin'),
			path: '/admin',
			icon: <ShieldCheck className="h-5 w-5" />,
		}] : []),
	];

	function handleNavigate(path: string) {
		navigate(path);
		setIsOpen(false);
	}

	return (
		<>
			{/* Top bar */}
			<div className="flex items-center justify-between">
				<button
					onClick={() => setIsOpen(!isOpen)}
					className="flex items-center justify-center h-10 w-10 rounded-lg border border-border bg-surface text-text transition-colors hover:border-primary"
				>
					{isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
				</button>
			<div className="h-10 w-10 rounded-lg">
					<img
						src="/images/logo.png"
						alt="LevelUP"
						className="h-full w-full rounded-lg object-cover"
					/>
				</div>
			</div>

			{/* Menu mobile overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 z-40 bg-text/30"
					onClick={() => setIsOpen(false)}
				/>
			)}

			{/* Menu panel */}
			<div
				className={`fixed top-0 left-0 z-50 h-full w-64 bg-surface shadow-lg transition-transform duration-300 ease-in-out ${
					isOpen ? 'translate-x-0' : '-translate-x-full'
				}`}
			>
				{/* Header du menu */}
				<div className="flex items-center justify-between px-5 py-5 border-b border-border">
					<span className="text-lg font-bold text-primary">Level Up</span>
					<button
						onClick={() => setIsOpen(false)}
						className="flex items-center justify-center h-8 w-8 rounded-md text-text-muted transition-colors hover:text-text"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Liens */}
				<nav className="flex flex-col py-3 flex-1">
					{navItems.map(item => {
						const isActive = location.pathname === item.path;
						return (
							<button
								key={item.path}
								onClick={() => handleNavigate(item.path)}
								className={`flex items-center gap-3 px-5 py-3.5 text-left text-sm font-medium transition-colors ${
									isActive
										? 'bg-primary-light/20 text-primary border-r-2 border-primary'
										: 'text-text hover:bg-background'
								}`}
							>
								<span className={isActive ? 'text-primary' : 'text-text-muted'}>
									{item.icon}
								</span>
								{item.label}
							</button>
						);
					})}
				</nav>

				{/* Langue + Déconnexion */}
				<div className="border-t border-border px-5 py-4 space-y-3">
					<button
						onClick={() => handleNavigate('/contact')}
						className="flex items-center gap-3 text-sm font-medium text-text hover:text-primary transition-colors w-full"
					>
						<MessageSquare className="h-5 w-5" />
						{t('nav.contact')}
					</button>
					<button
						onClick={toggleLanguage}
						className="flex items-center gap-3 text-sm font-medium text-text hover:text-primary transition-colors w-full"
					>
						<Globe className="h-5 w-5" />
						{i18n.language === 'fr' ? 'Français' : 'English'}
					</button>
					<button
						onClick={handleLogout}
						className="flex items-center gap-3 text-sm font-medium text-red-500 hover:text-red-600 transition-colors w-full"
					>
						<LogOut className="h-5 w-5" />
						{t('nav.logout')}
					</button>
				</div>
			</div>

			{/* Bottom nav mobile */}
			<div className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border px-2 py-1.5 flex justify-center gap-16 md:hidden">
				{navItems.filter(item => item.path === '/home' || item.path === '/programme' || item.path === '/progression').map(item => {
					const isActive = location.pathname === item.path;
					return (
						<button
							key={item.path}
							onClick={() => handleNavigate(item.path)}
							className={`flex flex-col items-center justify-center gap-0.5 px-4 py-1 rounded-lg text-[10px] font-medium transition-colors ${
								isActive ? 'text-primary' : 'text-text-muted'
							}`}
						>
							{item.icon}
							<span>{item.label}</span>
						</button>
					);
				})}
			</div>
		</>
	);
}
