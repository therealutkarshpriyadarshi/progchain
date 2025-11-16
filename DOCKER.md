# Docker Setup Guide for ProgChain

This guide explains how to run ProgChain using Docker for both development and production environments.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- OpenAI API key (required for AI features)

## Quick Start

### 1. Configure Environment Variables

**IMPORTANT:** Before running Docker, you need to set your OpenAI API key:

```bash
# Edit the server/.env file
nano server/.env

# Replace 'your_openai_api_key_here' with your actual OpenAI API key
OPENAI_API_KEY=sk-your-actual-key-here
```

The `.env` files have already been created for you in:
- `server/.env` - Backend environment variables
- `client/.env` - Frontend environment variables

### 2. Development Environment

To run the application in development mode with hot-reloading:

```bash
# Start all services
docker-compose -f compose.dev.yaml up

# Or run in detached mode (background)
docker-compose -f compose.dev.yaml up -d

# View logs
docker-compose -f compose.dev.yaml logs -f

# Stop services
docker-compose -f compose.dev.yaml down
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### 3. Production Environment

To run the application in production mode:

```bash
# Build and start services
docker-compose -f compose.yml up -d

# View logs
docker-compose -f compose.yml logs -f

# Stop services
docker-compose -f compose.yml down
```

**Access the application:**
- Frontend: http://localhost (port 80)
- Backend API: http://localhost:8000

## Container Architecture

### Development Setup (`compose.dev.yaml`)

```
┌─────────────────────────────────────┐
│         app-network (bridge)         │
│                                      │
│  ┌──────────┐       ┌──────────┐   │
│  │  Server  │       │  Client  │   │
│  │  :8000   │◄──────│  :5173   │   │
│  │          │       │          │   │
│  │ FastAPI  │       │  Vite    │   │
│  │ (reload) │       │ (reload) │   │
│  └──────────┘       └──────────┘   │
│      ▲                              │
│      │                              │
│  Volume Mount                       │
│  (./server:/app)                    │
└─────────────────────────────────────┘
```

**Features:**
- Hot-reloading for both frontend and backend
- Source code mounted as volumes for live changes
- Development dependencies included
- Debug mode enabled

### Production Setup (`compose.yml`)

```
┌─────────────────────────────────────┐
│         app-network (bridge)         │
│                                      │
│  ┌──────────┐       ┌──────────┐   │
│  │  Server  │       │  Client  │   │
│  │  :8000   │◄──────│   :80    │   │
│  │          │       │          │   │
│  │ FastAPI  │       │  Nginx   │   │
│  │ (uvicorn)│       │(optimized)   │
│  └──────────┘       └──────────┘   │
│                                      │
└─────────────────────────────────────┘
```

**Features:**
- Optimized builds with multi-stage Dockerfiles
- Nginx reverse proxy for frontend
- Production dependencies only
- Auto-restart on failure

## Environment Configuration

### Server Environment Variables (`server/.env`)

Key variables you should configure:

```bash
# Required - Your OpenAI API key
OPENAI_API_KEY=sk-your-actual-key-here

# Database (default uses SQLite)
DATABASE_URL=sqlite+aiosqlite:///./progchain.db

# Server Configuration
ENVIRONMENT=development  # or 'production'
DEBUG=true              # set to false in production
LOG_LEVEL=INFO

# Security (change in production!)
SECRET_KEY=development-secret-key-change-in-production
```

### Client Environment Variables (`client/.env`)

```bash
# API endpoint
VITE_API_URL=http://localhost:8000

# Development settings
VITE_ENABLE_DEBUG=true
```

## Common Commands

### View Running Containers

```bash
docker ps
```

### View Container Logs

```bash
# All services
docker-compose -f compose.dev.yaml logs

# Specific service
docker-compose -f compose.dev.yaml logs server
docker-compose -f compose.dev.yaml logs client

# Follow logs in real-time
docker-compose -f compose.dev.yaml logs -f server
```

### Rebuild Containers

After changing Dockerfiles or dependencies:

```bash
# Development
docker-compose -f compose.dev.yaml up --build

# Production
docker-compose -f compose.yml up --build
```

### Stop and Remove Everything

```bash
# Stop and remove containers
docker-compose -f compose.dev.yaml down

# Stop, remove containers, and remove volumes
docker-compose -f compose.dev.yaml down -v

# Remove all images as well
docker-compose -f compose.dev.yaml down --rmi all
```

### Execute Commands Inside Containers

```bash
# Access server shell
docker-compose -f compose.dev.yaml exec server sh

