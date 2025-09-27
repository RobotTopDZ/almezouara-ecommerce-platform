const express = require('express');
const router = express.Router();
const yalidine = require('../config/yalidine');

// Get all wilayas (provinces)
router.get('/wilayas', async (req, res) => {
  try {
    const wilayas = await yalidine.getWilayas();
    res.json({ success: true, data: wilayas });
  } catch (error) {
    console.error('Error in /api/yalidine/wilayas:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch wilayas' 
    });
  }
});

// Get communes for a wilaya
router.get('/wilayas/:wilayaId/communes', async (req, res) => {
  try {
    const { wilayaId } = req.params;
    const communes = await yalidine.getCommunes(wilayaId);
    res.json({ success: true, data: communes });
  } catch (error) {
    console.error('Error in /api/yalidine/wilayas/:wilayaId/communes:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch communes' 
    });
  }
});

// Calculate shipping fees
router.post('/shipping/calculate', async (req, res) => {
  try {
    const shippingData = req.body;
    const fees = await yalidine.calculateShippingFees(shippingData);
    res.json({ success: true, data: fees });
  } catch (error) {
    console.error('Error in /api/yalidine/shipping/calculate:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to calculate shipping fees' 
    });
  }
});

// Create a new shipment
router.post('/shipments', async (req, res) => {
  try {
    const orderData = req.body;
    const result = await yalidine.createShipment(orderData);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in /api/yalidine/shipments:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create shipment' 
    });
  }
});

// Get shipment status
router.get('/shipments/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const status = await yalidine.getShipmentStatus(trackingNumber);
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('Error in /api/yalidine/shipments/:trackingNumber:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch shipment status' 
    });
  }
});

// Get all shipments with optional filters
router.get('/shipments', async (req, res) => {
  try {
    const filters = req.query;
    const shipments = await yalidine.getShipments(filters);
    res.json({ success: true, data: shipments });
  } catch (error) {
    console.error('Error in /api/yalidine/shipments:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch shipments' 
    });
  }
});

// Update shipment status
router.put('/shipments/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const updateData = req.body;
    const result = await yalidine.updateShipmentStatus(trackingNumber, updateData);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in PUT /api/yalidine/shipments/:trackingNumber:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update shipment status' 
    });
  }
});

// Delete a shipment
router.delete('/shipments/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const result = await yalidine.deleteShipment(trackingNumber);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in DELETE /api/yalidine/shipments/:trackingNumber:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to delete shipment' 
    });
  }
});

module.exports = router;
