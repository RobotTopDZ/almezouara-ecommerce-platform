const express = require('express');
const cors = require('cors');
const { pool, testConnection, initializeDatabase } = require('./config/database');

// Migration script is required lazily to avoid loading ESM frontend data at startup

const app = express();

// Optimized CORS configuration
// In production, allow origins provided via CORS_ORIGIN (comma-separated). In dev, allow all.
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
  : [];

// More flexible CORS for Railway deployment
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    if (corsOrigins.length === 0) {
      // If no CORS_ORIGIN is set, allow Railway domains and localhost
      if (origin.includes('.up.railway.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    } else {
      // Check against configured origins
      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Optimized JSON parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔄 Starting database initialization...');
    
    // Check if required environment variables are set
    const requiredEnvVars = ['DATABASE_URL', 'DATABASE_HOST'];
    const hasDbUrl = process.env.DATABASE_URL;
    const hasDbHost = process.env.DATABASE_HOST;
    
    if (!hasDbUrl && !hasDbHost) {
      console.error('❌ No database configuration found. Please set DATABASE_URL or DATABASE_HOST environment variables.');
      console.log('ℹ️ API will start without database functionality for health checks');
      return;
    }

    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed - API will start without database functionality');
      return;
    }

    await initializeDatabase();
    console.log('✅ Database tables initialized successfully');

    // Migrate shipping data (optional): enable only when needed to seed DB
    if (process.env.MIGRATE_SHIPPING_DATA === 'true') {
      const { migrateShippingData } = require('./scripts/migrateShippingData');
      await migrateShippingData();
      console.log('✅ Shipping data migration completed successfully');
    } else {
      console.log('ℹ️ Shipping data migration skipped (set MIGRATE_SHIPPING_DATA="true" to enable)');
    }

    console.log('🚀 Application initialized successfully');
  } catch (error) {
    console.error('❌ Application initialization failed:', error.message);
    console.log('ℹ️ API will continue without database functionality');
  }
}

// Start the server (don't await to prevent blocking)
startServer().catch(err => {
  console.error('❌ Server startup error:', err.message);
});

// Import route modules
const ordersRouter = require('./orders');
const promotionsRouter = require('./promotions');
const adminRouter = require('./admin');

// Use route modules
// Mount routers without '/api' prefix because this app is mounted at '/api' in server.js
app.use('/orders', ordersRouter);
app.use('/promotions', promotionsRouter);
app.use('/admin', adminRouter);

