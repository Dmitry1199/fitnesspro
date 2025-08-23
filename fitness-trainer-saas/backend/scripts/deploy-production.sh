#!/bin/bash

# FitnessPro Production Deployment Script
# This script handles the complete production deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_PLATFORM=${1:-"railway"} # Default to Railway
DATABASE_BACKUP=${2:-"true"}
RUN_TESTS=${3:-"true"}

print_header() {
    echo -e "${PURPLE}"
    echo "=================================="
    echo "🚀 FitnessPro Production Deploy"
    echo "=================================="
    echo -e "${NC}"
}

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

check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check if we're in the right directory
    if [[ ! -f "package.json" ]]; then
        print_error "Please run this script from the backend directory"
        exit 1
    fi

    # Check required tools
    local required_tools=("bun" "git" "docker")
    for tool in "${required_tools[@]}"; do
        if ! command -v $tool &> /dev/null; then
            print_error "$tool is required but not installed"
            exit 1
        fi
    done

    # Check environment variables
    if [[ -z "$DATABASE_URL" ]]; then
        print_error "DATABASE_URL environment variable is required"
        exit 1
    fi

    if [[ -z "$JWT_SECRET" ]]; then
        print_error "JWT_SECRET environment variable is required"
        exit 1
    fi

    print_success "Prerequisites check passed"
}

backup_database() {
    if [[ "$DATABASE_BACKUP" == "true" ]]; then
        print_status "Creating database backup..."

        local backup_filename="backup_$(date +%Y%m%d_%H%M%S).sql"

        if command -v pg_dump &> /dev/null; then
            pg_dump "$DATABASE_URL" > "backups/$backup_filename"
            print_success "Database backup created: $backup_filename"
        else
            print_warning "pg_dump not available, skipping database backup"
        fi
    fi
}

run_tests() {
    if [[ "$RUN_TESTS" == "true" ]]; then
        print_status "Running tests..."

        # Install dependencies
        bun install --frozen-lockfile

        # Generate Prisma client
        bunx prisma generate

        # Run tests
        if bun test; then
            print_success "All tests passed"
        else
            print_error "Tests failed"
            exit 1
        fi

        # Run linting
        if bun run lint; then
            print_success "Linting passed"
        else
            print_error "Linting failed"
            exit 1
        fi
    fi
}

