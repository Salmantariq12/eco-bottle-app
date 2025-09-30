# 🚀 Deploying to Vercel - Complete Guide

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
3. **Redis Cloud**: Free instance at [redis.com](https://redis.com) or use Upstash Redis
4. **GitHub Account**: For continuous deployment

## 🏗️ Architecture Overview

Since Vercel is optimized for frontend and serverless functions, we'll deploy:
- **Frontend**: Next.js app on Vercel
- **Backend**: Either as Vercel API routes OR separate deployment (Heroku/Railway/Render)
- **Database**: MongoDB Atlas (cloud)
- **Cache**: Upstash Redis (serverless Redis)

## 📦 Option 1: Full Vercel Deployment (Recommended)

### Step 1: Prepare the Frontend

1. **Update API calls** in `frontend/lib/apiClient.js`:
```javascript
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  // ... rest of config
});
```

2. **Push to GitHub**:
```bash
cd eco-bottle-app/frontend
git init
git add .
git commit -m "Prepare for Vercel deployment"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

### Step 2: Set Up MongoDB Atlas

1. **Create Free Cluster**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create free M0 cluster
   - Add database user (note username/password)
   - Whitelist IP: `0.0.0.0/0` (allow from anywhere)
   - Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/eco_bottle`

### Step 3: Set Up Upstash Redis

1. **Create Redis Database**:
   - Go to [Upstash](https://upstash.com)
   - Create free Redis database
   - Copy the REST URL and token

### Step 4: Deploy to Vercel

1. **Connect GitHub to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `frontend` folder as root directory

2. **Configure Environment Variables** in Vercel Dashboard:
```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eco_bottle

# Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production

# API URL (if using separate backend)
BACKEND_URL=https://your-backend.herokuapp.com

# Or if using Vercel functions
NEXT_PUBLIC_API_URL=/api
```

3. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Access your site at `your-app.vercel.app`

## 📦 Option 2: Hybrid Deployment (Frontend on Vercel, Backend Elsewhere)

### Backend Deployment Options:

#### A. Deploy to Heroku
```bash
cd backend
heroku create your-app-backend
heroku addons:create mongolab:sandbox
heroku addons:create heroku-redis:hobby-dev
git push heroku main
```

#### B. Deploy to Railway
```bash
cd backend
railway init
railway add
railway up
```

#### C. Deploy to Render
1. Create new Web Service on [Render](https://render.com)
2. Connect GitHub repo
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables

### Frontend on Vercel:
1. Update `NEXT_PUBLIC_API_URL` to point to your backend URL
2. Deploy frontend to Vercel as described above

## 🔧 Required Code Modifications

### 1. Update Frontend API Client
```javascript
// frontend/lib/apiClient.js
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### 2. Create Serverless API Routes (if using Option 1)
Already created in `frontend/pages/api/` directory

### 3. Update Backend for Production
```javascript
// backend/server.js - Add CORS for your Vercel domain
app.use(cors({
  origin: [
    'https://your-app.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

## 🌍 Environment Variables Summary

### Frontend (.env.local):
```env
NEXT_PUBLIC_API_URL=/api  # or https://your-backend.com
```

### Backend (.env):
```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=https://your-app.vercel.app
```

## 📊 Monitoring & Analytics

1. **Vercel Analytics**: Built-in performance monitoring
2. **MongoDB Atlas**: Database performance metrics
3. **Upstash**: Redis metrics and monitoring
4. **LogRocket or Sentry**: Error tracking (optional)

## 🚦 Post-Deployment Checklist

- [ ] Test login/register functionality
- [ ] Verify product loading
- [ ] Check rate limiting is working
- [ ] Test checkout flow
- [ ] Verify SSL certificate
- [ ] Set up custom domain (optional)
- [ ] Configure production environment variables
- [ ] Enable Vercel Analytics
- [ ] Set up error monitoring

## 🆘 Troubleshooting

### CORS Issues
Add your Vercel URL to backend CORS configuration:
```javascript
cors({
  origin: 'https://your-app.vercel.app',
  credentials: true
})
```

### MongoDB Connection Issues
- Whitelist all IPs in Atlas: `0.0.0.0/0`
- Use connection string with `retryWrites=true&w=majority`

### Redis Connection Issues
- Use Upstash REST API instead of direct Redis connection
- Or use memory cache as fallback

### Build Failures
- Check Node version compatibility
- Ensure all dependencies are in package.json
- Check build logs in Vercel dashboard

## 🎯 Quick Start Commands

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy frontend
cd frontend
vercel

# 4. Set environment variables
vercel env add MONGODB_URI
vercel env add JWT_SECRET
# ... add other variables

# 5. Redeploy with env vars
vercel --prod
```

## 📱 Custom Domain Setup

1. Buy domain from Namecheap/GoDaddy/Google Domains
2. In Vercel Dashboard → Settings → Domains
3. Add your domain
4. Update DNS records as instructed
5. Wait for propagation (5-30 minutes)

## 🔐 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Rate Limiting**: Keep it enabled in production
3. **HTTPS**: Always use (Vercel provides automatically)
4. **Authentication**: Implement refresh token rotation
5. **MongoDB**: Use connection with SSL
6. **CORS**: Restrict to your domain only

## 📈 Scaling Tips

1. **Edge Functions**: Use Vercel Edge Functions for geo-distributed APIs
2. **ISR**: Enable Incremental Static Regeneration for product pages
3. **Image Optimization**: Use `next/image` with Vercel's optimization
4. **Database Indexes**: Create indexes in MongoDB Atlas
5. **CDN**: Vercel automatically provides CDN

## 🎉 Success!

Your app should now be live at:
- **Production**: `https://your-app.vercel.app`
- **Preview**: Each PR gets a preview URL

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com)
- [Upstash Redis Docs](https://docs.upstash.com)