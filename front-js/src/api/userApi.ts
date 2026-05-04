import { BASE_URL, type UserResponse } from './apiClient';

export async function fetchUser(userId: number): Promise<UserResponse> {
	const res = await fetch(`${BASE_URL}/users/${userId}`);
	if (!res.ok) throw new Error('Utilisateur introuvable');
	return res.json();
}

export async function incrementExperience(userId: number, xp: number): Promise<UserResponse> {
	const res = await fetch(`${BASE_URL}/users/${userId}/experience/increment`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(xp),
	});
	if (!res.ok) throw new Error('Erreur XP');
	return res.json();
}
