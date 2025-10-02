const express = require('express');
const router = express.Router();
const db = require('../config/database-sqlite');
const YalidineService = require('../services/yalidineService');
const yalidineService = new YalidineService();

// Test API connection
router.get('/test', async (req, res) => {
  try {
    const result = await yalidineService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get wilayas
router.get('/wilayas', async (req, res) => {
  try {
    const result = await yalidineService.getWilayas();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get communes by wilaya
router.get('/communes/:wilayaId', async (req, res) => {
  try {
    const { wilayaId } = req.params;
    const result = await yalidineService.getCommunes(wilayaId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get stopdesk centers by commune
router.get('/centers/:communeId', async (req, res) => {
  try {
    const { communeId } = req.params;
    const result = await yalidineService.getStopdeskCenters(communeId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get shipping fees
router.get('/fees/:fromWilayaId/:toWilayaId', async (req, res) => {
  try {
    const { fromWilayaId, toWilayaId } = req.params;
    const result = await yalidineService.getShippingFees(fromWilayaId, toWilayaId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send order to Yalidine
router.post('/send-order', async (req, res) => {
  try {
    const { orderId, stopdeskId } = req.body;
    
    // Get order details from database
    const order = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande non trouvée' });
    }

    // Get order items
    const orderItems = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM order_items WHERE orderId = ?', [orderId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Add items to order object
    order.items = orderItems;
    
    // If stopdeskId is provided, add it to the order
    if (stopdeskId) {
      order.stopdeskId = stopdeskId;
    }

    // Send to Yalidine
    const result = await yalidineService.createParcel(order);
    
    if (result.success) {
      // Update order status and tracking number in database
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE orders SET status = ?, yalidineTracking = ? WHERE id = ?',
          ['shipped', result.data.tracking_id, orderId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      
      res.json({ 
        success: true, 
        tracking: result.data.tracking_id,
        labelUrl: result.data.label_url
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending order to Yalidine:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;