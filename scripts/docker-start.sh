#!/bin/bash

# Docker Start Script for ProgChain
# This script helps you start ProgChain with proper configuration

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 ProgChain Docker Startup${NC}"
echo "=============================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker is not running${NC}"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Check if .env files exist
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}⚠️  server/.env not found${NC}"
    echo "Creating from server/.env.example..."
    cp server/.env.example server/.env
    echo -e "${GREEN}✓ Created server/.env${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit server/.env and set your OpenAI API key!${NC}"
    echo ""
fi

if [ ! -f "client/.env" ]; then
    echo -e "${YELLOW}⚠️  client/.env not found${NC}"
    echo "Creating from client/.env.example..."
    cp client/.env.example client/.env
    echo -e "${GREEN}✓ Created client/.env${NC}"
    echo ""
fi

# Check for OpenAI API key
if grep -q "OPENAI_API_KEY=your_openai_api_key_here" "server/.env"; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  WARNING: OpenAI API Key Not Configured${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Your OpenAI API key is still set to the placeholder value."
    echo "AI features will not work until you configure it."
    echo ""
    echo "To fix this:"
    echo "  1. Edit server/.env"
    echo "  2. Replace 'your_openai_api_key_here' with your actual API key"
    echo "  3. Save the file and restart Docker"
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to exit and configure now..."
    echo ""
fi

# Ask which environment to start
echo "Which environment do you want to start?"
echo "  1) Development (with hot-reload)"
echo "  2) Production (optimized build)"
echo ""
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}Starting Development Environment...${NC}"
        COMPOSE_FILE="compose.dev.yaml"
        ;;
    2)
        echo ""
        echo -e "${GREEN}Starting Production Environment...${NC}"
        COMPOSE_FILE="compose.yml"
        ;;
    *)
        echo "Invalid choice. Defaulting to Development."
        COMPOSE_FILE="compose.dev.yaml"
        ;;
esac

echo ""

# Ask if they want to rebuild
read -p "Rebuild containers? (y/N): " rebuild

if [[ $rebuild =~ ^[Yy]$ ]]; then
    echo ""
    echo "Building containers..."
    docker-compose -f "$COMPOSE_FILE" build
    echo -e "${GREEN}✓ Build complete${NC}"
fi

echo ""
echo "Starting containers..."
echo ""

# Start containers
docker-compose -f "$COMPOSE_FILE" up -d

echo ""
echo -e "${GREEN}✓ Containers started successfully!${NC}"
echo ""

# Wait a moment for services to initialize
echo "Waiting for services to initialize..."
sleep 5

echo ""

# Show status
echo "Container Status:"
docker-compose -f "$COMPOSE_FILE" ps

echo ""
echo "=============================="
echo -e "${GREEN}✅ ProgChain is running!${NC}"
echo ""

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
echo "  View logs:     docker-compose -f $COMPOSE_FILE logs -f"
echo "  Health check:  ./scripts/docker-health-check.sh"
echo "  Stop:          docker-compose -f $COMPOSE_FILE down"
echo ""
echo "💡 Tip: Run './scripts/docker-health-check.sh' to verify everything is working"
echo ""
