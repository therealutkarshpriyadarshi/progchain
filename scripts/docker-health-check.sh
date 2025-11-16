#!/bin/bash

# Docker Health Check Script for ProgChain
# This script checks if Docker services are running correctly

set -e

echo "🔍 ProgChain Docker Health Check"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2

    echo -n "Checking $service_name (port $port)... "

    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port" | grep -q "200\|404\|307"; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Not responding${NC}"
        return 1
    fi
}

# Function to check container status
check_container() {
    local container_pattern=$1
    local friendly_name=$2

    echo -n "Checking $friendly_name container... "

    if docker ps --format '{{.Names}}' | grep -q "$container_pattern"; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Not running${NC}"
        return 1
    fi
}

# Check if Docker is running
echo -n "Checking Docker daemon... "
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo ""
    echo "Please start Docker and try again."
    exit 1
fi

echo ""

# Detect which compose file is being used
COMPOSE_FILE=""
if docker ps --format '{{.Names}}' | grep -q "progchain.*dev"; then
    COMPOSE_FILE="compose.dev.yaml"
    echo "Detected: Development environment"
elif docker ps --format '{{.Names}}' | grep -q "progchain"; then
    COMPOSE_FILE="compose.yml"
    echo "Detected: Production environment"
else
    echo -e "${YELLOW}No ProgChain containers detected${NC}"
    echo ""
    echo "To start the application, run:"
    echo "  Development: docker-compose -f compose.dev.yaml up"
    echo "  Production:  docker-compose -f compose.yml up"
    exit 1
fi

echo ""

# Check containers
echo "Container Status:"
echo "-----------------"
check_container "server" "Server"
check_container "client" "Client"

echo ""

# Check services
echo "Service Health:"
echo "---------------"

# Wait a moment for services to be ready
sleep 2

# Check backend
if check_service "Backend API" "8000"; then
    # Try to get API docs
    echo -n "  API Docs (/docs)... "
    if curl -s "http://localhost:8000/docs" > /dev/null; then
        echo -e "${GREEN}✓ Available${NC}"
    else
        echo -e "${YELLOW}⚠ Not available (might be disabled in production)${NC}"
    fi
fi

# Check frontend
if [ "$COMPOSE_FILE" == "compose.dev.yaml" ]; then
    check_service "Frontend (Dev)" "5173"
else
    check_service "Frontend (Prod)" "80"
fi

echo ""

# Check environment configuration
echo "Configuration Check:"
echo "--------------------"

# Check if .env files exist
echo -n "Server .env file... "
if [ -f "server/.env" ]; then
    echo -e "${GREEN}✓ Exists${NC}"

    # Check for OpenAI API key
    echo -n "  OpenAI API Key... "
    if grep -q "OPENAI_API_KEY=sk-" "server/.env"; then
        echo -e "${GREEN}✓ Configured${NC}"
    elif grep -q "OPENAI_API_KEY=your_openai_api_key_here" "server/.env"; then
        echo -e "${RED}✗ Using placeholder${NC}"
        echo -e "${YELLOW}    Warning: Please set your actual OpenAI API key in server/.env${NC}"
    else
        echo -e "${YELLOW}⚠ Check configuration${NC}"
    fi
else
    echo -e "${RED}✗ Missing${NC}"
    echo -e "${YELLOW}    Create from server/.env.example${NC}"
fi

echo -n "Client .env file... "
if [ -f "client/.env" ]; then
    echo -e "${GREEN}✓ Exists${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
    echo -e "${YELLOW}    Create from client/.env.example${NC}"
fi

echo ""

# Show recent logs
echo "Recent Logs:"
echo "------------"
echo "Server logs (last 5 lines):"
docker-compose -f "$COMPOSE_FILE" logs --tail=5 server 2>/dev/null || echo "  No logs available"

echo ""
echo "Client logs (last 5 lines):"
docker-compose -f "$COMPOSE_FILE" logs --tail=5 client 2>/dev/null || echo "  No logs available"

echo ""
echo "=================================="
echo "✅ Health check complete!"
echo ""

# Final summary
if [ "$COMPOSE_FILE" == "compose.dev.yaml" ]; then
    echo "🌐 Access your application:"
    echo "  Frontend: http://localhost:5173"
    echo "  Backend:  http://localhost:8000"
    echo "  API Docs: http://localhost:8000/docs"
else
    echo "🌐 Access your application:"
    echo "  Frontend: http://localhost"
    echo "  Backend:  http://localhost:8000"
fi

echo ""
echo "📝 Useful commands:"
echo "  View logs:    docker-compose -f $COMPOSE_FILE logs -f"
echo "  Restart:      docker-compose -f $COMPOSE_FILE restart"
echo "  Stop:         docker-compose -f $COMPOSE_FILE down"
echo ""
