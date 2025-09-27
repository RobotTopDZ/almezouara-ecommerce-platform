const axios = require('axios');

// Yalidine API configuration
const YALIDINE_CONFIG = {
  API_ID: '81907605813574145038',
  API_TOKEN: 'MvHyu5Lnm43rEqdVw2Y6BQjpa1sPOihIC7XU9KGTJZD0SxtNeWoRfF8Abgczkl',
  BASE_URL: 'https://api.yalidine.app/api/v1',
  // Default shipping information
  DEFAULT_SHIPPING: {
    from_wilaya: '16', // Algiers
    to_wilaya: null,   // Will be set per order
    height: 10,        // in cm
    width: 10,         // in cm
    length: 10,        // in cm
    weight: 1,         // in kg
    product_list: [],   // Will be set per order
    fname: '',         // Will be set per order
    lname: '',         // Will be set per order
    contact_phone: '', // Will be set per order
    address: '',       // Will be set per order
    commune: '',       // Will be set per order
    to_commune_id: null, // Will be set per order
    price: 0,          // Will be calculated
    product_list: []    // Will be set per order
  }
};

// Create axios instance for Yalidine API
const yalidineApi = axios.create({
  baseURL: YALIDINE_CONFIG.BASE_URL,
  auth: {
    username: YALIDINE_CONFIG.API_ID,
    password: YALIDINE_CONFIG.API_TOKEN
  },
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Get all available wilayas (provinces)
 */
async function getWilayas() {
  try {
    const response = await yalidineApi.get('/wilayas/');
    return response.data;
  } catch (error) {
    console.error('Error fetching wilayas:', error.response?.data || error.message);
    throw new Error('Failed to fetch wilayas');
  }
}

/**
 * Get communes for a specific wilaya
 * @param {string} wilayaId - The ID of the wilaya
 */
async function getCommunes(wilayaId) {
  try {
    const response = await yalidineApi.get(`/communes/${wilayaId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching communes for wilaya ${wilayaId}:`, error.response?.data || error.message);
    throw new Error('Failed to fetch communes');
  }
}

/**
 * Get delivery fees for a shipment
 * @param {Object} shippingData - Shipping information
 */
async function calculateShippingFees(shippingData) {
  try {
    const data = { ...YALIDINE_CONFIG.DEFAULT_SHIPPING, ...shippingData };
    
    // Convert product list to the required format
    if (data.product_list && data.product_list.length > 0) {
      data.product_list = data.product_list.map(product => ({
        name: product.name || 'Product',
        price: parseFloat(product.price) || 0,
        quantity: parseInt(product.quantity) || 1
      }));
    }

    const response = await yalidineApi.post('/prices/', data);
    return response.data;
  } catch (error) {
    console.error('Error calculating shipping fees:', error.response?.data || error.message);
    throw new Error('Failed to calculate shipping fees');
  }
}

/**
 * Create a new shipment
 * @param {Object} orderData - Order and shipping information
 */
async function createShipment(orderData) {
  try {
    // Prepare the shipment data
    const shipmentData = {
      ...YALIDINE_CONFIG.DEFAULT_SHIPPING,
      order_id: orderData.orderId || `ORDER-${Date.now()}`,
      fname: orderData.firstName || '',
      lname: orderData.lastName || '',
      contact_phone: orderData.phone || '',
      address: orderData.address || '',
      to_wilaya: orderData.wilayaId || '',
      to_commune_id: orderData.communeId || '',
      product_list: orderData.products || [],
      price: orderData.total || 0,
      is_stop_desk: orderData.isStopDesk || false,
      stop_desk_id: orderData.stopDeskId || null,
      product_to_return: orderData.returnProduct || false,
      notes: orderData.notes || '',
      freeshipping: orderData.freeShipping || false
    };

    // Convert product list to the required format
    if (shipmentData.product_list && shipmentData.product_list.length > 0) {
      shipmentData.product_list = shipmentData.product_list.map(product => ({
        name: product.name || 'Product',
        price: parseFloat(product.price) || 0,
        quantity: parseInt(product.quantity) || 1
      }));
    }

    const response = await yalidineApi.post('/shipments/', shipmentData);
    return response.data;
  } catch (error) {
    console.error('Error creating shipment:', error.response?.data || error.message);
    throw new Error('Failed to create shipment');
  }
}

/**
 * Get shipment status
 * @param {string} trackingNumber - The tracking number of the shipment
 */
async function getShipmentStatus(trackingNumber) {
  try {
    const response = await yalidineApi.get(`/shipments/${trackingNumber}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching shipment status:', error.response?.data || error.message);
    throw new Error('Failed to fetch shipment status');
  }
}

/**
 * Get all shipments with optional filters
 * @param {Object} filters - Optional filters (page, status, etc.)
 */
async function getShipments(filters = {}) {
  try {
    const response = await yalidineApi.get('/shipments/', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching shipments:', error.response?.data || error.message);
    throw new Error('Failed to fetch shipments');
  }
}

/**
 * Update shipment status
 * @param {string} trackingNumber - The tracking number of the shipment
 * @param {Object} updateData - The data to update
 */
async function updateShipmentStatus(trackingNumber, updateData) {
  try {
    const response = await yalidineApi.put(`/shipments/${trackingNumber}/`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating shipment status:', error.response?.data || error.message);
    throw new Error('Failed to update shipment status');
  }
}

/**
 * Delete a shipment
 * @param {string} trackingNumber - The tracking number of the shipment to delete
 */
async function deleteShipment(trackingNumber) {
  try {
    const response = await yalidineApi.delete(`/shipments/${trackingNumber}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting shipment:', error.response?.data || error.message);
    throw new Error('Failed to delete shipment');
  }
}

module.exports = {
  getWilayas,
  getCommunes,
  calculateShippingFees,
  createShipment,
  getShipmentStatus,
  getShipments,
  updateShipmentStatus,
  deleteShipment
};
