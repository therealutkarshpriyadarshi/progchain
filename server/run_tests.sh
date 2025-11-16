#!/bin/bash

# Test Runner Script for Progchain
# This script runs tests using Docker containers with PostgreSQL

set -e  # Exit on error

echo "🧪 Starting Progchain Test Suite with Docker Containers..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if docker compose is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ docker not found. Please install Docker.${NC}"
    exit 1
fi

# Determine docker compose command (v1 or v2)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose.${NC}"
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")/.."

echo -e "${YELLOW}📦 Starting test containers...${NC}"

# Start test containers in detached mode
$DOCKER_COMPOSE -f docker-compose.test.yml up -d test-db test-redis

# Wait for databases to be healthy
echo -e "${YELLOW}⏳ Waiting for databases to be ready...${NC}"
sleep 5

# Check if containers are healthy
for i in {1..30}; do
    if $DOCKER_COMPOSE -f docker-compose.test.yml ps test-db | grep -q "healthy"; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ PostgreSQL failed to start${NC}"
        $DOCKER_COMPOSE -f docker-compose.test.yml logs test-db
        $DOCKER_COMPOSE -f docker-compose.test.yml down
        exit 1
    fi
    sleep 1
done

# Export test environment variables
export TESTING=true
export TEST_DATABASE_URL="postgresql+asyncpg://test_user:test_password@localhost:5433/test_progchain"
export PYTHONPATH="${PWD}/server/src"

echo -e "${YELLOW}🧪 Running tests...${NC}"

# Run tests
cd server
poetry run pytest "$@"

TEST_EXIT_CODE=$?

# Cleanup
echo -e "${YELLOW}🧹 Cleaning up test containers...${NC}"
cd ..
$DOCKER_COMPOSE -f docker-compose.test.yml down -v

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Tests failed with exit code $TEST_EXIT_CODE${NC}"
fi

exit $TEST_EXIT_CODE
