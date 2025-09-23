// server.js - Railway/Monolithic deployment entry
// Serves the built React app from /dist and mounts the API from /api

const path = require('path');
const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy when running behind Railway's proxy
app.set('trust proxy', 1);

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Check if dist folder exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Dist folder not found. Make sure to run "npm run build" first.');
  process.exit(1);
}

// Mount the API app under '/api' to avoid intercepting the frontend root
let apiLoaded = false;
try {
  const appApi = require('./api'); // api/index.js exports the Express app
  app.use('/api', appApi);
  apiLoaded = true;
  console.log('✅ API routes mounted successfully');
} catch (error) {
  console.error('❌ Failed to load API routes:', error.message);
  console.error('⚠️  Server will continue without API routes for health check purposes');
  // Don't exit - let the server start for health checks
}

// Serve static files from Vite build
app.use(express.static(distPath, {
  maxAge: '1y',
  etag: false
}));

// Update health check to reflect API status
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    api_loaded: apiLoaded,
    dist_exists: fs.existsSync(distPath)
  });
});

// SPA fallback: serve index.html for any non-API route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.status(500).json({ error: 'Frontend build not found' });
  }
  
  res.sendFile(indexPath);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`📁 Serving static files from: ${distPath}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
