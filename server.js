// server.js - Railway/Monolithic deployment entry
// Bulletproof server that starts regardless of issues

console.log('🚀 Starting Almezouara E-Commerce Server...');
console.log(`📊 Node Version: ${process.version}`);
console.log(`📊 Platform: ${process.platform}`);
console.log(`📊 Working Directory: ${process.cwd()}`);

// Gestionnaires de signaux pour une meilleure robustesse
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM signal received. Graceful shutdown...');
  // Donner 5 secondes pour terminer les requêtes en cours
  setTimeout(() => {
    console.log('👋 Server shutdown complete');
    process.exit(0);
  }, 5000);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT signal received. Graceful shutdown...');
  // Donner 3 secondes pour terminer les requêtes en cours
  setTimeout(() => {
    console.log('👋 Server shutdown complete');
    process.exit(0);
  }, 3000);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('🔴 Uncaught Exception:', error);
  // Ne pas quitter immédiatement pour permettre la journalisation
  setTimeout(() => {
    console.log('👋 Server shutdown due to uncaught exception');
    process.exit(1);
  }, 1000);
});

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

// Yalidine API routes
try {
  const yalidineRoutes = require('./api/routes/yalidine');
app.use('/api/yalidine', yalidineRoutes);

// Routes pour Facebook Pixel
const facebookPixelRoutes = require('./api/facebookPixel');
app.use('/api/facebook-pixel', facebookPixelRoutes);
  console.log('✅ Yalidine API routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading Yalidine API routes:', error);
}

// Check if dist folder exists (non-blocking)
const distPath = path.join(__dirname, 'dist');
const distExists = fs.existsSync(distPath);
console.log(`📁 Dist folder exists: ${distExists}`);

// API loading status (must be declared early)
let apiLoaded = false;

// Mount API routes
try {
  const apiApp = require('./api/index');
  app.use('/api', apiApp);
  apiLoaded = true;
  console.log('✅ API routes mounted at /api');
} catch (error) {
  console.error('❌ Failed to load API routes:', error.message);
  apiLoaded = false;
}

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

// Serve images from the images directory
const imagesPath = path.join(__dirname, 'images');
if (fs.existsSync(imagesPath)) {
  app.use('/images', express.static(imagesPath, {
    maxAge: '7d',
    etag: true
  }));
  console.log('✅ Images directory served at /images');
} else {
  console.warn('⚠️  Images directory not found');
}

// Serve any additional static assets
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  app.use('/public', express.static(publicPath, {
    maxAge: '7d',
    etag: true
  }));
}


