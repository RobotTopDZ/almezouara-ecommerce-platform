# Railway Full-Stack Deployment Guide

This guide explains how the Almezouara e-commerce platform is configured to host both frontend and backend on Railway as a single service.

## 🏗️ Architecture Overview

Our Railway deployment uses a **monolithic architecture** where both frontend and backend are served from a single Node.js server:

```
Railway Service
├── Frontend (React SPA)
│   ├── Built with Vite
│   ├── Served as static files from /dist
│   └── SPA routing handled by server
└── Backend (Express API)
    ├── API routes under /api/*
    ├── Database connections
    └── File uploads & business logic
```

## 📁 File Structure

```
almezouara-ecommerce/
├── src/                     # React frontend source
├── api/                     # Express backend API
├── dist/                    # Built frontend (created during build)
├── server.js               # Main server file (serves both)
├── railway.json            # Railway configuration
├── vite.config.js          # Frontend build configuration
└── package.json            # Dependencies & scripts
```

## 🚀 Deployment Process

### 1. Build Phase
Railway runs: `npm install && npm run build`

This:
- Installs all dependencies
- Builds the React frontend with Vite
- Creates the `dist/` folder with static assets

### 2. Deploy Phase
Railway runs: `npm start`

This:
- Starts the Express server (`server.js`)
- Serves API routes under `/api/*`
- Serves static frontend files from `/dist`
- Handles SPA routing for React Router

## 🔧 Key Configuration Files

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### server.js (Key Features)
- **Static File Serving**: Serves built React app from `/dist`
- **API Routes**: Mounts Express API under `/api`
- **SPA Fallback**: Redirects all non-API routes to `index.html`
- **Health Checks**: Provides `/health` endpoint for Railway
- **Error Handling**: Graceful error handling and logging

### vite.config.js
- **Build Optimization**: Code splitting and asset optimization
- **Production Build**: Outputs to `/dist` directory
- **PWA Support**: Service worker and manifest generation

## 🌐 URL Structure

When deployed on Railway, your app will have:

- **Frontend**: `https://your-app.railway.app/` (React SPA)
- **API**: `https://your-app.railway.app/api/*` (Express routes)
- **Health Check**: `https://your-app.railway.app/health`
- **Debug Info**: `https://your-app.railway.app/debug`

## 🔍 How It Works

1. **User visits the site**: Railway routes to our Express server
2. **Static requests** (JS, CSS, images): Served from `/dist` folder
3. **API requests** (`/api/*`): Handled by Express API routes
4. **SPA routes** (React Router): Fallback to `index.html`
5. **Health checks**: Railway monitors `/health` endpoint

## 🛠️ Development vs Production

### Development
- Frontend: Vite dev server on port 3000
- Backend: Express server on port 5000
- Proxy: Vite proxies `/api` requests to backend

### Production (Railway)
- Single server: Serves both frontend and backend
- Port: Railway assigns dynamic port via `process.env.PORT`
- Static files: Pre-built and served directly

## 📋 Deployment Checklist

Before deploying to Railway:

- [ ] Frontend builds successfully (`npm run build`)
- [ ] `dist/` folder is created with assets
- [ ] API routes work (`/api/health`)
- [ ] Environment variables are set
- [ ] Database connection is configured
- [ ] Health check endpoint responds

## 🔧 Troubleshooting

### Frontend Not Loading
- Check if `dist/` folder exists after build
- Verify `index.html` is in the dist folder
- Check server logs for static file serving errors

### API Not Working
- Verify API routes are mounted under `/api`
- Check database connection
- Review environment variables

### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are in `package.json`
- Review build logs for specific errors

## 🚀 Deployment Commands

```bash
# Test build locally
npm run build

# Test full deployment locally
npm run serve:full

# Deploy to Railway (automatic on git push)
git push origin main

# Check deployment status
npm run railway:deploy
```

## 📊 Monitoring

Railway provides:
- **Logs**: Real-time server logs
- **Metrics**: CPU, memory, and network usage
- **Health Checks**: Automatic monitoring of `/health`
- **Deployments**: History and rollback options

## 🔒 Environment Variables

Required for production:
- `DATABASE_URL`: MySQL connection string
- `NODE_ENV`: Set to "production"
- `PORT`: Automatically set by Railway

Optional:
- `CORS_ORIGIN`: Allowed origins for CORS
- `DATABASE_SSL`: SSL configuration for database

---

This configuration ensures that both your React frontend and Express backend are properly hosted on Railway as a single, efficient service.
