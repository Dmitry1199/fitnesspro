#!/bin/bash

# FitnessPro Database Setup Script
# This script sets up the complete Messages system with PostgreSQL

set -e

echo "🚀 Starting FitnessPro Database Setup..."
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is available
check_docker() {
    print_status "Checking Docker availability..."
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        print_success "Docker and Docker Compose are available"
        return 0
    elif command -v docker &> /dev/null; then
        print_warning "Docker is available but docker-compose not found. Trying 'docker compose'..."
        if docker compose version &> /dev/null; then
            print_success "Docker Compose (v2) is available"
            DOCKER_COMPOSE_CMD="docker compose"
            return 0
        fi
    fi
    print_error "Docker not available. Please install Docker to continue."
    return 1
}

# Start PostgreSQL and Redis containers
start_database() {
    print_status "Starting PostgreSQL and Redis containers..."

    if check_docker; then
        ${DOCKER_COMPOSE_CMD:-docker-compose} up -d postgres redis

        print_status "Waiting for PostgreSQL to be ready..."
        sleep 10

        # Test database connection
        if ${DOCKER_COMPOSE_CMD:-docker-compose} exec -T postgres pg_isready -U fitness_user -d fitness_pro_db; then
            print_success "PostgreSQL is ready and accepting connections"
        else
            print_error "PostgreSQL is not responding"
            return 1
        fi
    else
        print_warning "Skipping Docker setup - Docker not available"
        print_status "Please ensure PostgreSQL is running on localhost:5432"
        print_status "Database: fitness_pro_db"
        print_status "User: fitness_user"
        print_status "Password: fitness_password"
    fi
}

# Generate Prisma client
generate_client() {
    print_status "Generating Prisma client..."
    if bun run db:generate; then
        print_success "Prisma client generated successfully"
    else
        print_error "Failed to generate Prisma client"
        return 1
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    if bun run db:migrate; then
        print_success "Database migrations completed successfully"
    else
        print_error "Database migrations failed"
        return 1
    fi
}

# Seed the database
seed_database() {
    print_status "Seeding database with test data..."
    if bun run db:seed; then
        print_success "Database seeded successfully"
    else
        print_error "Database seeding failed"
        return 1
    fi
}

# Test backend server
test_backend() {
    print_status "Testing backend server connection..."

    # Start the server in background
    bun run start:dev &
    SERVER_PID=$!

    # Wait for server to start
    sleep 15

    # Test health endpoint
    if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
        print_success "Backend server is responding"

        # Test Swagger docs
        if curl -f http://localhost:8000/api/docs > /dev/null 2>&1; then
            print_success "Swagger documentation is available"
        else
            print_warning "Swagger documentation not accessible"
        fi
    else
        print_error "Backend server is not responding"
        kill $SERVER_PID 2>/dev/null || true
        return 1
    fi

    # Stop the server
    kill $SERVER_PID 2>/dev/null || true
    print_status "Backend server test completed"
}

# Display connection information
show_connection_info() {
    echo ""
    echo "🎉 Database Setup Completed Successfully!"
    echo "========================================"
    echo ""
    echo "📊 Database Information:"
    echo "  Host: localhost:5432"
    echo "  Database: fitness_pro_db"
    echo "  User: fitness_user"
    echo ""
    echo "🌐 API Endpoints:"
    echo "  Health Check: http://localhost:8000/api/health"
    echo "  Swagger Docs: http://localhost:8000/api/docs"
    echo "  WebSocket: ws://localhost:8000/chat"
    echo ""
    echo "👥 Test Users Created:"
    echo "  - john.trainer@fitnesspro.com (Trainer)"
    echo "  - sarah.trainer@fitnesspro.com (Trainer)"
    echo "  - mike.client@example.com (Client)"
    echo "  - anna.client@example.com (Client)"
    echo "  - admin@fitnesspro.com (Admin)"
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. Start the development server: bun run start:dev"
    echo "  2. Open Swagger UI: http://localhost:8000/api/docs"
    echo "  3. Test WebSocket chat functionality"
    echo "  4. Connect frontend to the API"
    echo ""
}

# Main execution
main() {
    print_status "Starting database setup process..."

    # Check if we're in the right directory
    if [[ ! -f "package.json" ]]; then
        print_error "Please run this script from the backend directory"
        exit 1
    fi

    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        print_status "Installing dependencies..."
        bun install
    fi

    # Execute setup steps
    start_database || exit 1
    generate_client || exit 1
    run_migrations || exit 1
    seed_database || exit 1

    # Optional: Test backend (can be skipped if needed)
    if [[ "${1:-}" != "--skip-test" ]]; then
        test_backend || print_warning "Backend test failed, but database setup is complete"
    fi

    show_connection_info
}

# Run main function
main "$@"