build_application() {
    print_status "Building application..."

    # Clean previous build
    rm -rf dist

    # Install production dependencies
    bun install --frozen-lockfile --production=false

    # Generate Prisma client
    bunx prisma generate

    # Build application
    if bun run build; then
        print_success "Application built successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

run_migrations() {
    print_status "Running database migrations..."

    # Check database connection
    if bunx prisma db pull > /dev/null 2>&1; then
        print_success "Database connection successful"
    else
        print_error "Cannot connect to database"
        exit 1
    fi

    # Run migrations
    if bunx prisma migrate deploy; then
        print_success "Database migrations completed"
    else
        print_error "Database migrations failed"
        exit 1
    fi

    # Seed database if needed
    if [[ "$SEED_DATABASE" == "true" ]]; then
        print_status "Seeding database..."
        if bun run db:seed; then
            print_success "Database seeded successfully"
        else
            print_warning "Database seeding failed (continuing anyway)"
        fi
    fi
}

build_docker_image() {
    print_status "Building Docker image..."

    local image_tag="fitness-pro-backend:$(git rev-parse --short HEAD)"

    if docker build -f docker-production.txt -t "$image_tag" .; then
        print_success "Docker image built: $image_tag"
        echo "$image_tag" > .docker-image-tag
    else
        print_error "Docker build failed"
        exit 1
    fi
}

deploy_to_railway() {
    print_status "Deploying to Railway..."

    if command -v railway &> /dev/null; then
        if railway up; then
            print_success "Deployed to Railway successfully"
        else
            print_error "Railway deployment failed"
            exit 1
        fi
    else
        print_error "Railway CLI not found. Install it first: npm install -g @railway/cli"
        exit 1
    fi
}

deploy_to_render() {
    print_status "Deploying to Render..."

    if command -v render &> /dev/null; then
        if render deploy; then
            print_success "Deployed to Render successfully"
        else
            print_error "Render deployment failed"
            exit 1
        fi
    else
        print_warning "Render CLI not found. Using webhook deployment..."

        if [[ -n "$RENDER_DEPLOY_HOOK" ]]; then
            curl -X POST "$RENDER_DEPLOY_HOOK"
            print_success "Triggered Render deployment via webhook"
        else
            print_error "RENDER_DEPLOY_HOOK environment variable not set"
            exit 1
        fi
    fi
}

deploy_to_netlify() {
    print_status "Deploying to Netlify..."

    if command -v netlify &> /dev/null; then
        # Build for serverless
        bun run build

        if netlify deploy --prod; then
            print_success "Deployed to Netlify successfully"
        else
            print_error "Netlify deployment failed"
            exit 1
        fi
    else
        print_error "Netlify CLI not found. Install it first: npm install -g netlify-cli"
        exit 1
    fi
}

deploy_to_aws() {
    print_status "Deploying to AWS..."

    if command -v aws &> /dev/null; then
        # Deploy using AWS CLI or CDK
        print_warning "AWS deployment requires additional setup. Please configure CDK or CloudFormation templates."
    else
        print_error "AWS CLI not found"
        exit 1
    fi
}

run_health_checks() {
    print_status "Running health checks..."

    # Wait for deployment to complete
    sleep 30

    local health_endpoints=(
        "https://your-app.railway.app/api/health"
        "https://your-app.onrender.com/api/health"
        "https://your-app.netlify.app/api/health"
    )

    for endpoint in "${health_endpoints[@]}"; do
        print_status "Checking $endpoint"

        if curl -f -s "$endpoint" > /dev/null; then
            print_success "✅ $endpoint is healthy"
        else
            print_warning "⚠️  $endpoint is not responding"
        fi
    done
}

send_notifications() {
    print_status "Sending deployment notifications..."

    local commit_hash=$(git rev-parse --short HEAD)
    local commit_message=$(git log -1 --pretty=%B)
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Slack notification
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 FitnessPro Backend Deployed\n*Platform:* $DEPLOYMENT_PLATFORM\n*Commit:* $commit_hash\n*Message:* $commit_message\n*Time:* $timestamp\"}" \
            "$SLACK_WEBHOOK_URL"
        print_success "Slack notification sent"
    fi

    # Discord notification
    if [[ -n "$DISCORD_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"content\":\"🚀 **FitnessPro Backend Deployed**\n**Platform:** $DEPLOYMENT_PLATFORM\n**Commit:** $commit_hash\n**Message:** $commit_message\n**Time:** $timestamp\"}" \
            "$DISCORD_WEBHOOK_URL"
        print_success "Discord notification sent"
    fi
}

main() {
    print_header

    print_status "Starting deployment to $DEPLOYMENT_PLATFORM..."

    # Create necessary directories
    mkdir -p backups logs

    # Deployment steps
    check_prerequisites
    backup_database
    run_tests
    build_application
    run_migrations

    # Platform-specific deployment
    case $DEPLOYMENT_PLATFORM in
        "railway")
            deploy_to_railway
            ;;
        "render")
            deploy_to_render
            ;;
        "netlify")
            deploy_to_netlify
            ;;
        "aws")
            deploy_to_aws
            ;;
        "docker")
            build_docker_image
            ;;
        *)
            print_error "Unknown deployment platform: $DEPLOYMENT_PLATFORM"
            print_status "Supported platforms: railway, render, netlify, aws, docker"
            exit 1
            ;;
    esac

    run_health_checks
    send_notifications

    print_success "🎉 Deployment completed successfully!"
    print_status "Platform: $DEPLOYMENT_PLATFORM"
    print_status "Commit: $(git rev-parse --short HEAD)"
    print_status "Time: $(date '+%Y-%m-%d %H:%M:%S')"

    echo ""
    echo -e "${GREEN}🌐 Your API endpoints:${NC}"
    echo "   Health Check: https://your-domain.com/api/health"
    echo "   API Docs: https://your-domain.com/api/docs"
    echo "   WebSocket: wss://your-domain.com/chat"
    echo ""
}

# Handle script arguments
case $1 in
    "--help"|"-h")
        echo "Usage: $0 [PLATFORM] [BACKUP] [TESTS]"
        echo ""
        echo "PLATFORM: railway, render, netlify, aws, docker (default: railway)"
        echo "BACKUP: true/false (default: true)"
        echo "TESTS: true/false (default: true)"
        echo ""
        echo "Examples:"
        echo "  $0 railway true true    # Deploy to Railway with backup and tests"
        echo "  $0 render false false   # Deploy to Render without backup or tests"
        echo "  $0 docker               # Build Docker image only"
        exit 0
        ;;
    *)
        main
        ;;
esac
