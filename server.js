// server.js - Railway/Monolithic deployment entry
// Bulletproof server that starts regardless of issues

console.log('🚀 Starting Almezouara E-Commerce Server...');
console.log(`📊 Node Version: ${process.version}`);
console.log(`📊 Platform: ${process.platform}`);
console.log(`📊 Working Directory: ${process.cwd()}`);

const path = require('path');
const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

console.log(`🔧 Port configured: ${PORT}`);
console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);

// Trust proxy when running behind Railway's proxy
app.set('trust proxy', 1);

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// CRITICAL: Health check endpoint FIRST - before any other logic
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({
    status: 'healthy',
    server: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    uptime: process.uptime()
  });
});

// API status endpoint (moved from root)
app.get('/api/status', (req, res) => {
  console.log('📊 API status requested');
  res.status(200).json({
    message: 'Almezouara E-Commerce API is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    api_loaded: apiLoaded
  });
});

// Check if dist folder exists (non-blocking)
const distPath = path.join(__dirname, 'dist');
const distExists = fs.existsSync(distPath);
console.log(`📁 Dist folder exists: ${distExists}`);

if (!distExists) {
  console.warn('⚠️  Dist folder not found - frontend will not be served');
  
  // Fallback root route when no frontend build exists
  app.get('/', (req, res) => {
    res.status(503).json({
      error: 'Frontend not built',
      message: 'Please run npm run build to generate the frontend',
      timestamp: new Date().toISOString()
    });
  });
} else {
  console.log(`📁 Dist path: ${distPath}`);
  
  // Serve static files from Vite build with proper configuration
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: false,
    index: 'index.html'
  }));
  
  console.log('✅ Static file serving configured - Frontend will be served at root');
}

// Mount API (non-blocking)
let apiLoaded = false;
try {
  console.log('🔄 Loading API routes...');
  const appApi = require('./api');
  app.use('/api', appApi);
  apiLoaded = true;
  console.log('✅ API routes mounted successfully');
} catch (error) {
  console.error('❌ Failed to load API routes:', error.message);
  console.error('⚠️  Server will continue without API routes');
  
  // Fallback API health endpoint
  app.get('/api/health', (req, res) => {
    res.status(503).json({
      status: 'api_unavailable',
      error: 'API failed to load',
      timestamp: new Date().toISOString()
    });
  });
}

// Debug endpoint
app.get('/debug', (req, res) => {
  res.json({
    status: 'debug_info',
    timestamp: new Date().toISOString(),
    server_info: {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      node_version: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    },
    file_system: {
      dist_exists: distExists,
      dist_path: distPath,
      api_loaded: apiLoaded
    },
    environment_vars: {
      PORT: process.env.PORT || 'not set',
      NODE_ENV: process.env.NODE_ENV || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set'
    }
  });
});

// SPA fallback (only if dist exists)
if (distExists) {
  // Use a more specific pattern instead of '*'
  app.use((req, res, next) => {
    // Skip API routes, health, and debug
    if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/debug')) {
      return next();
    }
    
    // Serve index.html for all other routes (SPA fallback)
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).json({ error: 'Frontend build not found' });
    }
  });
}

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Catch unhandled errors
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🎉 SERVER STARTED SUCCESSFULLY!');
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`🌐 Server address: http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔍 Debug info: http://0.0.0.0:${PORT}/debug`);
  console.log(`📁 Static files: ${distExists ? 'enabled' : 'disabled'}`);
  console.log(`🔌 API routes: ${apiLoaded ? 'loaded' : 'failed'}`);
  console.log('=' .repeat(50));
});

// Handle server errors
server.on('error', (err) => {
  console.error('💥 Server failed to start:', err.message);
  process.exit(1);
});
