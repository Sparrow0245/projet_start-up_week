import { BASE_URL } from './apiClient';
import type { Sport, Role, Equipment, Goal } from '../types';

export async function fetchSports(): Promise<Sport[]> {
	const res = await fetch(`${BASE_URL}/sports`);
	if (!res.ok) throw new Error('Erreur chargement sports');
	return res.json();
}

export async function fetchRolesBySport(sportId: number): Promise<Role[]> {
	const res = await fetch(`${BASE_URL}/sports/${sportId}/roles`);
	if (!res.ok) throw new Error('Erreur chargement rôles');
	return res.json();
}

export async function fetchEquipmentBySport(sportId: number): Promise<Equipment[]> {
	const res = await fetch(`${BASE_URL}/sports/${sportId}/equipment`);
	if (!res.ok) throw new Error('Erreur chargement matériel');
	return res.json();
}

export async function fetchGoalsBySport(sportId: number): Promise<Goal[]> {
	const res = await fetch(`${BASE_URL}/sports/${sportId}/goals`);
	if (!res.ok) throw new Error('Erreur chargement objectifs');
	return res.json();
}
