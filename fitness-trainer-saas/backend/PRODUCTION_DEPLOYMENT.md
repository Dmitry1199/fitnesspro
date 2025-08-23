# 🚀 FitnessPro Backend - Production Deployment Guide

## 📋 Overview

This guide provides comprehensive instructions for deploying the FitnessPro backend to production environments with PostgreSQL database and full monitoring setup.

## ✅ Prerequisites

### Required Tools
- **Bun** (latest version)
- **Docker** and **Docker Compose**
- **Git** for version control
- **PostgreSQL** client tools
- Platform-specific CLI tools:
  - Railway CLI: `npm install -g @railway/cli`
  - Render CLI: `npm install -g @render/cli`
  - Netlify CLI: `npm install -g netlify-cli`
  - AWS CLI: `pip install awscli`

### Environment Variables
Create a secure `.env.production` file with the following variables:

```bash
# Copy and customize the .env.production template
cp .env.production .env.production.local
```

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong secret for JWT tokens
- `REDIS_URL` - Redis connection string
- `FRONTEND_URL` - Your frontend domain
- `SMTP_*` - Email service configuration
- `STRIPE_*` - Payment processing keys

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│   Nginx Proxy   │────│   Backend API   │
│   (CloudFlare)  │    │   (SSL/HTTPS)   │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐              │
                       │   PostgreSQL    │◄─────────────┤
                       │   (Database)    │              │
                       └─────────────────┘              │
                                                        │
                       ┌─────────────────┐              │
                       │     Redis       │◄─────────────┘
                       │   (Caching)     │
                       └─────────────────┘
```

## 🌐 Deployment Platforms

### 1. Railway (Recommended)
**Best for:** Full-stack applications with database

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy to production
./scripts/deploy-production.sh railway
```

**Features:**
- ✅ Automatic PostgreSQL setup
- ✅ Redis caching included
- ✅ Environment variables management
- ✅ Automatic SSL certificates
- ✅ Built-in monitoring

### 2. Render
**Best for:** Professional applications with managed databases

```bash
# Deploy using automated script
./scripts/deploy-production.sh render

# Or manual deployment
render deploy --service fitness-pro-backend
```

**Features:**
- ✅ Managed PostgreSQL with automatic backups
- ✅ Redis instances available
- ✅ Auto-deploy from GitHub
- ✅ Custom domains with SSL
- ✅ Health checks and monitoring

### 3. Netlify Functions
**Best for:** Serverless deployment

```bash
# Deploy to Netlify
./scripts/deploy-production.sh netlify
```

**Features:**
- ✅ Serverless functions
- ✅ Automatic CDN distribution
- ✅ Branch deployments
- ✅ Form handling
- ✅ Environment variables

### 4. AWS (Advanced)
**Best for:** Enterprise applications with custom requirements

```bash
# Deploy to AWS
./scripts/deploy-production.sh aws
```

**Includes:**
- ECS/Fargate for container hosting
- RDS for PostgreSQL database
- ElastiCache for Redis
- CloudFront for CDN
- Route 53 for DNS

## 📦 Docker Deployment

### Build Production Image
```bash
# Build optimized production image
docker build -f docker-production.txt -t fitness-pro-backend:latest .

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Configuration
```bash
# Set required environment variables
export DATABASE_URL="postgresql://user:pass@localhost:5432/fitness_pro_production"
export JWT_SECRET="your-super-secure-secret"
export REDIS_URL="redis://localhost:6379"
```

## 🗄️ Database Setup

### 1. PostgreSQL Configuration
```sql
-- Create production database
CREATE DATABASE fitness_pro_production;
CREATE USER fitness_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE fitness_pro_production TO fitness_user;

-- Enable required extensions
\c fitness_pro_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### 2. Run Migrations
```bash
# Generate Prisma client
bunx prisma generate

# Deploy database schema
bunx prisma migrate deploy

# Seed production data (optional)
bun run db:seed
```

### 3. Database Monitoring
```bash
# Check database health
bunx prisma db pull

# Monitor active connections
SELECT COUNT(*) FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size('fitness_pro_production'));
```

## 🚀 Automated Deployment

### Using GitHub Actions
The repository includes a complete CI/CD pipeline:

```yaml
# .github/workflows/deploy-production.yml
# Automatically deploys on push to main branch
```

**Pipeline Steps:**
1. ✅ Run tests and linting
2. ✅ Build Docker image
3. ✅ Deploy to multiple platforms
4. ✅ Run health checks
5. ✅ Send notifications

### Manual Deployment Script
```bash
# Full deployment with all checks
./scripts/deploy-production.sh railway true true

# Quick deployment without tests
./scripts/deploy-production.sh railway false false

# Docker build only
./scripts/deploy-production.sh docker
```

