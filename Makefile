.PHONY: help up down build logs ps \
        be-install be-dev be-test be-test-e2e be-build \
        fe-install fe-dev fe-build \
        db-reset

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── Docker ────────────────────────────────────────────────────────────────────

up: ## Start all services (Docker)
	docker compose up -d

down: ## Stop all services
	docker compose down

build: ## Rebuild all Docker images
	docker compose build

logs: ## Tail logs for all services
	docker compose logs -f

ps: ## Show running containers
	docker compose ps

# ── Backend ───────────────────────────────────────────────────────────────────

be-install: ## Install backend dependencies
	cd backend && npm install

be-dev: ## Start backend in watch mode
	cd backend && npm run start:dev

be-build: ## Build backend
	cd backend && npm run build

be-test: ## Run backend unit tests
	cd backend && npm test

be-test-e2e: ## Run backend integration tests
	cd backend && npm run test:e2e

# ── Frontend ──────────────────────────────────────────────────────────────────

fe-install: ## Install frontend dependencies
	cd frontend && npm install

fe-dev: ## Start frontend dev server
	cd frontend && npm run dev

fe-build: ## Build frontend
	cd frontend && npm run build

# ── Database ──────────────────────────────────────────────────────────────────

db-reset: ## Drop and recreate the local database (requires psql)
	psql -U postgres -c "DROP DATABASE IF EXISTS seat_reservation;" \
	  && psql -U postgres -c "CREATE DATABASE seat_reservation;"

# ── Quick-start (local, no Docker) ───────────────────────────────────────────

install: be-install fe-install ## Install all dependencies

dev: ## Run backend + frontend concurrently (requires concurrently)
	npx concurrently \
	  --names "BE,FE" \
	  --prefix-colors "blue,green" \
	  "cd backend && npm run start:dev" \
	  "cd frontend && npm run dev"
