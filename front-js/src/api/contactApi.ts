import { BASE_URL } from './authApi';

export interface ContactPayload {
	email: string;
	name: string;
	subject: string;
	message: string;
}

export async function fetchContact(payload: ContactPayload): Promise<string> {
	const response = await fetch(`${BASE_URL}/contact`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		throw new Error('Erreur serveur');
	}

	return response.json();
}
