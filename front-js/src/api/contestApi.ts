import { BASE_URL } from './apiClient';
import type { Contest } from '../types';

export async function fetchContests(): Promise<Contest[]> {
	const res = await fetch(`${BASE_URL}/contests`);
	if (!res.ok) throw new Error('Erreur chargement concours');
	return res.json();
}

export async function fetchUserContestEntries(userId: number): Promise<number[]> {
	const res = await fetch(`${BASE_URL}/contests/user/${userId}`);
	if (!res.ok) throw new Error('Erreur chargement inscriptions');
	return res.json();
}

export async function enterContest(contestId: number, userId: number): Promise<string> {
	const res = await fetch(`${BASE_URL}/contests/${contestId}/enter`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ userId }),
	});
	if (res.status === 403) throw new Error('level_insufficient');
	if (res.status === 409) throw new Error('already_registered');
	if (!res.ok) throw new Error('Erreur inscription');
	return res.json();
}

export async function withdrawContest(contestId: number, userId: number): Promise<string> {
	const res = await fetch(`${BASE_URL}/contests/${contestId}/withdraw`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ userId }),
	});
	if (!res.ok) throw new Error('Erreur désinscription');
	return res.json();
}

export async function drawContestWinner(contestId: number, adminId: number): Promise<Contest> {
	const res = await fetch(`${BASE_URL}/contests/${contestId}/draw`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ adminId }),
	});
	if (!res.ok) throw new Error('Erreur tirage au sort');
	return res.json();
}

export async function createContest(body: {
	titre: string;
	description: string;
	recompense: string;
	levelRequis: number;
	dateLimite: string;
}): Promise<Contest> {
	const res = await fetch(`${BASE_URL}/contests`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error('Erreur création concours');
	return res.json();
}
