/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],

	test: {
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'src/main.tsx',
				'src/test/**',
				'src/**/*.d.ts',
			],
		},
	},
	server: {
		host: true, // ou '0.0.0.0' – permet l'écoute sur toutes les interfaces (important en Docker)
		port: 5173,
		strictPort: true, // évite que Vite change de port si 5173 est pris

		watch: {
			usePolling: true, // polling = détecte les changements via volumes Docker
			interval: 1000,
		},

		// Option 2 : Autoriser seulement tes domaines de test (plus sécurisé)
		allowedHosts: [
			'app.local',
			'localhost',
			'.local',
            'app-levelup.fr',
			'app-levelup.fr:5173',
			'app-levelup.fr:80',
			'app-levelup.fr:443',
		],
	},
});
