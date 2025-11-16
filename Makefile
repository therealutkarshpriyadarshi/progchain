.PHONY: help dev prod test test-watch down clean install migrate db-shell

# Colors for help output
BLUE := \033[36m
GREEN := \033[32m
RESET := \033[0m

help: ## Show this help message
	@echo "$(BLUE)Progchain - Available Commands$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'

install: ## Install dependencies
	@echo "📦 Installing server dependencies..."
	cd server && poetry install
	@echo "📦 Installing client dependencies..."
	cd client && npm install
	@echo "✅ Dependencies installed!"

dev: ## Start development environment with Docker
	@echo "🚀 Starting development environment..."
	docker-compose -f compose.dev.yaml up --build

dev-detached: ## Start development environment in background
	@echo "🚀 Starting development environment in background..."
	docker-compose -f compose.dev.yaml up -d --build
	@echo "✅ Development environment running!"
	@echo "📊 View logs with: make logs"

prod: ## Start production environment
	@echo "🚀 Starting production environment..."
	docker-compose -f compose.yml up -d --build

test: ## Run tests with Docker containers
	@echo "🧪 Running tests..."
	./server/run_tests.sh

test-unit: ## Run unit tests only (without containers)
	@echo "🧪 Running unit tests..."
	cd server && poetry run pytest -m "unit" -v

test-watch: ## Run tests in watch mode
	@echo "🧪 Running tests in watch mode..."
	cd server && poetry run pytest-watch

test-coverage: ## Run tests and generate coverage report
	@echo "🧪 Running tests with coverage..."
	./server/run_tests.sh --cov-report=html
	@echo "📊 Coverage report generated in server/htmlcov/index.html"

down: ## Stop all containers
	@echo "🛑 Stopping all containers..."
	docker-compose -f compose.dev.yaml down
	docker-compose -f compose.yml down
	docker-compose -f docker-compose.test.yml down

clean: ## Remove all containers, volumes, and images
	@echo "🧹 Cleaning up..."
	docker-compose -f compose.dev.yaml down -v --rmi all
	docker-compose -f compose.yml down -v --rmi all
	docker-compose -f docker-compose.test.yml down -v --rmi all
	@echo "✅ Cleanup complete!"

logs: ## Show logs from running containers
	docker-compose -f compose.dev.yaml logs -f

logs-server: ## Show server logs only
	docker-compose -f compose.dev.yaml logs -f server

logs-db: ## Show database logs only
	docker-compose -f compose.dev.yaml logs -f db

db-shell: ## Connect to PostgreSQL database shell
	docker-compose -f compose.dev.yaml exec db psql -U progchain -d progchain

db-migrate: ## Run database migrations (create tables)
	@echo "🗄️  Running database migrations..."
	docker-compose -f compose.dev.yaml exec server poetry run python -c "import asyncio; from src.db.config import init_db; asyncio.run(init_db())"
	@echo "✅ Migrations complete!"

db-reset: ## Reset database (WARNING: deletes all data)
	@echo "⚠️  Resetting database..."
	docker-compose -f compose.dev.yaml down -v
	docker-compose -f compose.dev.yaml up -d db
	@echo "⏳ Waiting for database..."
	sleep 5
	docker-compose -f compose.dev.yaml up -d server
	@echo "✅ Database reset complete!"

format: ## Format code with black
	@echo "🎨 Formatting code..."
	cd server && poetry run black src/ tests/
	@echo "✅ Code formatted!"

format-check: ## Check code formatting
	@echo "🔍 Checking code formatting..."
	cd server && poetry run black --check src/ tests/

shell-server: ## Open shell in server container
	docker-compose -f compose.dev.yaml exec server /bin/bash

shell-db: ## Open shell in database container
	docker-compose -f compose.dev.yaml exec db /bin/sh

ps: ## Show running containers
	docker-compose -f compose.dev.yaml ps

rebuild: ## Rebuild containers without cache
	@echo "🔨 Rebuilding containers..."
	docker-compose -f compose.dev.yaml build --no-cache
	@echo "✅ Rebuild complete!"
