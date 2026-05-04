import { BASE_URL, type UserResponse } from './apiClient';

export { BASE_URL };
export type { UserResponse };

// ─── Login ────────────────────────────────────────────────────────────────────

export async function fetchLogin(
	email: string,
	password: string,
): Promise<UserResponse> {
	const response = await fetch(`${BASE_URL}/users/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
	});

	if (response.status === 403) {
		const body = await response.json();
		if (body === 'email_not_verified') {
			throw new Error('email_not_verified');
		}
	}

	if (!response.ok) throw new Error('Identifiants incorrects');
	return response.json();
}

// ─── Signup ───────────────────────────────────────────────────────────────────

export async function fetchSignup(
	prenom: string,
	nom: string,
	email: string,
	password: string,
	isCoach: boolean = false,
): Promise<UserResponse> {
	const response = await fetch(`${BASE_URL}/users/signup`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ prenom, nom, email, password, coach: isCoach }),
	});
	if (response.status === 409) throw new Error('Cet email est déjà utilisé');
	if (!response.ok) throw new Error('Erreur serveur, réessayez plus tard');
	return response.json();
}

// ─── Email verification ───────────────────────────────────────────────────────

export async function fetchVerifyEmail(token: string): Promise<string> {
	const response = await fetch(`${BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`);
	if (!response.ok && response.status !== 400) throw new Error('error');
	return response.json();
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function fetchForgotPassword(email: string): Promise<string> {
	const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email }),
	});
	if (!response.ok) throw new Error('Erreur serveur');
	return response.json();
}

export async function fetchResetPassword(
	token: string,
	newPassword: string,
): Promise<string> {
	const response = await fetch(`${BASE_URL}/auth/reset-password`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ token, newPassword }),
	});
	if (!response.ok) throw new Error('Erreur serveur');
	return response.json();
}
