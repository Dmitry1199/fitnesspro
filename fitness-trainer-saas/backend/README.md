# FitnessPro Backend API 🏋️‍♂️

## Overview

The FitnessPro backend is a comprehensive NestJS application designed for fitness trainers and clients, featuring user management, workout planning, and session scheduling capabilities.

## 🚀 Features

### ✅ Completed Modules

- **User Management** - Authentication and profile management
  - JWT-based authentication with Passport
  - Role-based access control (Admin, Trainer, Client)
  - User profiles with fitness-specific fields
  - Password hashing with bcrypt

- **Fitness Platform Core** - Essential fitness business logic
  - Trainer and client management
  - User roles and permissions
  - Profile management with fitness goals
  - Experience level tracking

- **Database Integration**
  - PostgreSQL with Prisma ORM
  - User-focused database schema
  - Migrations and seeding
  - Type-safe database operations

## 🛠️ Tech Stack

- **Framework:** NestJS
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT + Passport
- **Validation:** class-validator
- **Documentation:** Swagger/OpenAPI
- **Runtime:** Bun
- **Containerization:** Docker & Docker Compose

## 📦 Installation

### Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [Docker](https://docker.com/) (for database)
- [Node.js](https://nodejs.org/) (v18+ as fallback)

### Quick Start

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Start database with Docker:**
   ```bash
   docker-compose up -d postgres
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations:**
   ```bash
   bun run db:migrate
   ```

5. **Seed the database:**
   ```bash
   bun run db:seed
   ```

6. **Start the development server:**
   ```bash
   bun run start:dev
   ```

The API will be available at `http://localhost:8000`

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI:** `http://localhost:8000/api/docs`
- **Health Check:** `http://localhost:8000/api/health`

## 🗄️ Database Schema

### Core Entities
- **User** - Authentication and profile data with fitness-specific fields
  - Basic info (name, email, phone)
  - Fitness data (goals, experience level, preferences)
  - Address and personal information

### Available Scripts

```bash
# Development
bun run start:dev        # Start with hot reload
bun run start:debug     # Start in debug mode

# Production
bun run build           # Build for production
bun run start:prod      # Start production server

# Database
bun run db:migrate      # Run migrations
bun run db:generate     # Generate Prisma client
bun run db:seed         # Seed database
bun run db:reset        # Reset database
bun run db:studio       # Open Prisma Studio

# Code Quality
bun run lint            # Lint code
bun run format          # Format code
bun run test            # Run tests
```

## 🐳 Docker Development

### Start all services:
```bash
docker-compose up -d
```

### View logs:
```bash
docker-compose logs -f backend
```

### Stop services:
```bash
docker-compose down
```

## 🧪 Testing

### Test Users
The seed script creates test users with different roles:

- **Trainer:** john.trainer@fitnesspro.com
- **Trainer:** sarah.trainer@fitnesspro.com
- **Client:** mike.client@example.com
- **Client:** anna.client@example.com
- **Admin:** admin@fitnesspro.com

### API Testing
Use the Swagger UI at `/api/docs` to test endpoints interactively.

## 🔧 Configuration

### Environment Variables

```env
# Server
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://fitness_user:fitness_password@localhost:5432/fitness_pro_db"

# Authentication
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

## 🚧 Roadmap

### Next Features
- [ ] Workout management module
- [ ] Session scheduling system
- [ ] Progress tracking
- [ ] Trainer-client relationships
- [ ] Payment integration (Stripe, LiqPay)
- [ ] Notification system (email-based)
- [ ] Analytics and reporting

## 🏗️ Project Structure

```
src/
├── app.module.ts           # Main application module
├── main.ts                 # Application bootstrap
├── auth/                   # Authentication
│   └── guards/            # Auth guards
├── prisma/                 # Database layer
│   ├── prisma.service.ts  # Prisma client
│   └── prisma.module.ts   # Database module
└── ...                     # Other modules
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Run linting and formatting
6. Submit a pull request

## 📄 License

This project is private and proprietary.

---

**Built with ❤️ for the fitness community**
