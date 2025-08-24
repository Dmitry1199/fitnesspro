# 🏋️‍♂️ FitnessPro Ukrainian Fitness Platform - Production Deployment Guide

## Overview
This guide will help you deploy the complete FitnessPro Ukrainian fitness platform with LiqPay payment integration to production.

## 🎯 Deployment Architecture
- **Backend**: Railway.app (NestJS + PostgreSQL + LiqPay)
- **Frontend**: Netlify (Next.js 15 + Ukrainian localization)
- **Database**: PostgreSQL on Railway
- **Payment**: LiqPay (Ukrainian payment system)
- **Currency**: Ukrainian Hryvnia (UAH)

## 📋 Prerequisites
- Railway account (https://railway.app)
- Netlify account (https://netlify.com)
- GitHub repository with the code
- LiqPay merchant account (for production)

---

## 🚀 STEP 1: Backend Deployment (Railway)

### 1.1 Create Railway Project
1. Go to https://railway.app and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Set root directory to: `fitness-trainer-saas/backend`

### 1.2 Configure Environment Variables
In Railway dashboard, add these environment variables:

```bash
NODE_ENV=production
PORT=8000
JWT_SECRET=your-super-secure-jwt-secret-here-2024
FRONTEND_URL=https://fitnesspro-app.netlify.app
CORS_ORIGIN=https://fitnesspro-app.netlify.app
DEFAULT_CURRENCY=UAH

# LiqPay Configuration (Start with sandbox)
LIQPAY_PUBLIC_KEY=sandbox_i74424594321
LIQPAY_PRIVATE_KEY=sandbox_demoPrivateKey2024
LIQPAY_SANDBOX=true
```

### 1.3 Add PostgreSQL Database
1. In Railway dashboard, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically create DATABASE_URL environment variable
3. Connect it to your backend service

### 1.4 Configure Build Settings
In Railway, set these build commands:
- **Build Command**: `bun install && bunx prisma generate && bun run build`
- **Start Command**: `bunx prisma migrate deploy && bun run db:seed && bun run start:prod`
- **Health Check Path**: `/api/health`

### 1.5 Deploy
1. Click "Deploy" in Railway
2. Monitor the deployment logs
3. Once deployed, note your backend URL (e.g., `https://fitnesspro-backend-production.up.railway.app`)

---

## 🌐 STEP 2: Frontend Deployment (Netlify)

### 2.1 Create Netlify Site
1. Go to https://netlify.com and sign in
2. Click "New site from Git"
3. Choose your repository
4. Set build directory to: `fitness-trainer-frontend`

### 2.2 Configure Build Settings
- **Build command**: `bun run build`
- **Publish directory**: `.next`
- **Node version**: `20`

### 2.3 Configure Environment Variables
In Netlify dashboard → Site settings → Environment variables:

```bash
NEXT_PUBLIC_API_URL=https://fitnesspro-backend-production.up.railway.app/api
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_DEFAULT_CURRENCY=UAH
NEXT_PUBLIC_DEFAULT_LOCALE=uk-UA
NEXT_PUBLIC_LIQPAY_PUBLIC_KEY=sandbox_i74424594321
NEXT_PUBLIC_LIQPAY_SANDBOX=true
NEXT_PUBLIC_APP_NAME=FitnessPro
NEXT_PUBLIC_APP_DESCRIPTION=Платформа для фітнес-тренерів та клієнтів
NEXT_PUBLIC_PLAN_BASIC=499
NEXT_PUBLIC_PLAN_PRO=1299
NEXT_PUBLIC_PLAN_PREMIUM=2499
```

### 2.4 Update Backend CORS
After frontend is deployed:
1. Go to Railway dashboard
2. Update `FRONTEND_URL` and `CORS_ORIGIN` with your Netlify URL
3. Redeploy backend

---

## 💳 STEP 3: LiqPay Payment Integration

### 3.1 Sandbox Configuration (Testing)
For initial testing, the sandbox credentials are already configured:
- **Public Key**: `sandbox_i74424594321`
- **Private Key**: `sandbox_demoPrivateKey2024`
- **Sandbox Mode**: `true`

### 3.2 Production LiqPay Setup
To enable real payments:
1. Register at https://www.liqpay.ua/
2. Complete merchant verification
3. Get your production keys
4. Update environment variables:
   ```bash
   LIQPAY_PUBLIC_KEY=your_production_public_key
   LIQPAY_PRIVATE_KEY=your_production_private_key
   LIQPAY_SANDBOX=false
   ```

### 3.3 Ukrainian Payment Plans
The platform supports Ukrainian Hryvnia (UAH) with these plans:
- **Basic**: ₴499/month
- **Pro**: ₴1,299/month
- **Premium**: ₴2,499/month

---

## 🗄️ STEP 4: Database Setup

### 4.1 Automatic Setup
Railway will automatically:
1. Create PostgreSQL database
2. Run Prisma migrations
3. Seed initial data (exercises, categories, sample users)

### 4.2 Manual Database Management
To manage database manually:
```bash
# Connect to Railway PostgreSQL
railway run bunx prisma studio

# Reset database (if needed)
railway run bunx prisma migrate reset --force

# Re-seed database
railway run bun run db:seed
```

---

## 🔍 STEP 5: Testing & Verification

### 5.1 Health Checks
1. **Backend Health**: `GET https://your-backend-url.railway.app/api/health`
2. **Frontend Load**: Visit your Netlify URL
3. **API Documentation**: `https://your-backend-url.railway.app/api/docs`

### 5.2 Test User Accounts
The seed data creates these test accounts:

**Trainers:**
- `john.trainer@fitnesspro.com` / `password123`
- `maria.coach@fitnesspro.com` / `password123`

**Clients:**
- `alice.client@fitnesspro.com` / `password123`
- `bob.fitness@fitnesspro.com` / `password123`

**Admin:**
- `admin@fitnesspro.com` / `admin123`

### 5.3 Test Payment Flow
1. Login as a client
2. Browse trainer sessions
3. Book a session
4. Test LiqPay payment (sandbox mode)
5. Verify payment callback handling

---

## 🛡️ STEP 6: Security & Production Checklist

### 6.1 Security Configuration
- [ ] Strong JWT secret generated
- [ ] CORS properly configured
- [ ] HTTPS enabled on both services
- [ ] Database connection encrypted
- [ ] File upload size limits set

### 6.2 LiqPay Security
- [ ] Webhook signature verification enabled
- [ ] Sandbox mode disabled for production
- [ ] Production keys securely stored
- [ ] Payment callback URLs whitelisted

### 6.3 Ukrainian Compliance
- [ ] UAH currency properly configured
- [ ] Ukrainian localization active
- [ ] LiqPay terms accepted
- [ ] Data privacy compliance

---

## 📊 STEP 7: Monitoring & Maintenance

### 7.1 Application Monitoring
- **Railway**: Built-in metrics and logs
- **Netlify**: Deploy notifications and analytics
- **Health Checks**: Automated endpoint monitoring

### 7.2 Database Maintenance
- **Backups**: Railway automatically backs up PostgreSQL
- **Monitoring**: Track connection pool usage
- **Performance**: Monitor query performance

---

## 🔗 Final URLs

After successful deployment, you'll have:

### Production URLs
- **Frontend**: `https://fitnesspro-app.netlify.app`
- **Backend API**: `https://fitnesspro-backend-production.up.railway.app/api`
- **API Documentation**: `https://fitnesspro-backend-production.up.railway.app/api/docs`
- **Database**: Managed by Railway PostgreSQL

### Test Access
- **Admin Panel**: `https://fitnesspro-app.netlify.app/admin`
- **Trainer Dashboard**: `https://fitnesspro-app.netlify.app/trainer`
- **Client Portal**: `https://fitnesspro-app.netlify.app/client`

---

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**: Verify FRONTEND_URL matches Netlify domain
2. **Database Connection**: Check DATABASE_URL in Railway
3. **Build Failures**: Verify Node.js version and dependencies
4. **Payment Issues**: Check LiqPay credentials and sandbox mode

### Support Resources
- **Railway Docs**: https://docs.railway.app/
- **Netlify Docs**: https://docs.netlify.com/
- **LiqPay API**: https://www.liqpay.ua/documentation
- **Prisma Docs**: https://www.prisma.io/docs/

---

## 🎉 Success!

Your FitnessPro Ukrainian fitness platform is now live! 🇺🇦

The platform is ready for Ukrainian trainers and clients to:
- 💪 Create and manage workout plans
- 📅 Schedule training sessions
- 💳 Process payments in UAH through LiqPay
- 📊 Track fitness progress
- 👥 Connect trainers with clients

**Слава Україні! 🇺🇦**
