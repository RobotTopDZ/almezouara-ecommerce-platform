#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'https://almezouara-ecommerce-platform-production.up.railway.app';

async function emergencyTest() {
  console.log('🚨 EMERGENCY TEST - Checking current status...\n');
  
  // Test 1: API Health
  console.log('1️⃣ Testing API health...');
  try {
    const response = await axios.get(`${BASE_URL}/api`);
    console.log('✅ API is running:', response.data.message);
  } catch (error) {
    console.log('❌ API failed:', error.message);
    return;
  }
  
  // Test 2: Database connection
  console.log('\n2️⃣ Testing database connection...');
  try {
    const response = await axios.get(`${BASE_URL}/api/debug-database`);
    if (response.data.database && response.data.database.connected) {
      console.log('✅ Database connected');
    } else {
      console.log('❌ Database not connected');
    }
  } catch (error) {
    console.log('❌ Database test failed:', error.response?.status || error.message);
  }
  
  // Test 3: Shipping fees (check if tables are populated)
  console.log('\n3️⃣ Testing shipping fees...');
  try {
    const response = await axios.get(`${BASE_URL}/api/shipping-fees`);
    if (response.data.success && response.data.wilayas && response.data.wilayas.length > 0) {
      console.log(`✅ Shipping data available: ${response.data.wilayas.length} wilayas`);
    } else {
      console.log('❌ Shipping data empty - tables need to be populated');
      console.log('🔧 Run: curl -X POST ' + BASE_URL + '/api/populate-shipping');
    }
  } catch (error) {
    console.log('❌ Shipping fees failed:', error.response?.data || error.message);
  }
  
  // Test 4: Test order creation
  console.log('\n4️⃣ Testing order creation...');
  try {
    const orderData = {
      phoneNumber: '0555999888',
      items: [{ id: 1, name: 'Test Product', price: 2500, quantity: 1 }],
      total: 3000,
      deliveryMethod: 'domicile',
      address: 'Test Address',
      fullName: 'Emergency Test',
      wilaya: 'Alger',
      city: 'Alger Centre',
      shippingCost: 400,
      productPrice: 2500
    };
    
    const response = await axios.post(`${BASE_URL}/api/orders`, orderData);
    if (response.data.success) {
      console.log('✅ Order creation works:', response.data.orderId);
    } else {
      console.log('❌ Order creation failed:', response.data);
    }
  } catch (error) {
    console.log('❌ Order creation failed:', error.response?.data || error.message);
  }
  
  // Test 5: Test promotion creation
  console.log('\n5️⃣ Testing promotion creation...');
  try {
    const promoData = {
      phoneNumber: '0555999888',
      percentage: 10,
      description: 'Emergency Test Promo',
      usageLimit: 1
    };
    
    const response = await axios.post(`${BASE_URL}/api/promotions`, promoData);
    if (response.data.success) {
      console.log('✅ Promotion creation works:', response.data.promotionId);
    } else {
      console.log('❌ Promotion creation failed:', response.data);
    }
  } catch (error) {
    console.log('❌ Promotion creation failed:', error.response?.data || error.message);
  }
  
  console.log('\n🎯 EMERGENCY DIAGNOSIS COMPLETE');
  console.log('=' .repeat(50));
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. If shipping data is empty: curl -X POST ' + BASE_URL + '/api/populate-shipping');
  console.log('2. If database not connected: Check Railway environment variables');
  console.log('3. If orders/promotions fail: Check the logs in Railway');
  console.log('4. Test your website after fixes');
}

emergencyTest().catch(console.error);
