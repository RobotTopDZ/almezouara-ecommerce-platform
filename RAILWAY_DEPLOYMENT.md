# 🚂 Railway Deployment Guide - Almezouara E-Commerce

This guide will help you deploy your Almezouara e-commerce platform to Railway without crashes.

## 🔧 Pre-Deployment Checklist

Run this command to check if your app is ready:
```bash
npm run check:deployment
```

## 🚀 Step-by-Step Deployment

### 1. Prepare Your Code

Make sure all changes are committed:
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect it's a Node.js project

### 3. Add MySQL Database

1. In your Railway project dashboard
2. Click "New" → "Database" → "MySQL"
3. Wait for the database to be provisioned
4. Click on the MySQL service
5. Go to "Connect" tab
6. Copy the connection URL (starts with `mysql://`)

### 4. Configure Environment Variables

In your web service (not the database), go to "Variables" tab and add:

```env
# Database (REQUIRED)
DATABASE_URL=mysql://username:password@host:port/database_name

# SSL Configuration (REQUIRED for Railway)
DATABASE_SSL=false

# Environment (REQUIRED)
NODE_ENV=production

# CORS (REQUIRED - replace with your actual Railway URL)
CORS_ORIGIN=https://your-app-name.up.railway.app

# Optional: Enable shipping data migration (only needed once)
MIGRATE_SHIPPING_DATA=false
```

**Important**: Replace `your-app-name` in `CORS_ORIGIN` with your actual Railway subdomain.

### 5. Deploy

1. Railway will automatically deploy after you set the environment variables
2. Monitor the deployment logs for any errors
3. Look for these success messages:
   - "✅ Database connected successfully"
   - "✅ Database tables initialized successfully"
   - "🚀 Server listening on port XXXX"

### 6. Test Your Deployment

1. Open your Railway app URL
2. Check that the frontend loads
3. Test the API by visiting `/api/health`
4. Verify database connectivity

## 🐛 Common Issues & Solutions

### Issue: "Database connection failed"
**Solution**: 
- Check your `DATABASE_URL` is correct
- Ensure `DATABASE_SSL=false` is set
- Verify the MySQL service is running

### Issue: "Dist folder not found"
**Solution**: 
- Railway should run `npm run build` automatically
- Check the build logs for any Vite build errors
- Ensure all dependencies are in `package.json`

### Issue: "API routes not working"
**Solution**: 
- Check that `CORS_ORIGIN` matches your Railway URL exactly
- Verify all API files are present in the `api/` directory
- Check server logs for specific error messages

### Issue: "Frontend loads but API calls fail"
**Solution**: 
- Update `CORS_ORIGIN` with your actual Railway URL
- Check browser console for CORS errors
- Verify API endpoints are accessible at `/api/health`

## 📊 Monitoring Your App

### Railway Dashboard
- **Deployments**: View deployment history and logs
- **Metrics**: Monitor CPU, memory, and network usage
- **Logs**: Real-time application logs
- **Variables**: Manage environment variables

### Health Checks
- **Frontend**: `https://your-app.up.railway.app/`
- **API Health**: `https://your-app.up.railway.app/api/health`
- **Server Health**: `https://your-app.up.railway.app/health`

## 🔄 Automatic Deployments

After initial setup:
1. Push to GitHub → Railway automatically deploys
2. Database changes are handled automatically
3. Zero-downtime deployments

## 💰 Cost Estimation

**Hobby Plan (Free)**:
- $0/month for small apps
- 500 hours of usage
- 1GB RAM, 1 vCPU

**Pro Plan**:
- $5/month base + usage
- Unlimited hours
- Better performance

## 🛠️ Troubleshooting Commands

```bash
# Check deployment status
npm run check:deployment

# Test build locally
npm run test:build

# Clean and rebuild
npm run clean && npm run build

# Check logs (if Railway CLI is installed)
railway logs
```

## 📞 Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Project Issues**: Check the GitHub repository

---

## 🎉 Success!

Once deployed successfully, your e-commerce platform will be live at:
`https://your-app-name.up.railway.app`

The app includes:
- ✅ Full-stack React + Node.js application
- ✅ MySQL database with automatic table creation
- ✅ API endpoints for orders, promotions, and admin
- ✅ Mobile-responsive design
- ✅ PWA capabilities
- ✅ Automatic deployments from GitHub

Happy selling! 🛍️
