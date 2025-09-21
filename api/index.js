const express = require('express');
const cors = require('cors');
const { pool, testConnection, initializeDatabase } = require('./config/database');
const { migrateShippingData } = require('./scripts/migrateShippingData');

const app = express();

// Optimized CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://your-domain.vercel.app'] : true,
  credentials: true
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

    // Migrate shipping data
    await migrateShippingData();
    console.log('✅ Shipping data migration completed successfully');

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
