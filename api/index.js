const express = require('express');
const cors = require('cors');
const { pool, testConnection, initializeDatabase } = require('./config/database');
const shippingRouter = require('./shipping');

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
const productsRouter = require('./products');
// Shipping router already imported at the top

// Use route modules
// Mount routers without '/api' prefix because this app is mounted at '/api' in server.js
app.use('/orders', ordersRouter);
app.use('/promotions', promotionsRouter);
app.use('/admin', adminRouter);
app.use('/products', productsRouter);
app.use('/shipping', shippingRouter);

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
          prix: parseFloat(fee.prix),
          // Include nom_desk for stopdesk fees
          ...(type === 'stopdesk' && fee.nom_desk ? { nom_desk: fee.nom_desk } : {})
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
      // Get both domicile and stopdesk prices from database
      try {
        if (pool) {
          // Get domicile price
          const [domicileResult] = await pool.execute(
            'SELECT prix FROM domicile_fees WHERE wilaya = ? AND commune = ? LIMIT 1',
            [wilaya, city]
          );
          
          // Get stopdesk price
          const [stopdeskResult] = await pool.execute(
            'SELECT prix FROM stopdesk_fees WHERE wilaya = ? AND commune = ? LIMIT 1',
            [wilaya, city]
          );
          
          if (domicileResult.length > 0) {
            const domicilePrice = parseFloat(domicileResult[0].prix);
            const stopdeskPrice = stopdeskResult.length > 0 ? parseFloat(stopdeskResult[0].prix) : Math.max(200, domicilePrice - 200);
            
            return res.json({
              success: true,
              shippingFee: {
                wilaya,
                city,
                domicilePrice,
                stopdeskPrice
              }
            });
          }
        }
      } catch (dbError) {
        console.error('Database error getting specific shipping fee:', dbError);
      }
      
      // Fallback: Find in loaded data
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
            stopdeskPrice: Math.max(200, shippingFee.prix - 200)
          }
        });
      } else {
        // City not found, return default for wilaya
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
      // Get all cities in wilaya from database
      try {
        if (pool) {
          // Get cities based on delivery type
          if (type === 'stopdesk') {
            // For stopdesk, only get cities that have stopdesk service
            const [cities] = await pool.execute(
              'SELECT DISTINCT commune, prix FROM stopdesk_fees WHERE wilaya = ? ORDER BY commune',
              [wilaya]
            );
            
            if (cities.length > 0) {
              const citiesWithPrices = cities.map(city => ({
                city: city.commune,
                stopdeskPrice: parseFloat(city.prix),
                domicilePrice: null // We don't need domicile price when specifically requesting stopdesk
              }));
              
              return res.json({
                success: true,
                wilaya,
                cities: citiesWithPrices
              });
            }
          } else {
            // For domicile, get all cities with both prices
            const [cities] = await pool.execute(
              'SELECT DISTINCT commune, prix FROM domicile_fees WHERE wilaya = ? ORDER BY commune',
              [wilaya]
            );
            
            if (cities.length > 0) {
              const citiesWithPrices = [];
              
              for (const city of cities) {
                // Get stopdesk price for this city
                const [stopdeskResult] = await pool.execute(
                  'SELECT prix FROM stopdesk_fees WHERE wilaya = ? AND commune = ? LIMIT 1',
                  [wilaya, city.commune]
                );
                
                citiesWithPrices.push({
                  city: city.commune,
                  domicilePrice: parseFloat(city.prix),
                  stopdeskPrice: stopdeskResult.length > 0 ? parseFloat(stopdeskResult[0].prix) : Math.max(200, parseFloat(city.prix) - 200)
                });
              }
              
              return res.json({
                success: true,
                wilaya,
                cities: citiesWithPrices
              });
            }
          }
        }
      } catch (dbError) {
        console.error('Database error getting cities for wilaya:', dbError);
      }
      
      // Fallback: use loaded data
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
            stopdeskPrice: Math.max(200, fee.prix - 200)
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
    status: 'healthy'
  });
});

