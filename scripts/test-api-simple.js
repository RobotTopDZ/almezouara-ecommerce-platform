#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'https://almezouara-ecommerce-platform-production.up.railway.app';

async function testSimpleAPI() {
  console.log('🧪 Testing basic API endpoints...\n');
  
  // Test 1: Health check
  console.log('1️⃣ Testing health check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check OK:', response.status);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  // Test 2: API root
  console.log('\n2️⃣ Testing API root...');
  try {
    const response = await axios.get(`${BASE_URL}/api`);
    console.log('✅ API root OK:', response.status);
    console.log('   Response:', response.data.message);
  } catch (error) {
    console.log('❌ API root failed:', error.response?.status, error.response?.data || error.message);
  }
  
  // Test 3: Promotions endpoint
  console.log('\n3️⃣ Testing promotions endpoint...');
  try {
    const response = await axios.post(`${BASE_URL}/api/promotions`, {
      phoneNumber: '0555123456',
      percentage: 10,
      description: 'Test',
      usageLimit: 1
    });
    console.log('✅ Promotions endpoint OK:', response.status);
    console.log('   Response:', response.data);
  } catch (error) {
    console.log('❌ Promotions endpoint failed:', error.response?.status);
    console.log('   Error:', error.response?.data || error.message);
  }
  
  // Test 4: Orders endpoint
  console.log('\n4️⃣ Testing orders endpoint...');
  try {
    const response = await axios.post(`${BASE_URL}/api/orders`, {
      phoneNumber: '0555123456',
      items: [{ id: 1, name: 'Test', price: 100, quantity: 1 }],
      total: 150,
      deliveryMethod: 'domicile',
      address: 'Test',
      fullName: 'Test',
      wilaya: 'Alger',
      city: 'Alger Centre',
      shippingCost: 50
    });
    console.log('✅ Orders endpoint OK:', response.status);
    console.log('   Response:', response.data);
  } catch (error) {
    console.log('❌ Orders endpoint failed:', error.response?.status);
    console.log('   Error:', error.response?.data || error.message);
  }
  
  // Test 5: Shipping fees
  console.log('\n5️⃣ Testing shipping fees...');
  try {
    const response = await axios.get(`${BASE_URL}/api/shipping-fees`);
    console.log('✅ Shipping fees OK:', response.status);
    console.log('   Wilayas available:', response.data.wilayas?.length || 'none');
  } catch (error) {
    console.log('❌ Shipping fees failed:', error.response?.status);
    console.log('   Error:', error.response?.data || error.message);
  }
}

testSimpleAPI().catch(console.error);