// Auto-repair database on startup
const autoRepairDatabase = async () => {
  let connection;
  try {
    console.log('🔧 Auto-repairing database...');
    
    // Use the centralized database configuration
    const { pool, testConnection } = require('./api/config/database');
    
    // Test the database connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    
    // Get a connection from the pool
    connection = await pool.getConnection();
    
    // Check if orders table exists and has correct structure
    try {
      // MySQL compatible query to check if column exists
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders' 
        AND COLUMN_NAME = 'items'
      `);
      const itemsColumnExists = columns.length > 0;
      
      if (!itemsColumnExists) {
        console.log('⚠️ Orders table missing items column, adding it...');
        await connection.execute('ALTER TABLE orders ADD COLUMN items TEXT');
        console.log('✅ Added items column to orders table');
      } else {
        console.log('✅ Orders table structure is correct');
      }
    } catch (error) {
      if (error.code === '42S02' || error.message.includes('no such table')) { // Table doesn't exist
        console.log('⚠️ Orders table does not exist, creating it...');
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(50) PRIMARY KEY,
            phone VARCHAR(20),
            full_name VARCHAR(255),
            wilaya VARCHAR(100),
            city VARCHAR(100),
            address TEXT,
            delivery_method VARCHAR(50),
            items TEXT,
            total DECIMAL(10,2),
            discount_percentage INT DEFAULT 0,
            status VARCHAR(50) DEFAULT 'pending',
            yalidine_tracking VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('✅ Created orders table with correct structure');
      } else {
        console.error('❌ Database repair error:', error.message);
        throw error; // Re-throw to be caught by the outer try-catch
      }
    }
    
    // Check and fix promotions table structure
    try {
      console.log('🔍 Checking promotions table structure...');
      
      // First, check if promotions table exists
      const [tables] = await connection.execute(
        "SHOW TABLES LIKE 'promotions'"
      );
      
      if (tables.length === 0) {
        console.log('⚠️  Promotions table does not exist, creating it...');
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS promotions (
            id VARCHAR(50) PRIMARY KEY,
            phone VARCHAR(20) NOT NULL,
            percentage DECIMAL(5,2) NOT NULL,
            description TEXT,
            usage_limit INT DEFAULT 1,
            usage_count INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_phone (phone)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Created promotions table with correct structure');
      } else {
        // Table exists, check its structure
        const [columns] = await connection.execute('DESCRIBE promotions');
        const idColumn = columns.find(c => c.Field === 'id');
        
        if (idColumn && idColumn.Type.includes('int')) {
          console.log('⚠️  Promotions table has INT id, fixing to VARCHAR...');
          
          // Create a backup of the existing data
          const [promotions] = await connection.query('SELECT * FROM promotions');
          
          // Drop and recreate with correct schema
          await connection.execute('DROP TABLE IF EXISTS promotions_backup');
          await connection.execute('RENAME TABLE promotions TO promotions_backup');
          
          await connection.execute(`
            CREATE TABLE promotions (
              id VARCHAR(50) PRIMARY KEY,
              phone VARCHAR(20) NOT NULL,
              percentage DECIMAL(5,2) NOT NULL,
              description TEXT,
              usage_limit INT DEFAULT 1,
              usage_count INT DEFAULT 0,
              is_active BOOLEAN DEFAULT TRUE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              INDEX idx_phone (phone)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
          `);
          
          // Migrate data if there was any
          if (promotions.length > 0) {
            console.log(`Migrating ${promotions.length} promotions...`);
            for (const promo of promotions) {
              await connection.execute(
                'INSERT INTO promotions SET ?',
                [{
                  ...promo,
                  id: String(promo.id) // Convert ID to string
                }]
              );
            }
          }
          
          console.log('✅ Promotions table fixed with VARCHAR id');
        } else {
          console.log('✅ Promotions table structure is correct');
        }
      }
    } catch (error) {
      console.error('❌ Error checking/fixing promotions table:', error.message);
      throw error; // Re-throw to be caught by the outer try-catch
    }
    
    console.log('✅ Database auto-repair completed');
    
  } catch (error) {
    console.error('❌ Failed to auto-repair database:', error.message);
  } finally {
    // Always release the connection back to the pool
    if (connection) {
      try {
        await connection.release();
      } catch (releaseError) {
        console.error('❌ Error releasing database connection:', releaseError.message);
      }
    }
  }
};

// Run auto-repair if not in test mode
if (process.env.NODE_ENV !== 'test') {
  autoRepairDatabase();
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
  
  // Gérer les signaux de terminaison pour Docker
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM signal reçu: arrêt gracieux du serveur...');
    server.close(() => {
      console.log('✅ Serveur arrêté avec succès');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('🛑 SIGINT signal reçu: arrêt gracieux du serveur...');
    server.close(() => {
      console.log('✅ Serveur arrêté avec succès');
      process.exit(0);
    });
  });
  
  // Auto-populate shipping data if enabled
  if (process.env.AUTO_POPULATE_SHIPPING === 'true' && apiLoaded) {
    console.log('🔄 Auto-population enabled, starting post-deploy tasks...');
    setTimeout(() => {
      const { spawn } = require('child_process');
      const postDeploy = spawn('node', ['scripts/railway-post-deploy.js'], {
        stdio: 'inherit',
        cwd: __dirname
      });
      
      postDeploy.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Post-deploy completed successfully');
        } else {
          console.error('❌ Post-deploy failed with code:', code);
        }
      });
    }, 5000); // Wait 5 seconds after server start
  }
});

// Handle server errors
server.on('error', (err) => {
  console.error('💥 Server failed to start:', err.message);
  process.exit(1);
});
