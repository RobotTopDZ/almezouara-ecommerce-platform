const express = require('express');
const cors = require('cors');
const { pool, testConnection, initializeDatabase } = require('./config/database');
const { migrateShippingData } = require('./scripts/migrateShippingData');

const app = express();

// Optimized CORS configuration
// In production, allow origins provided via CORS_ORIGIN (comma-separated). In dev, allow all.
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
  : ['https://your-domain.vercel.app'];

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? corsOrigins : true,
  credentials: true,
}));

// Optimized JSON parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database and start server
async function startServer() {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed');
      return;
    }

    await initializeDatabase();
    console.log('✅ Database tables initialized successfully');

    // Migrate shipping data (optional): enable only when needed to seed DB
    if (process.env.MIGRATE_SHIPPING_DATA === 'true') {
      await migrateShippingData();
      console.log('✅ Shipping data migration completed successfully');
    } else {
      console.log('ℹ️ Shipping data migration skipped (set MIGRATE_SHIPPING_DATA="true" to enable)');
    }

    console.log('🚀 Application initialized successfully');
  } catch (error) {
    console.error('❌ Application initialization failed:', error.message);
  }
}

// Start the server
startServer();

// Import route modules
const ordersRouter = require('./orders');
const promotionsRouter = require('./promotions');
const adminRouter = require('./admin');

// Use route modules
app.use('/api/orders', ordersRouter);
app.use('/api/promotions', promotionsRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/', (req, res) => {
  res.send('Backend server is running');
});

// Export the app for Vercel
module.exports = app;
