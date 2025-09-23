# 🚨 Railway Deployment Troubleshooting Guide

## Current Issue: Health Check Failure

Your deployment is failing because the health check at `/health` is not responding. This indicates the server is not starting properly.

## 🔍 Immediate Steps to Fix

### 1. Check Environment Variables in Railway

Go to your Railway project → Web Service → Variables tab and ensure these are set:

**REQUIRED Variables:**
```env
DATABASE_URL=mysql://username:password@host:port/database_name
NODE_ENV=production
PORT=3000
```

**IMPORTANT:** If you don't have a MySQL database yet:
1. In Railway project → Click "New" → "Database" → "MySQL"
2. Wait for it to provision
3. Click on MySQL service → "Connect" tab → Copy the connection URL
4. Paste it as `DATABASE_URL` in your web service

### 2. Check Railway Logs

In Railway dashboard → Your web service → "Logs" tab, look for:

**Success indicators:**
```
✅ API routes mounted successfully
🚀 Server listening on port 3000
✅ Database connected successfully
```

**Error indicators:**
```
❌ Database connection failed
❌ Failed to load API routes
❌ Dist folder not found
```

### 3. Test Health Check Endpoints

Once deployed, test these URLs:
- `https://your-app.up.railway.app/health` - Main server health
- `https://your-app.up.railway.app/api/health` - API health
- `https://your-app.up.railway.app/api/debug` - Diagnostic info

## 🛠️ Common Fixes

### Fix 1: Missing Database Configuration
**Problem:** No `DATABASE_URL` set
**Solution:** Add MySQL service and set `DATABASE_URL`

### Fix 2: Wrong Database URL Format
**Problem:** Invalid connection string
**Solution:** Use format: `mysql://username:password@host:port/database_name`

### Fix 3: SSL Issues
**Problem:** Database SSL errors
**Solution:** Add `DATABASE_SSL=false` to environment variables

### Fix 4: CORS Issues
**Problem:** Frontend can't connect to API
**Solution:** Set `CORS_ORIGIN=https://your-app.up.railway.app`

### Fix 5: Build Issues
**Problem:** Dist folder not found
**Solution:** Ensure build completes successfully in Railway logs

## 📋 Environment Variables Checklist

Copy these to Railway → Variables (replace values with your actual data):

```env
# Database (REQUIRED)
DATABASE_URL=mysql://username:password@host:port/database_name

# SSL (REQUIRED for Railway)
DATABASE_SSL=false

# Environment (REQUIRED)
NODE_ENV=production

# Port (Railway sets this automatically, but good to have)
PORT=3000

# CORS (Replace with your actual Railway URL)
CORS_ORIGIN=https://your-app-name.up.railway.app

# Optional: Enable shipping data migration
MIGRATE_SHIPPING_DATA=false
```

## 🔄 Redeploy Steps

1. **Set all environment variables** (see checklist above)
2. **Trigger redeploy** (push to GitHub or click "Deploy" in Railway)
3. **Monitor logs** for success/error messages
4. **Test health check** at `/health` endpoint

## 🚨 Emergency Debug Mode

If still failing, temporarily add this environment variable to get more info:
```env
DEBUG=true
```

Then check `/api/debug` endpoint for detailed diagnostics.

## 📞 Get Help

If still stuck:
1. Check Railway logs for specific error messages
2. Test locally with `npm start`
3. Verify all files exist with `npm run check:deployment`
4. Join Railway Discord for community help

## ✅ Success Indicators

Your deployment is working when:
- Health check responds at `/health`
- No error messages in Railway logs
- Frontend loads at your Railway URL
- API responds at `/api/health`

---

**Most Common Issue:** Missing `DATABASE_URL` environment variable. Add MySQL service first!