## 📊 Monitoring & Observability

### Health Checks
```bash
# API health
curl https://your-domain.com/api/health

# Database health
curl https://your-domain.com/api/health/db

# Redis health
curl https://your-domain.com/api/health/redis
```

### Prometheus Metrics
Access metrics at: `https://your-domain.com/api/metrics`

**Key Metrics:**
- Request rate and response times
- WebSocket connections
- Database query performance
- Memory and CPU usage
- Business metrics (messages sent, active users)

### Grafana Dashboard
Import the provided dashboard: `monitoring/grafana/dashboards/fitness-pro-overview.json`

**Monitoring URLs:**
- Prometheus: `https://your-domain.com:9090`
- Grafana: `https://your-domain.com:3001`

## 🔒 Security Configuration

### SSL/TLS Setup
```bash
# Using Let's Encrypt with Certbot
certbot --nginx -d your-domain.com -d api.your-domain.com

# Or use CloudFlare for automatic SSL
```

### Security Headers
The Nginx configuration includes:
- HSTS headers
- Content Security Policy
- XSS protection
- Frame options
- CORS configuration

### Rate Limiting
```bash
# API endpoints: 10 requests/second
# Auth endpoints: 5 requests/second
# Configured in nginx.conf
```

## 🔄 Backup & Recovery

### Database Backups
```bash
# Automated daily backups (configured in production)
0 2 * * * pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Manual backup
./scripts/backup-database.sh

# Restore from backup
psql $DATABASE_URL < backup_20241123.sql
```

### File Storage Backups
```bash
# Backup uploaded files
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Sync to cloud storage
aws s3 sync uploads/ s3://your-backup-bucket/uploads/
```

## 🚨 Troubleshooting

### Common Issues

**Database Connection Issues:**
```bash
# Check database connectivity
pg_isready -h localhost -p 5432 -U fitness_user

# Verify connection string
echo $DATABASE_URL
```

**Memory Issues:**
```bash
# Check memory usage
docker stats

# Restart services
docker-compose restart backend
```

**SSL Certificate Issues:**
```bash
# Renew Let's Encrypt certificates
certbot renew

# Check certificate expiry
openssl x509 -in cert.pem -text -noout | grep "Not After"
```

### Performance Optimization

**Database Optimization:**
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM messages WHERE chat_room_id = $1;

-- Update table statistics
ANALYZE messages;

-- Reindex tables
REINDEX TABLE messages;
```

**Redis Optimization:**
```bash
# Check Redis memory usage
redis-cli info memory

# Clear cache if needed
redis-cli flushdb
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancer for multiple backend instances
- Database read replicas for read-heavy workloads
- Redis cluster for high availability

### Vertical Scaling
- Monitor CPU and memory usage
- Increase container resources as needed
- Database connection pooling optimization

## 🔔 Notifications & Alerts

### Slack Integration
```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

### Discord Integration
```bash
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

### Email Alerts
Configure SMTP settings for critical alerts:
- Database connection failures
- High error rates
- Performance degradation

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] SSL certificates ready
- [ ] Database backups created
- [ ] Tests passing
- [ ] Performance baselines established

### During Deployment
- [ ] Health checks passing
- [ ] Database migrations successful
- [ ] WebSocket connections working
- [ ] File uploads functional
- [ ] Monitoring active

### Post-Deployment
- [ ] Smoke tests completed
- [ ] Performance metrics stable
- [ ] Error rates normal
- [ ] User notifications sent
- [ ] Documentation updated

## 🆘 Emergency Procedures

### Rollback Process
```bash
# Quick rollback to previous version
git revert HEAD
./scripts/deploy-production.sh railway

# Database rollback (if needed)
bunx prisma migrate reset
```

### Service Recovery
```bash
# Restart all services
docker-compose restart

# Check service logs
docker-compose logs -f backend

# Scale services
docker-compose up --scale backend=3
```

## 📞 Support Contacts

**Technical Issues:**
- DevOps Team: devops@fitnesspro.com
- Database Issues: dba@fitnesspro.com
- Security Concerns: security@fitnesspro.com

**Emergency Hotline:** +1-555-SUPPORT

---

## 🎉 Success!

After successful deployment, your FitnessPro backend will be available at:

- **API Base URL:** `https://api.your-domain.com`
- **Health Check:** `https://api.your-domain.com/api/health`
- **API Documentation:** `https://api.your-domain.com/api/docs`
- **WebSocket Endpoint:** `wss://api.your-domain.com/chat`

**Next Steps:**
1. Configure your frontend to use the production API
2. Set up monitoring alerts
3. Schedule regular backups
4. Plan for future scaling needs

🚀 **Your FitnessPro SaaS platform is now live in production!**
