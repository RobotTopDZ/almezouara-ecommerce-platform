#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'https://almezouara-ecommerce-platform-production.up.railway.app';

async function diagnoseFrontendIssues() {
  console.log('🔍 DIAGNOSTIC COMPLET - Problèmes Frontend\n');
  
  // Test 1: Database connection
  console.log('1️⃣ Test de connexion base de données...');
  try {
    const response = await axios.get(`${BASE_URL}/api/debug-database`);
    if (response.data.database && response.data.database.connected) {
      console.log('✅ Base de données connectée');
    } else {
      console.log('❌ Base de données non connectée');
      return;
    }
  } catch (error) {
    console.log('❌ Erreur test DB:', error.message);
    return;
  }
  
  // Test 2: Shipping fees - All wilayas
  console.log('\n2️⃣ Test frais de livraison - Toutes les wilayas...');
  try {
    const response = await axios.get(`${BASE_URL}/api/shipping-fees`);
    if (response.data.success && response.data.wilayas) {
      console.log(`✅ ${response.data.wilayas.length} wilayas disponibles`);
      console.log(`   Exemples: ${response.data.wilayas.slice(0, 5).join(', ')}`);
    } else {
      console.log('❌ Pas de wilayas retournées');
    }
  } catch (error) {
    console.log('❌ Erreur wilayas:', error.message);
  }
  
  // Test 3: Shipping fees - Cities for Alger
  console.log('\n3️⃣ Test frais de livraison - Villes d\'Alger...');
  try {
    const response = await axios.get(`${BASE_URL}/api/shipping-fees?wilaya=Alger`);
    if (response.data.success && response.data.cities) {
      console.log(`✅ ${response.data.cities.length} villes à Alger`);
      console.log(`   Exemples: ${response.data.cities.slice(0, 3).map(c => `${c.city} (${c.domicilePrice} DZD)`).join(', ')}`);
    } else {
      console.log('❌ Pas de villes retournées pour Alger');
    }
  } catch (error) {
    console.log('❌ Erreur villes Alger:', error.message);
  }
  
  // Test 4: Specific shipping fee
  console.log('\n4️⃣ Test frais de livraison - Alger Centre spécifique...');
  try {
    const response = await axios.get(`${BASE_URL}/api/shipping-fees?wilaya=Alger&city=Alger%20Centre`);
    if (response.data.success && response.data.shippingFee) {
      const fee = response.data.shippingFee;
      console.log(`✅ Frais pour Alger Centre:`);
      console.log(`   Domicile: ${fee.domicilePrice} DZD`);
      console.log(`   Stopdesk: ${fee.stopdeskPrice} DZD`);
    } else {
      console.log('❌ Pas de frais spécifiques pour Alger Centre');
    }
  } catch (error) {
    console.log('❌ Erreur frais Alger Centre:', error.message);
  }
  
  // Test 5: Order creation
  console.log('\n5️⃣ Test création de commande...');
  try {
    const orderData = {
      phoneNumber: '0555999888',
      items: [{ id: 1, name: 'Test Product', price: 2500, quantity: 1 }],
      total: 3000,
      deliveryMethod: 'domicile',
      address: 'Test Address',
      fullName: 'Test User',
      wilaya: 'Alger',
      city: 'Alger Centre',
      shippingCost: 400,
      productPrice: 2500
    };
    
    const response = await axios.post(`${BASE_URL}/api/orders`, orderData);
    if (response.data.success) {
      console.log(`✅ Commande créée: ${response.data.orderId}`);
      if (response.data.message.includes('mock')) {
        console.log('⚠️  ATTENTION: Commande en mode MOCK (pas sauvegardée en DB)');
      } else {
        console.log('✅ Commande sauvegardée en base de données');
      }
    } else {
      console.log('❌ Échec création commande:', response.data);
    }
  } catch (error) {
    console.log('❌ Erreur création commande:', error.response?.data || error.message);
  }
  
  console.log('\n🎯 DIAGNOSTIC TERMINÉ');
}

diagnoseFrontendIssues().catch(console.error);
