# FitnessPro SaaS Platform - Production Deployment Guide

## 🚀 Quick Deploy to Production

This guide will help you deploy the FitnessPro platform to production using Render.com for backend and Netlify for frontend.

## 📋 Prerequisites

- GitHub account
- Render.com account (free tier available)
- Netlify account (free tier available)

## 🌐 Deployment Architecture

```
Frontend (Netlify) → Backend API (Render.com) → PostgreSQL Database (Render.com)
```

## 🔧 Step 1: Backend Deployment on Render.com

### 1.1 Push Code to GitHub
```bash
# Make sure your code is committed and pushed to GitHub
git add .
git commit -m "Production deployment ready"
git push origin main
```

### 1.2 Deploy on Render.com

1. **Sign up/Login to Render.com**
   - Go to https://render.com
   - Sign in with your GitHub account

2. **Create PostgreSQL Database**
   - Click "New" → "PostgreSQL"
   - Name: `fitnesspro-db`
   - Plan: Free (or paid for production)
   - Region: Choose closest to your users
   - Click "Create Database"
   - **Save the connection details** (you'll need them)

3. **Deploy Backend Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the repository with the FitnessPro code
   - Configure the service:
     - **Name**: `fitnesspro-backend`
     - **Root Directory**: `fitness-trainer-saas/backend`
     - **Runtime**: Node
     - **Build Command**: `bun install && bun run build && bunx prisma generate`
     - **Start Command**: `bunx prisma db push && bun run db:seed && bun run start:prod`
     - **Plan**: Free (or paid for production)
     - **Region**: Same as database

4. **Configure Environment Variables**
   Add these environment variables in Render dashboard:
   ```
   NODE_ENV=production
   PORT=8000
   DATABASE_URL=[Auto-filled from database connection]
   JWT_SECRET=[Generate a secure random string]
   FRONTEND_URL=https://fitnesspro-app.netlify.app
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete (5-10 minutes)
   - Your backend will be available at: `https://fitnesspro-backend.onrender.com`

## 🎨 Step 2: Frontend Deployment on Netlify

### 2.1 Deploy on Netlify

1. **Sign up/Login to Netlify**
   - Go to https://netlify.com
   - Sign in with your GitHub account

2. **Create New Site**
   - Click "New site from Git"
   - Choose GitHub and authorize
   - Select your repository
   - Configure build settings:
     - **Base directory**: `fitness-trainer-frontend`
     - **Build command**: `bun run build`
     - **Publish directory**: `.next`
     - **Node version**: 20

3. **Configure Environment Variables**
   In Netlify dashboard → Site settings → Environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://fitnesspro-backend.onrender.com/api
   NEXT_PUBLIC_APP_ENV=production
   ```

4. **Deploy**
   - Click "Deploy site"
   - Wait for deployment (3-5 minutes)
   - Your frontend will be available at: `https://[random-name].netlify.app`

5. **Custom Domain (Optional)**
   - In Netlify dashboard → Domain settings
   - Add your custom domain
   - Update FRONTEND_URL in Render backend environment

## 🔍 Step 3: Verify Deployment

### 3.1 Test Backend API
```bash
# Test health endpoint
curl https://fitnesspro-backend.onrender.com/api/health

# Test authentication
curl https://fitnesspro-backend.onrender.com/api/auth/quick-login?type=trainer
```

### 3.2 Test Frontend
1. Visit your Netlify URL
2. Try logging in as different user roles
3. Test workout creation and session management
4. Verify all API calls work

### 3.3 Test Database
1. Check Render database dashboard for connections
2. Verify data seeding completed successfully
3. Test CRUD operations through the frontend

## ⚙️ Production Configuration

### Security Checklist
- [ ] JWT_SECRET is secure and random
- [ ] Database has proper connection limits
- [ ] CORS is configured for your domain only
- [ ] API endpoints require authentication
- [ ] Environment variables are set correctly

### Performance Optimization
- [ ] Database indexing is properly configured
- [ ] Frontend is optimized for production build
- [ ] CDN is configured for static assets
- [ ] Caching headers are set appropriately

### Monitoring Setup
- [ ] Set up health check monitoring
- [ ] Configure error tracking (Sentry recommended)
- [ ] Set up performance monitoring
- [ ] Enable database backup schedules

## 🔄 Continuous Deployment

Both Render and Netlify support automatic deployments:

1. **Automatic Deploy on Push**
   - Both services will redeploy when you push to main branch
   - Build logs are available in respective dashboards

2. **Branch Previews** (Netlify)
   - Create pull requests for preview deployments
   - Test changes before merging to main

## 🚨 Troubleshooting

### Common Issues

1. **Backend Build Fails**
   - Check Node version is 20+
   - Verify all dependencies are installed
   - Check Prisma schema syntax

2. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Check database is running and accessible
   - Ensure connection limits aren't exceeded

3. **Frontend API Errors**
   - Verify NEXT_PUBLIC_API_URL is correct
   - Check CORS configuration
   - Ensure backend is deployed and running

4. **Authentication Issues**
   - Verify JWT_SECRET is the same across deploys
   - Check token expiration settings
   - Ensure cookies/localStorage work across domains

### Log Access
- **Render**: Dashboard → Service → Logs tab
- **Netlify**: Dashboard → Site → Functions tab

### Scaling
- **Render**: Upgrade to paid plans for better performance
- **Netlify**: Automatic scaling included
- **Database**: Monitor connection limits and query performance

## 📊 Production URLs

After successful deployment:

- **Frontend**: `https://fitnesspro-app.netlify.app`
- **Backend API**: `https://fitnesspro-backend.onrender.com/api`
- **API Documentation**: `https://fitnesspro-backend.onrender.com/api/docs`
- **Database**: Managed through Render dashboard

## 🎉 Success!

Your FitnessPro SaaS platform is now live in production!

### Next Steps:
1. Test all functionality thoroughly
2. Set up monitoring and analytics
3. Configure backups
4. Plan for scaling and optimization
5. Implement additional features

### Support:
- Backend logs: Render dashboard
- Frontend logs: Netlify dashboard
- Database monitoring: Render PostgreSQL dashboard

**Congratulations! Your fitness platform is ready for real users! 🏋️‍♂️💪**
