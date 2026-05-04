import { BASE_URL, type UserResponse, type CoachInfo } from './apiClient';

export type { UserResponse, CoachInfo };

export async function fetchPendingCoaches(): Promise<UserResponse[]> {
	const res = await fetch(`${BASE_URL}/users/admin/coaches/pending`);
	if (!res.ok) throw new Error('Erreur chargement');
	return res.json();
}

export async function fetchApprovedCoaches(): Promise<CoachInfo[]> {
	const res = await fetch(`${BASE_URL}/users/admin/coaches/approved`);
	if (!res.ok) throw new Error('Erreur chargement');
	return res.json();
}

export async function approveCoach(coachId: number): Promise<UserResponse> {
	const res = await fetch(`${BASE_URL}/users/admin/coaches/${coachId}/approve`, {
		method: 'PUT',
	});
	if (!res.ok) throw new Error('Erreur validation');
	return res.json();
}

export async function rejectCoach(coachId: number): Promise<string> {
	const res = await fetch(`${BASE_URL}/users/admin/coaches/${coachId}/reject`, {
		method: 'DELETE',
	});
	if (!res.ok) throw new Error('Erreur refus');
	return res.json();
}

export async function deleteCoach(coachId: number): Promise<string> {
	const res = await fetch(`${BASE_URL}/users/admin/coaches/${coachId}`, {
		method: 'DELETE',
	});
	if (!res.ok) throw new Error('Erreur suppression');
	return res.json();
}