// Quick migration endpoint
app.post('/api/quick-migrate', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    console.log('🔧 Running quick migration...');
    
    // Drop and recreate orders table with correct structure
    try {
      await pool.execute('DROP TABLE IF EXISTS orders');
      console.log('🗑️ Dropped existing orders table');
    } catch (e) {
      console.log('⚠️ No existing orders table to drop');
    }
    
    // Create tables with correct structure
    const tables = [
      {
        name: 'accounts',
        sql: `CREATE TABLE IF NOT EXISTS accounts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          phone VARCHAR(20) UNIQUE NOT NULL,
          email VARCHAR(255),
          full_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      },
      {
        name: 'categories',
        sql: `CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          image VARCHAR(500),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      },
      {
        name: 'products',
        sql: `CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          category_id INT,
          images TEXT,
          colors TEXT,
          sizes TEXT,
          stock_quantity INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      },
      {
        name: 'orders',
        sql: `CREATE TABLE IF NOT EXISTS orders (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      }
    ];
    
    const results = [];
    
    for (const table of tables) {
      try {
        await pool.execute(table.sql);
        results.push({ table: table.name, status: 'created' });
        console.log(`✅ Table ${table.name} created/verified`);
      } catch (error) {
        console.error(`❌ Error creating ${table.name}:`, error.message);
        results.push({ table: table.name, status: 'error', error: error.message });
      }
    }
    
    // Verify tables
    const [tablesList] = await pool.execute('SHOW TABLES');
    
    res.json({
      success: true,
      message: 'Quick migration completed',
      results,
      tables: tablesList.map(t => Object.values(t)[0])
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
});

// Emergency database fix endpoint
app.post('/api/emergency-fix-orders', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    console.log('🔧 Emergency fixing orders table...');
    
    // Check if items column exists
    try {
      const [columns] = await pool.execute('SHOW COLUMNS FROM orders LIKE ?', ['items']);
      if (columns.length === 0) {
        await pool.execute('ALTER TABLE orders ADD COLUMN items TEXT AFTER delivery_method');
        console.log('✅ Added items column to orders table');
        return res.json({ success: true, message: 'Added items column to orders table' });
      } else {
        return res.json({ success: true, message: 'Orders table already has items column' });
      }
    } catch (error) {
      if (error.code === '42S02') { // Table doesn't exist
        await pool.execute(`
          CREATE TABLE orders (
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
        return res.json({ success: true, message: 'Created orders table with correct structure' });
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ Emergency fix error:', error);
    res.status(500).json({
      error: 'Emergency fix failed',
      details: error.message
    });
  }
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

// Database diagnostic endpoint
app.get('/debug-database', async (req, res) => {
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

// Force database initialization for MySQL 9.x
app.post('/init-database', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    console.log('🔄 Forcing database initialization for MySQL 9.x...');
    
    // Force create database if not exists
    await pool.execute('CREATE DATABASE IF NOT EXISTS railway');
    await pool.execute('USE railway');
    
    // Create tables with MySQL 9.x compatible syntax
    const tables = [
      `CREATE TABLE IF NOT EXISTS accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      `CREATE TABLE IF NOT EXISTS promotions (
        id VARCHAR(50) PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        percentage DECIMAL(5,2) NOT NULL,
        description TEXT,
        usage_limit INT DEFAULT 1,
        usage_count INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_phone (phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      `CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        phone VARCHAR(20),
        date DATE NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'processing',
        delivery_method ENUM('domicile', 'stopdesk') NOT NULL,
        address TEXT NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        wilaya VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        shipping_cost DECIMAL(10,2) NOT NULL,
        product_price DECIMAL(10,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        yalidine_tracking VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_phone (phone),
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      `CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(50) NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        image VARCHAR(500),
        color VARCHAR(100),
        size VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      `CREATE TABLE IF NOT EXISTS stopdesk_fees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom_desk VARCHAR(255) NOT NULL,
        commune VARCHAR(100) NOT NULL,
        wilaya VARCHAR(100) NOT NULL,
        prix DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_wilaya_commune (wilaya, commune)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      `CREATE TABLE IF NOT EXISTS domicile_fees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        commune VARCHAR(100) NOT NULL,
        wilaya VARCHAR(100) NOT NULL,
        prix DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_wilaya_commune (wilaya, commune)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      `CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        image VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
      
      `CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category_id INT,
        images TEXT,
        colors TEXT,
        sizes TEXT,
        stock_quantity INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    ];
    
    for (const tableSQL of tables) {
      await pool.execute(tableSQL);
    }
    
    // Verify tables created
    const [tables_result] = await pool.execute('SHOW TABLES');
    
    res.json({
      success: true,
      message: 'Database initialized successfully for MySQL 9.x',
      tables: tables_result.length,
      mysql_version: '9.4.0',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ 
      error: 'Failed to initialize database', 
      details: error.message,
      mysql_version: '9.4.0'
    });
  }
});

// Populate initial data endpoint
app.post('/populate-data', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    console.log('🌱 Populating initial data via API...');
    
    // 1. Create categories
    const categories = [
      { name: 'Robes', description: 'Collection de robes élégantes' },
      { name: 'Tops & Blouses', description: 'Hauts et blouses tendance' },
      { name: 'Pantalons', description: 'Pantalons et jeans' },
      { name: 'Accessoires', description: 'Bijoux et accessoires' }
    ];
    
    const categoryIds = {};
    for (const category of categories) {
      try {
        const [result] = await pool.execute(
          'INSERT IGNORE INTO categories (name, description) VALUES (?, ?)',
          [category.name, category.description]
        );
        if (result.insertId) {
          categoryIds[category.name] = result.insertId;
        } else {
          // Get existing ID
          const [existing] = await pool.execute(
            'SELECT id FROM categories WHERE name = ?',
            [category.name]
          );
          if (existing.length > 0) {
            categoryIds[category.name] = existing[0].id;
          }
        }
      } catch (error) {
        console.log(`Category ${category.name} already exists`);
      }
    }
    
    // 2. Create sample products
    const products = [
      {
        name: 'Robe Élégante Noire',
        description: 'Robe noire élégante parfaite pour les soirées',
        price: 2500,
        category: 'Robes',
        stock: 15
      },
      {
        name: 'Blouse Florale',
        description: 'Blouse légère avec motifs floraux',
        price: 1800,
        category: 'Tops & Blouses',
        stock: 20
      },
      {
        name: 'Jean Slim Taille Haute',
        description: 'Jean slim confortable taille haute',
        price: 3200,
        category: 'Pantalons',
        stock: 25
      }
    ];
    
    let productsCreated = 0;
    for (const product of products) {
      try {
        const categoryId = categoryIds[product.category];
        if (categoryId) {
          await pool.execute(
            'INSERT IGNORE INTO products (name, description, price, category_id, stock_quantity, images, colors, sizes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              product.name,
              product.description,
              product.price,
              categoryId,
              product.stock,
              JSON.stringify(['/images/products/placeholder.jpg']),
              JSON.stringify(['Noir', 'Blanc']),
              JSON.stringify(['S', 'M', 'L'])
            ]
          );
          productsCreated++;
        }
      } catch (error) {
        console.log(`Product ${product.name} already exists`);
      }
    }
    
    // 3. Verify data
    const [categoriesCount] = await pool.execute('SELECT COUNT(*) as count FROM categories');
    const [productsCount] = await pool.execute('SELECT COUNT(*) as count FROM products');
    
    res.json({
      success: true,
      message: 'Initial data populated successfully',
      data: {
        categories: categoriesCount[0].count,
        products: productsCount[0].count,
        productsCreated
      }
    });
    
  } catch (error) {
    console.error('❌ Error populating data:', error);
    res.status(500).json({
      error: 'Failed to populate data',
      details: error.message
    });
  }
});

// Simple database migration endpoint
app.post('/api/migrate-simple', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    console.log('🔧 Running simple migration...');
    
    // Create tables one by one with simple queries
    const migrations = [
      {
        name: 'accounts',
        sql: `CREATE TABLE IF NOT EXISTS accounts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          phone VARCHAR(20) UNIQUE NOT NULL,
          email VARCHAR(255),
          full_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      },
      {
        name: 'categories', 
        sql: `CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          image VARCHAR(500),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      },
      {
        name: 'products',
        sql: `CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          category_id INT,
          images TEXT,
          colors TEXT,
          sizes TEXT,
          stock_quantity INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      },
      {
        name: 'orders',
        sql: `CREATE TABLE IF NOT EXISTS orders (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      }
    ];
    
    const results = [];
    
    for (const migration of migrations) {
      try {
        await pool.execute(migration.sql);
        results.push({ table: migration.name, status: 'created' });
        console.log(`✅ Table ${migration.name} created/verified`);
      } catch (error) {
        console.error(`❌ Error creating ${migration.name}:`, error.message);
        results.push({ table: migration.name, status: 'error', error: error.message });
      }
    }
    
    // Verify tables
    const [tables] = await pool.execute('SHOW TABLES');
    
    res.json({
      success: true,
      message: 'Migration completed',
      results,
      tables: tables.map(t => Object.values(t)[0])
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
});

// Simple image upload endpoint (mock)
app.post('/upload', (req, res) => {
  // Mock upload - in production you'd use multer + cloud storage
  const mockImageUrl = '/images/products/placeholder-' + Date.now() + '.jpg';
  res.json({ 
    success: true, 
    url: mockImageUrl 
  });
});

app.post('/upload/multiple', (req, res) => {
  // Mock multiple upload
  const mockUrls = [
    '/images/products/placeholder-' + Date.now() + '-1.jpg',
    '/images/products/placeholder-' + Date.now() + '-2.jpg'
  ];
  res.json({ 
    success: true, 
    urls: mockUrls 
  });
});

// Fix database collations for MySQL 9.x compatibility
app.post('/fix-collations', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    console.log('🔧 Fixing database collations for MySQL 9.x...');
    
    // Set all tables to use utf8mb4_0900_ai_ci (MySQL 9.x default)
    const tables = [
      'ALTER TABLE accounts CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci',
      'ALTER TABLE promotions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci',
      'ALTER TABLE orders CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci',
      'ALTER TABLE order_items CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci',
      'ALTER TABLE domicile_fees CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci',
      'ALTER TABLE stopdesk_fees CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci'
    ];
    
    const results = [];
    
    for (const sql of tables) {
      try {
        await pool.execute(sql);
        const tableName = sql.match(/ALTER TABLE (\w+)/)[1];
        results.push({ table: tableName, status: 'success' });
        console.log(`✅ Fixed collation for table: ${tableName}`);
      } catch (error) {
        const tableName = sql.match(/ALTER TABLE (\w+)/)[1];
        results.push({ table: tableName, status: 'error', error: error.message });
        console.log(`⚠️  Error fixing ${tableName}:`, error.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Database collations standardized to utf8mb4_0900_ai_ci',
      results
    });
    
  } catch (error) {
    console.error('❌ Error fixing collations:', error);
    res.status(500).json({
      error: 'Failed to fix collations',
      details: error.message
    });
  }
});

// Fix promotions table schema
app.post('/fix-promotions-table', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    console.log('🔧 Fixing promotions table schema via API...');
    
    // Check current schema
    const [columns] = await pool.execute('DESCRIBE promotions');
    const idColumn = columns.find(c => c.Field === 'id');
    
    if (idColumn && idColumn.Type.includes('int')) {
      console.log('⚠️  ID column is INT, fixing it...');
      
      // Drop and recreate table
      await pool.execute('DROP TABLE IF EXISTS promotions');
      
      await pool.execute(`
        CREATE TABLE promotions (
          id VARCHAR(50) PRIMARY KEY,
          phone VARCHAR(20) NOT NULL,
          percentage DECIMAL(5,2) NOT NULL,
          description TEXT,
          usage_limit INT DEFAULT 1,
          usage_count INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_phone (phone)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ Promotions table schema fixed');
      
      res.json({
        success: true,
        message: 'Promotions table schema fixed successfully',
        action: 'recreated_table',
        old_type: idColumn.Type,
        new_type: 'VARCHAR(50)'
      });
    } else {
      console.log('✅ Promotions table schema already correct');
      res.json({
        success: true,
        message: 'Promotions table schema already correct',
        action: 'no_change_needed',
        current_type: idColumn?.Type || 'unknown'
      });
    }
    
  } catch (error) {
    console.error('❌ Error fixing promotions table:', error);
    res.status(500).json({
      error: 'Failed to fix promotions table',
      details: error.message
    });
  }
});

// Populate shipping data endpoint (admin only)
app.post('/populate-shipping', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    console.log('Starting shipping data population...');
    
    // Import real data
    const { completeDomicileFees } = require('../src/data/completeDomicileData.js');
    const { stopdeskFees } = require('../src/data/shippingData.js');
    
    // Clear existing data
    await pool.execute('DELETE FROM domicile_fees');
    await pool.execute('DELETE FROM stopdesk_fees');
    
    // Insert domicile fees
    let domicileCount = 0;
    for (const fee of completeDomicileFees) {
      await pool.execute(
        'INSERT INTO domicile_fees (commune, wilaya, prix) VALUES (?, ?, ?)',
        [fee.commune, fee.wilaya, fee.prix]
      );
      domicileCount++;
    }
    
    // Insert stopdesk fees
    let stopdeskCount = 0;
    for (const fee of stopdeskFees) {
      await pool.execute(
        'INSERT INTO stopdesk_fees (nom_desk, commune, wilaya, prix) VALUES (?, ?, ?, ?)',
        [fee.nomDesk, fee.commune, fee.wilaya, fee.prix]
      );
      stopdeskCount++;
    }
    
    res.json({
      success: true,
      message: 'Shipping data populated successfully',
      domicileCount,
      stopdeskCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Populate shipping data error:', error);
    res.status(500).json({ error: 'Failed to populate shipping data', details: error.message });
  }
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
