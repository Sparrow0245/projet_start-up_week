# ================================================
# Makefile - Fullstack React  +  Spring Boot  +  Postgres
# ================================================

# Configuration de base
DOCKER_COMPOSE = docker compose
FRONT_DIR = frontend
BACK_DIR = backend
COMPOSE_FILE = docker-compose.yml

# Couleurs pour l'affichage
CYAN = \033[0;36m
GREEN = \033[0;32m
RED = \033[0;31m
NC = \033[0m

# ────────────────────────────────────────────────
# AIDE
# ────────────────────────────────────────────────
help: ## Affiche cette aide
	@echo ""
	@echo "${CYAN}Commandes disponibles :${NC}"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  ${GREEN}%-20s${NC} %s\n", $$1, $$2}'
	@echo ""

# ────────────────────────────────────────────────
# DOCKER COMPOSE
# ────────────────────────────────────────────────
up: ## Démarre tout (frontend + backend + db)
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) up --build

up-d: ## Démarre en mode détaché (-d)
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) up -d --build

down: ## Arrête et supprime les containers
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) down

down-v: ## Arrête + supprime containers + volumes (reset DB)
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) down -v

restart: down up ## Redémarre tout

logs: ## Affiche les logs en temps réel
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) logs -f

logs-front: ## Logs frontend uniquement
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) logs -f frontend

logs-back: ## Logs backend uniquement
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) logs -f backend

logs-db: ## Logs postgres uniquement
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) logs -f db

ps: ## Liste l'état des services
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) ps

# ────────────────────────────────────────────────
# FRONTEND (React)
# ────────────────────────────────────────────────
front-install: ## Installe les dépendances frontend
	cd $(FRONT_DIR) && npm install

front-dev: ## Lance le frontend en mode dev (hot-reload)
	cd $(FRONT_DIR) && npm run dev

front-build: ## Build production du frontend
	cd $(FRONT_DIR) && npm run build

front-lint: ## Lance le linter frontend (si eslint existe)
	cd $(FRONT_DIR) && npm run lint || echo "Pas de script lint trouvé"

# ────────────────────────────────────────────────
# BACKEND (Spring Boot + Maven)
# ────────────────────────────────────────────────
back-build: ## Compile le backend (Maven)
	cd $(BACK_DIR) && mvn clean package -DskipTests

back-install: ## Installe les dépendances Maven
	cd $(BACK_DIR) && mvn dependency:go-offline

back-test: ## Lance les tests unitaires backend
	cd $(BACK_DIR) && mvn test

back-dev: ## Lance Spring Boot en mode dev (via Maven)
	cd $(BACK_DIR) && mvn spring-boot:run

back-jar: ## Génère le .jar final
	cd $(BACK_DIR) && mvn clean package -DskipTests

# ────────────────────────────────────────────────
# Raccourcis utiles
# ────────────────────────────────────────────────
dev: front-dev & back-dev ## Lance frontend + backend en mode dev (deux terminaux)

build-all: front-build back-build ## Build frontend + backend

clean: ## Nettoyage basique
	cd $(FRONT_DIR) && rm -rf node_modules .next dist build
	cd $(BACK_DIR) && mvn clean
	@echo "${GREEN}Nettoyage terminé${NC}"

prune: ## Nettoie les images/orphans Docker
	docker system prune -f
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) down --rmi local --volumes --remove-orphans

# ────────────────────────────────────────────────
.PHONY: help up up-d down down-v restart logs ps \
        front-install front-dev front-build front-lint \
        back-build back-install back-test back-dev back-jar \
        dev build-all clean prune
