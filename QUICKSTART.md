# Quick Start Guide - PostgreSQL Setup

This guide will help you get started with the Progchain project using PostgreSQL and Docker.

## Prerequisites

- **Docker** and **Docker Compose** installed ([Get Docker](https://docs.docker.com/get-docker/))
- **Make** (optional, for convenience commands)
- **OpenAI API Key** (for AI features)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Navigate to project directory
cd progchain

# Copy environment file
cp server/.env.example server/.env

# Add your OpenAI API key to server/.env
# Edit server/.env and set: OPENAI_API_KEY=your_actual_api_key_here
```

### 2. Start Development Environment

**Option A: Using Make (Recommended)**
```bash
make dev
```

**Option B: Using Docker Compose Directly**
```bash
# Docker Compose v2 (newer)
docker compose -f compose.dev.yaml up

# Docker Compose v1 (older)
docker-compose -f compose.dev.yaml up
```

This will:
- Start PostgreSQL database on port 5432
- Start the FastAPI server on port 8000
- Start the React client on port 5173
- Automatically create all database tables

### 3. Verify Setup

Once containers are running:

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Client**: http://localhost:5173
- **Database**: localhost:5432

Check container status:
```bash
make ps
# or
docker compose -f compose.dev.yaml ps
```

All services should show "healthy" status.

### 4. Run Tests

Tests run in isolated Docker containers with a dedicated test database:

```bash
make test
```

This will:
- Start test PostgreSQL container on port 5433
- Run all tests with pytest
- Generate coverage reports
- Clean up containers automatically

## 📋 Common Commands

### Development

```bash
# Start dev environment
make dev

# Start in background (detached)
make dev-detached

# View logs
make logs

# View server logs only
make logs-server

# View database logs only
make logs-db

# Stop all containers
make down
```

### Database

```bash
# Connect to database shell
make db-shell

# Reset database (⚠️ deletes all data)
make db-reset

# Run migrations (create tables)
make db-migrate
```

### Testing

```bash
# Run all tests
make test

# Run unit tests only
make test-unit

# Generate coverage report
make test-coverage

# Run tests in watch mode
make test-watch
```

### Container Management

```bash
# View running containers
make ps

# Rebuild containers
make rebuild

# Clean up everything
make clean

# Open shell in server container
make shell-server

# Open shell in database container
make shell-db
```

## 🔧 Configuration

### Environment Variables

Key environment variables in `server/.env`:

```env
# OpenAI API (required for AI features)
OPENAI_API_KEY=your_api_key_here

# Database (automatically configured for Docker)
DATABASE_URL=postgresql+asyncpg://progchain:progchain@db:5432/progchain

# Server
ENVIRONMENT=dev
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

### Database Connection

The application automatically connects to PostgreSQL when running in Docker.

**Local connection details:**
- Host: `localhost` (or `db` from within containers)
- Port: `5432`
- Database: `progchain`
- User: `progchain`
- Password: `progchain`

**Test database:**
- Port: `5433`
- Database: `test_progchain`
- User: `test_user`
- Password: `test_password`

## 🗄️ Database Information

### Technology Stack
- **Database**: PostgreSQL 16 (Alpine)
- **Driver**: asyncpg (async PostgreSQL driver)
- **ORM**: SQLAlchemy 2.0+ with async support

### Available Tables
1. **Roadmap Feature**: `roadmaps`, `roadmap_nodes`
2. **Topics Feature**: `topic_chains`, `topics`, `sub_topics`, `topic_chain_stats`
3. **Explore Feature**: `explore_chats`, `explore_chat_messages`, `explore_chat_stats`
4. **Threads Feature**: `thread`, `thread_content`, `thread_content_chat`
5. **Config**: `prompt_types`

Tables are automatically created on application startup.

## 🧪 Testing

### Test Structure

```
server/tests/
├── __init__.py
├── conftest.py          # Test fixtures and configuration
└── test_database.py     # Database connectivity tests
```

### Writing Tests

```python
import pytest
from sqlalchemy import text

@pytest.mark.db
@pytest.mark.asyncio
async def test_example(db_session):
    """Example database test."""
    result = await db_session.execute(text("SELECT 1"))
    assert result.scalar() == 1
```

### Test Fixtures

- `test_engine` - Test database engine (session scope)
- `db_session` - Database session with auto-rollback (function scope)
- `client` - FastAPI test client (function scope)

### Test Markers

```python
@pytest.mark.unit        # Unit tests (no external dependencies)
@pytest.mark.integration # Integration tests (requires services)
@pytest.mark.db          # Database tests
@pytest.mark.api         # API endpoint tests
@pytest.mark.slow        # Slow running tests
```

## 🐛 Troubleshooting

### Port Already in Use

If port 5432 is already in use:

1. Edit `compose.dev.yaml`:
   ```yaml
   ports:
     - "5433:5432"  # Changed from 5432:5432
   ```

2. Update `server/.env`:
   ```env
   DATABASE_URL=postgresql+asyncpg://progchain:progchain@localhost:5433/progchain
   ```

### Container Won't Start

Check logs:
```bash
make logs-db
```

Rebuild containers:
```bash
make rebuild
```

### Connection Refused

Ensure database is healthy:
```bash
docker compose -f compose.dev.yaml ps
```

Wait for health checks to pass (may take 10-15 seconds).

### Reset Everything

```bash
make clean
make dev
```

## 📚 Next Steps

1. ✅ Development environment running
2. ✅ PostgreSQL database configured
3. ✅ Tests passing
4. 📖 Read [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed information
5. 🔨 Start building features!

## 🆘 Getting Help

- Check logs: `make logs`
- View available commands: `make help`
- Read detailed docs: [DATABASE_SETUP.md](./DATABASE_SETUP.md)

## 📝 What Changed from SQLite?

### Before (SQLite)
- Single file database
- No Docker required for database
- Limited concurrency

### After (PostgreSQL)
- Production-ready database
- Docker containerized
- Better performance and scalability
- Proper connection pooling
- Container-based testing
- Async PostgreSQL driver (asyncpg)

All existing code continues to work - only the database backend changed!
