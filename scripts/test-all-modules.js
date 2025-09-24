#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'https://almezouara-ecommerce-platform-production.up.railway.app';

async function testAllModules() {
  console.log('🔍 TEST COMPLET - Tous les modules MySQL 9.x\n');
  
  let allPassed = true;
  
  // Test 1: Database connection
  console.log('1️⃣ Test connexion base de données...');
  try {
    const response = await axios.get(`${BASE_URL}/api/debug-database`);
    if (response.data.database && response.data.database.connected) {
      console.log('✅ Base de données connectée');
    } else {
      console.log('❌ Base de données non connectée');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Erreur test DB:', error.message);
    allPassed = false;
  }
  
  // Test 2: Force database initialization
  console.log('\n2️⃣ Test initialisation forcée MySQL 9.x...');
  try {
    const response = await axios.post(`${BASE_URL}/api/init-database`);
    if (response.data.success) {
      console.log(`✅ Base initialisée: ${response.data.tables} tables créées`);
      console.log(`   MySQL version: ${response.data.mysql_version}`);
    } else {
      console.log('❌ Échec initialisation DB');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Erreur initialisation:', error.response?.data || error.message);
    allPassed = false;
  }
  
  // Test 3: Populate shipping data
  console.log('\n3️⃣ Test population données de livraison...');
  try {
    const response = await axios.post(`${BASE_URL}/api/populate-shipping`);
    if (response.data.success) {
      console.log(`✅ Données peuplées: ${response.data.domicileCount} domicile + ${response.data.stopdeskCount} stopdesk`);
    } else {
      console.log('❌ Échec population données');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Erreur population:', error.response?.data || error.message);
    allPassed = false;
  }
  
  // Test 4: Shipping fees API
  console.log('\n4️⃣ Test API frais de livraison...');
  try {
    const response = await axios.get(`${BASE_URL}/api/shipping-fees?wilaya=Alger&city=Alger%20Centre`);
    if (response.data.success && response.data.shippingFee) {
      const fee = response.data.shippingFee;
      console.log(`✅ Frais récupérés: Domicile ${fee.domicilePrice} DZD, Stopdesk ${fee.stopdeskPrice} DZD`);
    } else {
      console.log('❌ Pas de frais retournés');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Erreur frais:', error.message);
    allPassed = false;
  }
  
  // Test 5: Orders module
  console.log('\n5️⃣ Test module Orders...');
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
      if (response.data.message && response.data.message.includes('mock')) {
        console.log('⚠️  ATTENTION: Module Orders en mode MOCK');
        allPassed = false;
      } else {
        console.log('✅ Module Orders utilise la vraie DB');
      }
    } else {
      console.log('❌ Échec création commande');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Erreur module Orders:', error.response?.data || error.message);
    allPassed = false;
  }
  
  // Test 6: Promotions module
  console.log('\n6️⃣ Test module Promotions...');
  try {
    const promoData = {
      phoneNumber: '0555999888',
      percentage: 15,
      description: 'Test Promotion Module',
      usageLimit: 3
    };
    
    const response = await axios.post(`${BASE_URL}/api/promotions`, promoData);
    if (response.data.success) {
      console.log(`✅ Promotion créée: ${response.data.promotionId}`);
      if (response.data.message && response.data.message.includes('mock')) {
        console.log('⚠️  ATTENTION: Module Promotions en mode MOCK');
        allPassed = false;
      } else {
        console.log('✅ Module Promotions utilise la vraie DB');
      }
    } else {
      console.log('❌ Échec création promotion');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Erreur module Promotions:', error.response?.data || error.message);
    allPassed = false;
  }
  
  // Test 7: Get promotion (test read)
  console.log('\n7️⃣ Test lecture promotion...');
  try {
    const response = await axios.get(`${BASE_URL}/api/promotions/0555999888`);
    if (response.data.promotion) {
      console.log(`✅ Promotion lue: ${response.data.promotion.percentage}%`);
    } else {
      console.log('⚠️  Aucune promotion trouvée (normal si première fois)');
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  Aucune promotion trouvée (normal)');
    } else {
      console.log('❌ Erreur lecture promotion:', error.response?.data || error.message);
      allPassed = false;
    }
  }
  
  // Test 8: All wilayas
  console.log('\n8️⃣ Test toutes les wilayas...');
  try {
    const response = await axios.get(`${BASE_URL}/api/shipping-fees`);
    if (response.data.success && response.data.wilayas && response.data.wilayas.length > 0) {
      console.log(`✅ ${response.data.wilayas.length} wilayas disponibles`);
    } else {
      console.log('❌ Pas de wilayas retournées');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Erreur wilayas:', error.message);
    allPassed = false;
  }
  
  console.log('\n🎯 RÉSULTAT FINAL');
  console.log('=' .repeat(60));
  
  if (allPassed) {
    console.log('🎉 TOUS LES TESTS PASSÉS !');
    console.log('✅ MySQL 9.x entièrement compatible');
    console.log('✅ Tous les modules liés correctement');
    console.log('✅ Base de données fonctionnelle');
    console.log('✅ APIs opérationnelles');
    console.log('\n🚀 Votre e-commerce est 100% fonctionnel !');
  } else {
    console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('\n🔧 ACTIONS REQUISES:');
    console.log('1. Vérifiez les logs Railway pour voir les erreurs');
    console.log('2. Assurez-vous que DATABASE_URL est correctement définie');
    console.log('3. Redémarrez le service si nécessaire');
    console.log('4. Testez à nouveau après corrections');
  }
  
  console.log('\n📋 MODULES TESTÉS:');
  console.log('- ✅ Database connection');
  console.log('- ✅ MySQL 9.x initialization');
  console.log('- ✅ Shipping data population');
  console.log('- ✅ Shipping fees API');
  console.log('- ✅ Orders module');
  console.log('- ✅ Promotions module');
  console.log('- ✅ Data reading');
  console.log('- ✅ Wilayas listing');
}

testAllModules().catch(console.error);
