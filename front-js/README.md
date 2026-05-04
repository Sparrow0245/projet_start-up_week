# Level Up - Frontend

## Contexte

Level Up est une application de coaching sportif dont l'objectif est de proposer un accompagnement personnalise en fonction du sport pratique, du poste occupe, des contraintes physiques de l'utilisateur et de son evolution dans le temps.

L'application repose sur un referentiel d'exercices valide par des coachs professionnels. Chaque exercice est associe a des criteres precis (sport, poste, objectifs, materiel, contraintes biomecaniques) qui permettent de generer des seances adaptees au profil de chaque utilisateur.

Le frontend communique avec une API Spring Boot pour la gestion des donnees (authentification, exercices, seances, profils).

## Stack technique

- **React 19** avec **TypeScript**
- **Vite** pour le build et le dev server
- **Tailwind CSS v4** pour le styling (design system custom dans `css/index.css`)
- **Redux Toolkit** pour la gestion d'etat
- **React Router v7** pour le routing
- **i18next** pour l'internationalisation (FR / EN)
- **Axios** pour les appels HTTP
- **Lucide React** pour les icones
- **ESLint** + **Prettier** pour le linting et le formatage

## Installation

```bash
npm install
```

## Lancement en developpement

```bash
npm run dev
```

## Build

```bash
npm run build
```
