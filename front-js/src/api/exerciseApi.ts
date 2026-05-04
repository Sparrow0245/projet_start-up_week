import { BASE_URL, type ExerciseBody } from './apiClient';
import type { Exercise } from '../types';

export async function fetchExercises(count: number): Promise<{ totalCount: number; exercices: Exercise[] }> {
	const res = await fetch(`${BASE_URL}/exercices/${count}`);
	if (!res.ok) throw new Error('Erreur chargement exercices');
	return res.json();
}

export async function fetchExerciseDetail(exerciseId: number): Promise<Exercise> {
	const res = await fetch(`${BASE_URL}/exercices/${exerciseId}/detail`);
	if (!res.ok) throw new Error('Erreur chargement exercice');
	return res.json();
}

export async function createExercise(body: ExerciseBody): Promise<Exercise> {
	const res = await fetch(`${BASE_URL}/exercices`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error('Erreur création exercice');
	return res.json();
}

export async function updateExercise(exerciseId: number, body: ExerciseBody): Promise<Exercise> {
	const res = await fetch(`${BASE_URL}/exercices/${exerciseId}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error('Erreur modification exercice');
	return res.json();
}

export async function deleteExercise(exerciseId: number, adminId: number): Promise<string> {
	const res = await fetch(`${BASE_URL}/exercices/${exerciseId}?adminId=${adminId}`, {
		method: 'DELETE',
	});
	if (!res.ok) throw new Error('Erreur suppression');
	return res.json();
}