// Basic product endpoints
app.get('/products', async (req, res) => {
  try {
    // Mock products data for now - replace with database query
    const products = [
      {
        id: 1,
        name: 'Robe Élégante',
        price: 2500,
        image: '/images/IMG_0630-scaled.jpeg',
        category: 'robes',
        description: 'Belle robe élégante pour toutes occasions'
      },
      {
        id: 2,
        name: 'Ensemble Moderne',
        price: 3200,
        image: '/images/IMG_6710-scaled.jpeg',
        category: 'ensembles',
        description: 'Ensemble moderne et confortable'
      },
      {
        id: 3,
        name: 'Tenue Traditionnelle',
        price: 4500,
        image: '/images/IMG_6789-scaled.jpeg',
        category: 'traditionnel',
        description: 'Tenue traditionnelle avec broderies'
      }
    ];
    
    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Get single product
app.get('/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    // Mock single product - replace with database query
    const product = {
      id: productId,
      name: 'Produit ' + productId,
      price: 2500 + (productId * 100),
      image: '/images/IMG_0630-scaled.jpeg',
      category: 'robes',
      description: 'Description du produit ' + productId,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Noir', 'Blanc', 'Rouge']
    };
    
    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// Get categories
app.get('/categories', async (req, res) => {
  try {
    const categories = [
      { id: 1, name: 'Robes', slug: 'robes', image: '/images/IMG_0630-scaled.jpeg' },
      { id: 2, name: 'Ensembles', slug: 'ensembles', image: '/images/IMG_6710-scaled.jpeg' },
      { id: 3, name: 'Traditionnel', slug: 'traditionnel', image: '/images/IMG_6789-scaled.jpeg' },
      { id: 4, name: 'Moderne', slug: 'moderne', image: '/images/IMG_9260-scaled.jpeg' }
    ];
    
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Create product (admin)
app.post('/products', async (req, res) => {
  try {
    const { name, price, category, description, sizes, colors, image } = req.body || {};
    
    console.log('Product creation attempt:', { name, price, category, description });
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Product name is required' });
    }
    
    if (price === undefined || price === null || isNaN(price)) {
      return res.status(400).json({ error: 'Valid price is required' });
    }
    
    // Mock product creation for testing without database
    const productId = Date.now();
    console.log('Mock product created:', productId);
    
    const newProduct = {
      id: productId,
      name,
      price: parseFloat(price),
      category: category || 'general',
      description: description || '',
      sizes: sizes || ['S', 'M', 'L', 'XL'],
      colors: colors || ['Noir', 'Blanc'],
      image: image || '/images/IMG_0630-scaled.jpeg',
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      productId,
      message: 'Product created successfully (mock mode)',
      product: newProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Get shipping fees by wilaya and city
app.get('/shipping-fees', async (req, res) => {
  try {
    const { wilaya, city, type = 'domicile' } = req.query;
    
    console.log('Shipping fees request:', { wilaya, city, type });
    
    // Try to get from database first
    let shippingFees = [];
    
    try {
      if (pool) {
        const tableName = type === 'stopdesk' ? 'stopdesk_fees' : 'domicile_fees';
        const [dbFees] = await pool.execute(
          `SELECT * FROM ${tableName} ORDER BY wilaya, commune`
        );
        shippingFees = dbFees.map(fee => ({
          wilaya: fee.wilaya,
          commune: fee.commune,
          prix: parseFloat(fee.prix)
        }));
      }
    } catch (dbError) {
      console.log('Database fees not available, using fallback data');
    }
    
    // Fallback to mock data if database is empty
    if (shippingFees.length === 0) {
      shippingFees = [
        { wilaya: 'Alger', commune: 'Alger Centre', prix: 400 },
        { wilaya: 'Alger', commune: 'Bab Ezzouar', prix: 450 },
        { wilaya: 'Alger', commune: 'Birtouta', prix: 500 },
        { wilaya: 'Oran', commune: 'Oran', prix: 600 },
        { wilaya: 'Oran', commune: 'Es Senia', prix: 650 },
        { wilaya: 'Constantine', commune: 'Constantine', prix: 700 },
        { wilaya: 'Blida', commune: 'Blida', prix: 450 },
        { wilaya: 'Annaba', commune: 'Annaba', prix: 800 },
        { wilaya: 'Sétif', commune: 'Sétif', prix: 750 },
        { wilaya: 'Tizi Ouzou', commune: 'Tizi Ouzou', prix: 550 }
      ];
    }
    
    if (wilaya && city) {
      // Find specific city in wilaya
      const shippingFee = shippingFees.find(
        fee => fee.wilaya.toLowerCase() === wilaya.toLowerCase() && 
               fee.commune.toLowerCase() === city.toLowerCase()
      );
      
      if (shippingFee) {
        return res.json({
          success: true,
          shippingFee: {
            wilaya: shippingFee.wilaya,
            city: shippingFee.commune,
            domicilePrice: shippingFee.prix,
            stopdeskPrice: Math.max(0, shippingFee.prix - 200)
          }
        });
      } else {
        // Default shipping fee if not found
        return res.json({
          success: true,
          shippingFee: {
            wilaya,
            city,
            domicilePrice: 500,
            stopdeskPrice: 300
          }
        });
      }
    }
    
    if (wilaya) {
      // Get all cities in wilaya
      const wilayaFees = shippingFees.filter(
        fee => fee.wilaya.toLowerCase() === wilaya.toLowerCase()
      );
      
      if (wilayaFees.length > 0) {
        return res.json({
          success: true,
          wilaya,
          cities: wilayaFees.map(fee => ({
            city: fee.commune,
            domicilePrice: fee.prix,
            stopdeskPrice: Math.max(0, fee.prix - 200)
          }))
        });
      } else {
        // Return default cities for unknown wilaya
        return res.json({
          success: true,
          wilaya,
          cities: [
            { city: wilaya, domicilePrice: 500, stopdeskPrice: 300 }
          ]
        });
      }
    }
    
    // Get all wilayas
    const wilayas = [...new Set(shippingFees.map(fee => fee.wilaya))];
    res.json({
      success: true,
      wilayas: wilayas.sort()
    });
    
  } catch (error) {
    console.error('Get shipping fees error:', error);
    res.status(500).json({ error: 'Failed to get shipping fees' });
  }
});

// Root route for API
app.get('/', (req, res) => {
  res.json({ 
    message: 'Almezouara E-Commerce API is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check with environment diagnostics
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    api: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database_configured: !!(process.env.DATABASE_URL || process.env.DATABASE_HOST),
    port: process.env.PORT || 'not set'
  });
});

// Diagnostic endpoint for Railway debugging
app.get('/debug', (req, res) => {
  res.json({
    status: 'debug_info',
    timestamp: new Date().toISOString(),
    environment_variables: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
      DATABASE_HOST: process.env.DATABASE_HOST || 'not set',
      DATABASE_SSL: process.env.DATABASE_SSL || 'not set',
      CORS_ORIGIN: process.env.CORS_ORIGIN || 'not set'
    },
    process_info: {
      node_version: process.version,
      platform: process.platform,
      memory_usage: process.memoryUsage(),
      uptime: process.uptime()
    }
  });
});

// Database diagnostic endpoint
app.get('/debug/database', async (req, res) => {
  const { testConnection } = require('./config/database');
  
  try {
    const isConnected = await testConnection();
    
    res.json({
      status: 'database_debug',
      timestamp: new Date().toISOString(),
      database: {
        connected: isConnected,
        config: {
          url_provided: !!process.env.DATABASE_URL,
          host: process.env.DATABASE_HOST || 'not set',
          port: process.env.DATABASE_PORT || 'not set',
          database: process.env.DATABASE_NAME || 'not set',
          ssl_enabled: process.env.DATABASE_SSL || 'not set',
          ssl_reject_unauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || 'not set'
        }
      },
      recommendations: isConnected ? [
        'Database is connected and working properly'
      ] : [
        'Create a MySQL service in Railway',
        'Add DATABASE_URL=${{MySQL.MYSQL_URL}} to environment variables',
        'Add DATABASE_SSL=true',
        'Add DATABASE_SSL_REJECT_UNAUTHORIZED=false',
        'Redeploy the application'
      ]
    });
  } catch (error) {
    res.status(500).json({
      status: 'database_debug',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        connected: false,
        error_details: error.message
      }
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Export the app for Vercel
module.exports = app;
