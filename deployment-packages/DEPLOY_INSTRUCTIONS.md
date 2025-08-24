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

