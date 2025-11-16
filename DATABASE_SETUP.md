# PostgreSQL Database Setup

This project uses **PostgreSQL** as its primary database, fully integrated with Docker for development, testing, and production environments.

## Overview

- **Database**: PostgreSQL 16 (Alpine)
- **Driver**: asyncpg (async PostgreSQL driver)
- **ORM**: SQLAlchemy 2.0+ with async support
- **Testing**: Containerized testing with dedicated test database

## Quick Start

### Development Environment

1. **Start the development environment** (includes PostgreSQL):
   ```bash
   make dev
   ```

   Or with docker-compose directly:
   ```bash
   docker-compose -f compose.dev.yaml up
   ```

2. **Access the database shell**:
   ```bash
   make db-shell
   ```

3. **View database logs**:
   ```bash
   make logs-db
   ```

### Running Tests

Tests run in isolated Docker containers with a dedicated PostgreSQL instance:

```bash
make test
```

This command:
- Starts a test PostgreSQL container on port 5433
- Runs all tests with pytest
- Generates coverage reports
- Cleans up containers after completion

### Production Environment

```bash
make prod
```

## Database Configuration

### Environment Variables

Configure database connection in `server/.env`:

```env
# PostgreSQL Configuration
DATABASE_URL=postgresql+asyncpg://progchain:progchain@db:5432/progchain
POSTGRES_USER=progchain
POSTGRES_PASSWORD=progchain
POSTGRES_DB=progchain
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

### Test Database

For testing, use a separate database (configured in `docker-compose.test.yml`):

```env
TEST_DATABASE_URL=postgresql+asyncpg://test_user:test_password@test-db:5432/test_progchain
```

## Docker Services

### Development Database (compose.dev.yaml)

```yaml
db:
  image: postgres:16-alpine
  environment:
    POSTGRES_USER: progchain
    POSTGRES_PASSWORD: progchain
    POSTGRES_DB: progchain
  ports:
    - "5432:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U progchain"]
    interval: 5s
    timeout: 5s
    retries: 5
```

### Test Database (docker-compose.test.yml)

```yaml
test-db:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: test_progchain
    POSTGRES_USER: test_user
    POSTGRES_PASSWORD: test_password
  ports:
    - "5433:5432"  # Different port to avoid conflicts
  tmpfs:
    - /var/lib/postgresql/data  # In-memory for faster tests
```

## Database Models

The application includes the following database models:

1. **Roadmap Feature**
   - `roadmaps` - Learning roadmaps
   - `roadmap_nodes` - Hierarchical roadmap nodes

2. **Topics Feature**
   - `topic_chains` - Topic learning chains
   - `topics` - Main topics
   - `sub_topics` - Subtopics with difficulty levels
   - `topic_chain_stats` - Statistics for topic chains

3. **Explore Feature**
   - `explore_chats` - Research assistant chats
   - `explore_chat_messages` - Chat messages
   - `explore_chat_stats` - Token usage and cost tracking

4. **Threads Feature**
   - `thread` - Discussion threads
   - `thread_content` - Thread content items
   - `thread_content_chat` - Chat within thread content

5. **Configuration**
   - `prompt_types` - Prompt type configurations

## Common Commands

### Database Operations

```bash
# Connect to database shell
make db-shell

# View database logs
make logs-db

# Reset database (⚠️ deletes all data)
make db-reset

# Run migrations (create tables)
make db-migrate
```

### Development

```bash
# Start dev environment
make dev

# Start in background
make dev-detached

# View all logs
make logs

# Stop all containers
make down
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

## Migrations

Database tables are automatically created on application startup via:

```python
from src.db.config import init_db
await init_db()
```

This uses SQLAlchemy's `metadata.create_all()` to create all tables defined in the models.

For production, consider using a proper migration tool like [Alembic](https://alembic.sqlalchemy.org/).

## Writing Tests

All tests should use the fixtures defined in `tests/conftest.py`:

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

### Available Test Fixtures

- `test_engine` - Test database engine (session scope)
- `db_session` - Database session with automatic rollback (function scope)
- `client` - FastAPI test client (function scope)
- `cleanup_db` - Cleanup fixture for post-test cleanup

### Test Markers

Use markers to organize tests:

```python
@pytest.mark.unit        # Unit tests (no external dependencies)
@pytest.mark.integration # Integration tests (requires services)
@pytest.mark.db          # Database tests
@pytest.mark.api         # API endpoint tests
@pytest.mark.slow        # Slow running tests
```

## Connection Pooling

PostgreSQL connections are managed with SQLAlchemy's connection pool:

```python
engine_kwargs = {
    "pool_pre_ping": True,    # Health checks before using connections
    "pool_size": 10,          # Default pool size
    "max_overflow": 20,       # Max additional connections
}
```

## Troubleshooting

### Container Won't Start

Check logs:
```bash
make logs-db
```

### Connection Refused

Ensure the database is healthy:
```bash
docker-compose -f compose.dev.yaml ps
```

All services should show `healthy` status.

### Port Already in Use

If port 5432 is already in use, modify `compose.dev.yaml`:
```yaml
ports:
  - "5433:5432"  # Use different host port
```

Then update `DATABASE_URL` accordingly.

### Reset Everything

```bash
make clean
make dev
```

## Performance Considerations

### Development
- Uses persistent Docker volume for data
- Connection pooling for efficient resource usage
- Health checks ensure database availability

### Testing
- Uses `tmpfs` for in-memory storage (faster tests)
- Automatic cleanup after test completion
- Isolated test database to prevent conflicts

### Production
- Persistent volumes for data durability
- Connection pool tuning based on load
- Regular backups (implement separately)

## Security

### Development
- Default credentials are used for convenience
- Database is exposed on localhost only

### Production
- ⚠️ **Change default credentials** in production
- Use strong passwords
- Consider using secrets management (e.g., Docker secrets, Vault)
- Implement SSL/TLS for database connections
- Regular security updates

## Next Steps

1. ✅ PostgreSQL integrated with Docker
2. ✅ Test infrastructure set up
3. ✅ Database models defined
4. ⏭️ Consider adding Alembic for migrations
5. ⏭️ Implement database backups
6. ⏭️ Add database monitoring/metrics
7. ⏭️ Set up production secrets management

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQLAlchemy Async Documentation](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [asyncpg Documentation](https://magicstack.github.io/asyncpg/)
- [Docker PostgreSQL Image](https://hub.docker.com/_/postgres)
