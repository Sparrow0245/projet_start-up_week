import { BASE_URL, type GenerateProgramBody, type CompleteSessionResponse } from './apiClient';
import type { Program } from '../types';

export async function fetchProgram(userId: number): Promise<Program> {
	const res = await fetch(`${BASE_URL}/programme/user/${userId}`);
	if (!res.ok) throw new Error('no_program');
	return res.json();
}

export async function generateProgram(body: GenerateProgramBody): Promise<Program> {
	const res = await fetch(`${BASE_URL}/programme/generate`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error('Erreur serveur');
	return res.json();
}

export async function sendProgramFeedback(
	userId: number,
	feedback: string,
	language: string,
): Promise<Program> {
	const res = await fetch(`${BASE_URL}/programme/feedback`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ userId, feedback, language }),
	});
	if (!res.ok) throw new Error('gemini_error');
	return res.json();
}

export async function completeSession(sessionId: number): Promise<CompleteSessionResponse> {
	const res = await fetch(`${BASE_URL}/programme/sessions/${sessionId}/complete`, {
		method: 'PUT',
	});
	if (!res.ok) throw new Error('Erreur complétion séance');
	return res.json();
}
