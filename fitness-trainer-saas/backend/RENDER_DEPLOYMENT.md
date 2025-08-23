# 🚀 FitnessPro Backend - Render.com Deployment Guide

## 🎯 Quick Deployment Steps

### 1. **Create Render Account**
- Visit [render.com](https://render.com) and sign up
- Connect your GitHub account
- Verify your email address

### 2. **Deploy Database First**
1. Click **"New PostgreSQL"** from dashboard
2. Configure database:
   - **Name:** `fitnesspro-postgres-db`
   - **Database:** `fitness_pro_production`
   - **User:** `fitness_pro_user`
   - **Region:** Oregon (us-west)
   - **Plan:** Starter ($7/month)
3. Click **"Create Database"**
4. **SAVE** the connection string for later

### 3. **Deploy Backend Service**
1. Click **"New Web Service"** from dashboard
2. Connect GitHub repository
3. Select **"fitness-trainer-saas"** repository
4. Configure service:
   - **Name:** `fitnesspro-backend-api`
   - **Runtime:** Node
   - **Region:** Oregon (us-west)
   - **Branch:** main
   - **Root Directory:** `backend`
   - **Build Command:** `bun install && bunx prisma generate && bun run build`
   - **Start Command:** `bunx prisma migrate deploy && bun run start:prod`
   - **Plan:** Starter ($7/month)

### 4. **Configure Environment Variables**
Add these environment variables in Render dashboard:

```bash
NODE_ENV=production
PORT=8000
DATABASE_URL=[paste database connection string from step 2]
JWT_SECRET=fp_super_secure_jwt_secret_2024_production_render_deployment_v1
FRONTEND_URL=https://fitnesspro-frontend.netlify.app
CORS_ORIGIN=https://fitnesspro-frontend.netlify.app
HELMET_ENABLED=true
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=100
LOG_LEVEL=info
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads
```

### 5. **Deploy & Test**
1. Click **"Create Web Service"**
2. Wait for build to complete (~5-10 minutes)
3. Test endpoints:
   - Health: `https://your-service.onrender.com/api/health`
   - Docs: `https://your-service.onrender.com/api/docs`

---

## 🔧 Alternative: Deploy with render.yaml

### Option A: Automatic Configuration
1. Push code to GitHub
2. In Render dashboard, click **"New from YAML"**
3. Select repository and `backend/render.yaml` file
4. Render will automatically create both database and web service
5. Just add the environment variables

### Option B: Manual Upload
If you prefer, you can also use the existing `render.yaml` configuration file in the backend directory.

---

## 📊 Expected Results

### **Live URLs**
- **API Base:** `https://fitnesspro-backend-api.onrender.com`
- **Health Check:** `https://fitnesspro-backend-api.onrender.com/api/health`
- **API Docs:** `https://fitnesspro-backend-api.onrender.com/api/docs`
- **WebSocket:** `wss://fitnesspro-backend-api.onrender.com/chat`

### **Database**
- **Host:** Managed PostgreSQL on Render
- **Migrations:** Automatically applied on deploy
- **Seed Data:** 5 test users, 4 chat rooms, sample messages

### **Features Available**
✅ 15+ REST API endpoints for messaging
✅ WebSocket real-time communication
✅ JWT authentication with role-based access
✅ Swagger API documentation
✅ Message threading and reactions
✅ File upload support (ready)
✅ Health monitoring and auto-scaling

---

## 🧪 Testing After Deployment

### 1. **Health Check**
```bash
curl https://your-service.onrender.com/api/health
```
Expected: Status 200 with health information

### 2. **API Documentation**
Visit: `https://your-service.onrender.com/api/docs`
Expected: Interactive Swagger UI

### 3. **WebSocket Connection**
```javascript
const socket = io('wss://your-service.onrender.com', {
  auth: { token: 'your-jwt-token' }
});
```

### 4. **Database Verification**
Check that seed data was created:
```bash
# In Render shell or via API
curl https://your-service.onrender.com/api/messages/chat-rooms
```

---

## 🔍 Troubleshooting

### **Build Fails**
- Check that Bun is properly installed
- Verify all dependencies in package.json
- Ensure Prisma schema is valid

### **Database Connection Issues**
- Verify DATABASE_URL environment variable
- Check database is in same region as web service
- Ensure database is active and accepting connections

### **Health Check Fails**
- Verify service is listening on PORT from environment
- Check that all required environment variables are set
- Review application logs in Render dashboard

### **WebSocket Not Working**
- Ensure WebSocket Gateway is properly initialized
- Check CORS configuration includes WebSocket origins
- Verify Socket.io client connection settings

---

## 💰 Costs

### **Monthly Estimate**
- **Web Service:** $7/month (Starter plan)
- **PostgreSQL:** $7/month (Starter plan)
- **Total:** ~$14/month

### **Free Tier**
- Render offers free tier for development
- Includes 500 build minutes/month
- Services sleep after 15 minutes of inactivity

---

## 🚀 Go Live Checklist

### **Before Deployment**
- [ ] Code pushed to GitHub main branch
- [ ] Environment variables documented
- [ ] Database schema tested locally
- [ ] All tests passing

### **During Deployment**
- [ ] Database created and accessible
- [ ] Web service building successfully
- [ ] Environment variables configured
- [ ] Health checks passing

### **After Deployment**
- [ ] All API endpoints responding
- [ ] WebSocket connections working
- [ ] Database migrations applied
- [ ] Seed data populated
- [ ] Documentation accessible
- [ ] Monitoring active

### **Production Readiness**
- [ ] Custom domain configured (optional)
- [ ] SSL certificates active
- [ ] Auto-scaling configured
- [ ] Backup schedule verified
- [ ] Error alerting set up

---

## 🎉 Success!

Your FitnessPro backend will be live at:
**https://fitnesspro-backend-api.onrender.com**

With full NestJS functionality, real-time WebSocket support, and production PostgreSQL database!

---

## 📞 Support

**Issues?** Check:
1. Render service logs
2. Database connection status
3. Environment variables
4. Build logs for errors

**Need Help?**
- Render Documentation: https://render.com/docs
- GitHub Issues: Report in repository
- Community: Render community forums