# Access client shell
docker-compose -f compose.dev.yaml exec client sh

# Run Python commands in server
docker-compose -f compose.dev.yaml exec server poetry run python -c "print('Hello')"
```

### Database Management

```bash
# Access the database file (SQLite)
docker-compose -f compose.dev.yaml exec server ls -la progchain.db

# Create a backup
docker-compose -f compose.dev.yaml exec server cp progchain.db progchain.db.backup
```

## Troubleshooting

### Issue: "Port already in use"

**Problem:** Cannot start containers because ports 5173 or 8000 are already in use.

**Solution:**
```bash
# Find process using the port
lsof -i :5173
lsof -i :8000

# Kill the process or change the port in docker-compose
```

### Issue: "OPENAI_API_KEY not found"

**Problem:** Backend fails to start or AI features don't work.

**Solution:**
1. Edit `server/.env`
2. Set `OPENAI_API_KEY=sk-your-actual-key-here`
3. Restart the containers:
   ```bash
   docker-compose -f compose.dev.yaml restart server
   ```

### Issue: "Cannot connect to backend"

**Problem:** Frontend can't reach the backend API.

**Solution:**
1. Check if server is running: `docker-compose -f compose.dev.yaml ps`
2. Check server logs: `docker-compose -f compose.dev.yaml logs server`
3. Verify `VITE_API_URL` in `client/.env` matches server address
4. Ensure both services are on the same network

### Issue: "Permission denied" errors

**Problem:** Cannot access files or directories inside containers.

**Solution:**
```bash
# Give proper permissions to project directories
chmod -R 755 server client

# Or run with sudo (not recommended for production)
sudo docker-compose -f compose.dev.yaml up
```

### Issue: "Database locked" error

**Problem:** SQLite database is locked.

**Solution:**
```bash
# Stop all containers
docker-compose -f compose.dev.yaml down

# Remove the database (WARNING: This deletes all data!)
rm server/progchain.db

# Start fresh
docker-compose -f compose.dev.yaml up
```

### Issue: Build fails due to dependencies

**Problem:** npm or poetry installation fails.

**Solution:**
```bash
# Clear build cache and rebuild
docker-compose -f compose.dev.yaml build --no-cache

# Or rebuild specific service
docker-compose -f compose.dev.yaml build --no-cache server
```

### View detailed container information

```bash
# Inspect container
docker inspect progchain-server-1

# Check resource usage
docker stats
```

## Development Workflow

### Making Code Changes

1. **Backend changes:**
   - Edit files in `server/` directory
   - Changes auto-reload (via uvicorn --reload)
   - Check logs: `docker-compose -f compose.dev.yaml logs -f server`

2. **Frontend changes:**
   - Edit files in `client/` directory
   - Vite hot-reloads automatically
   - Browser refreshes automatically

### Adding Dependencies

**Backend (Python):**
```bash
# Add dependency to pyproject.toml
docker-compose -f compose.dev.yaml exec server poetry add package-name

# Or rebuild
docker-compose -f compose.dev.yaml build server
```

**Frontend (Node):**
```bash
# Add dependency to package.json
docker-compose -f compose.dev.yaml exec client npm install package-name

# Or rebuild
docker-compose -f compose.dev.yaml build client
```

## Production Deployment Tips

1. **Set proper environment variables:**
   - Set `ENVIRONMENT=production` in `server/.env`
   - Set `DEBUG=false`
   - Use a strong `SECRET_KEY`

2. **Use PostgreSQL instead of SQLite:**
   ```bash
   DATABASE_URL=postgresql+asyncpg://user:password@db:5432/progchain
   ```

3. **Add HTTPS:**
   - Use a reverse proxy like Traefik or nginx
   - Configure SSL certificates

4. **Monitor logs:**
   ```bash
   docker-compose -f compose.yml logs -f
   ```

5. **Backup regularly:**
   - Database backups
   - Environment files backup

## Testing Setup

To run tests:

```bash
# Use the test compose file
docker-compose -f docker-compose.test.yml up

# Run specific tests
docker-compose -f docker-compose.test.yml run test-server pytest /app/tests/test_explore.py
```

## Architecture Summary

- **Server:** Python 3.12 + FastAPI + SQLAlchemy + LangChain
- **Client:** Node 20 + React + Vite (dev) / Nginx (prod)
- **Database:** SQLite (dev) / PostgreSQL (prod recommended)
- **AI:** OpenAI API via LangChain

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Vite Documentation](https://vitejs.dev/)
