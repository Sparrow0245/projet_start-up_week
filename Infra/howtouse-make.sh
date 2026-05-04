#!/bin/bash

# Voir toutes les commandes disponibles
make help

# Démarrer toute la stack
make up

# Ou en background
make up-d

# Voir les logs
make logs

# Développer (frontend + backend en mode dev)
# → lance deux processus en parallèle
make dev

# Build complet (pour prod ou avant push)
make build-all

# Nettoyer un peu
make clean
make prune     # attention : supprime pas mal de choses Docker
