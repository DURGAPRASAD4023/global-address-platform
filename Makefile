.PHONY: help up down build logs test-backend test-frontend lint migrate shell-backend

help:
	@echo "Global Address Platform"
	@echo "  make up              Start all services"
	@echo "  make down            Stop all services"
	@echo "  make build           Rebuild images"
	@echo "  make logs            Tail logs"
	@echo "  make test-backend    Run backend pytest"
	@echo "  make test-frontend   Run frontend tests"
	@echo "  make lint            Lint backend + frontend"
	@echo "  make migrate         Run Alembic migrations"
	@echo "  make shell-backend   Open shell in backend container"

up:
	docker compose up --build

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

test-backend:
	docker compose exec backend pytest -q

test-frontend:
	docker compose exec frontend npm test -- --run

lint:
	docker compose exec backend ruff check app tests
	docker compose exec frontend npm run lint

migrate:
	docker compose exec backend alembic upgrade head

shell-backend:
	docker compose exec backend bash
