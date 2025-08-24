#!/bin/bash

echo "🏋️‍♂️ FitnessPro Ukrainian Fitness Platform - Quick Deploy Script"
echo "================================================================="

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

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."

    if ! command -v bun &> /dev/null; then
        print_error "Bun is not installed. Please install it first."
        exit 1
    fi

    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install it first."
        exit 1
    fi

    print_success "All requirements satisfied!"
}

# Install dependencies and build projects
build_projects() {
    print_status "Installing dependencies and building projects..."

    # Backend
    print_status "Building backend..."
    cd fitness-trainer-saas/backend
    bun install
    bunx prisma generate
    bun run build

    if [ $? -eq 0 ]; then
        print_success "Backend built successfully!"
    else
        print_error "Backend build failed!"
        exit 1
    fi

    cd ../..

    # Frontend
    print_status "Building frontend..."
    cd fitness-trainer-frontend
    bun install
    bun run build

    if [ $? -eq 0 ]; then
        print_success "Frontend built successfully!"
    else
        print_error "Frontend build failed!"
        exit 1
    fi

    cd ..
}

# Create deployment packages
create_deployment_packages() {
    print_status "Creating deployment packages..."

    # Create output directory
    mkdir -p deployment-packages

    # Backend package
    print_status "Packaging backend..."
    cd fitness-trainer-saas/backend
    tar -czf ../../deployment-packages/fitnesspro-backend.tar.gz \
        --exclude='node_modules' \
        --exclude='.env' \
        --exclude='*.db' \
        --exclude='dist' \
        .
    cd ../..

    # Frontend package
    print_status "Packaging frontend..."
    cd fitness-trainer-frontend
    tar -czf ../deployment-packages/fitnesspro-frontend.tar.gz \
        --exclude='node_modules' \
        --exclude='.next' \
        .
    cd ..

    print_success "Deployment packages created in ./deployment-packages/"
}

# Generate deployment instructions
generate_instructions() {
    print_status "Generating deployment instructions..."

    cat > deployment-packages/DEPLOY_INSTRUCTIONS.md << 'EOF'
# FitnessPro Deployment Instructions

## Quick Deployment URLs

### Railway (Backend)
1. Go to: https://railway.app/new
2. Select "Deploy from GitHub repo"
3. Upload the `fitnesspro-backend.tar.gz` file
4. Set environment variables from the guide
5. Add PostgreSQL database

### Netlify (Frontend)
1. Go to: https://app.netlify.com/start
2. Upload the `fitnesspro-frontend.tar.gz` file
3. Set build command: `bun run build`
4. Set environment variables from the guide

## Environment Variables

### Backend (Railway)
```
NODE_ENV=production
PORT=8000
JWT_SECRET=your-super-secure-jwt-secret-here-2024
FRONTEND_URL=https://your-netlify-url.netlify.app
CORS_ORIGIN=https://your-netlify-url.netlify.app
DEFAULT_CURRENCY=UAH
LIQPAY_PUBLIC_KEY=sandbox_i74424594321
LIQPAY_PRIVATE_KEY=sandbox_demoPrivateKey2024
LIQPAY_SANDBOX=true
```

### Frontend (Netlify)
```
NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app/api
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_DEFAULT_CURRENCY=UAH
NEXT_PUBLIC_DEFAULT_LOCALE=uk-UA
NEXT_PUBLIC_LIQPAY_PUBLIC_KEY=sandbox_i74424594321
NEXT_PUBLIC_LIQPAY_SANDBOX=true
```

## Test Accounts
- Trainer: john.trainer@fitnesspro.com / password123
- Client: alice.client@fitnesspro.com / password123
- Admin: admin@fitnesspro.com / admin123

## Ukrainian Payment Plans
- Basic: ₴499/month
- Pro: ₴1,299/month
- Premium: ₴2,499/month

EOF

    print_success "Instructions generated in deployment-packages/DEPLOY_INSTRUCTIONS.md"
}

# Main deployment flow
main() {
    print_status "Starting FitnessPro deployment preparation..."

    check_requirements
    build_projects
    create_deployment_packages
    generate_instructions

    echo ""
    echo "🎉 Deployment preparation complete!"
    echo ""
    echo "Next steps:"
    echo "1. Upload packages to Railway and Netlify"
    echo "2. Configure environment variables"
    echo "3. Set up PostgreSQL database"
    echo "4. Test the deployed application"
    echo ""
    echo "📦 Packages location: ./deployment-packages/"
    echo "📋 Full guide: ./PRODUCTION_DEPLOYMENT_GUIDE.md"
    echo ""
    echo "🇺🇦 Слава Україні! Good luck with your fitness platform!"
}

# Run main function
main
