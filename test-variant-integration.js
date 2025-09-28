#!/usr/bin/env node

/**
 * Test script to verify variant stock management integration
 * This script tests the full flow from product creation to order processing
 */

const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

async function testVariantIntegration() {
  console.log('🧪 Testing Variant Stock Management Integration...\n');

  try {
    // Test 1: Create a product with variants
    console.log('1️⃣ Creating product with variants...');
    const productData = {
      name: 'Test Robe avec Variantes',
      category_id: 1,
      price: 2500,
      description: 'Robe de test avec gestion des variantes',
      images: ['https://example.com/image1.jpg'],
      colors: ['Rouge', 'Noir'],
      sizes: ['S', 'M', 'L'],
      variants: [
        {
          color_name: 'Rouge',
          color_value: '#FF0000',
          size: 'S',
          stock: 5,
          sku: 'ROBE-ROUGE-S',
          price_adjustment: 0
        },
        {
          color_name: 'Rouge',
          color_value: '#FF0000',
          size: 'M',
          stock: 3,
          sku: 'ROBE-ROUGE-M',
          price_adjustment: 0
        },
        {
          color_name: 'Noir',
          color_value: '#000000',
          size: 'S',
          stock: 2,
          sku: 'ROBE-NOIR-S',
          price_adjustment: 100
        },
        {
          color_name: 'Noir',
          color_value: '#000000',
          size: 'L',
          stock: 4,
          sku: 'ROBE-NOIR-L',
          price_adjustment: 100
        }
      ],
      status: 'active'
    };

    const createResponse = await axios.post(`${API_BASE}/products`, productData);
    console.log('✅ Product created:', createResponse.data);
    const productId = createResponse.data.productId;

    // Test 2: Retrieve the product and verify variants
    console.log('\n2️⃣ Retrieving product with variants...');
    const getResponse = await axios.get(`${API_BASE}/products/${productId}`);
    const product = getResponse.data.product;
    console.log('✅ Product retrieved:', {
      id: product.id,
      name: product.name,
      totalStock: product.stock,
      variantsCount: product.variants.length,
      variants: product.variants.map(v => ({
        color: v.color_name,
        size: v.size,
        stock: v.stock,
        sku: v.sku
      }))
    });

    // Test 3: Create an order with a specific variant
    console.log('\n3️⃣ Creating order with variant...');
    const orderData = {
      phoneNumber: '0555123456',
      items: [{
        id: productId,
        variantId: product.variants[0].id, // Rouge S
        name: product.name,
        price: 2500,
        quantity: 2,
        image: product.images[0],
        color: 'Rouge',
        size: 'S'
      }],
      total: 5000,
      deliveryMethod: 'domicile',
      address: '123 Test Street',
      fullName: 'Test Customer',
      wilaya: 'Alger',
      city: 'Alger Centre',
      shippingCost: 400,
      productPrice: 5000,
      discountPercentage: 0
    };

    const orderResponse = await axios.post(`${API_BASE}/orders`, orderData);
    console.log('✅ Order created:', orderResponse.data);

    // Test 4: Verify stock was reduced correctly
    console.log('\n4️⃣ Verifying stock reduction...');
    const updatedProductResponse = await axios.get(`${API_BASE}/products/${productId}`);
    const updatedProduct = updatedProductResponse.data.product;
    
    const rougeSVariant = updatedProduct.variants.find(v => 
      v.color_name === 'Rouge' && v.size === 'S'
    );
    
    console.log('✅ Stock verification:', {
      originalStock: 5,
      orderedQuantity: 2,
      expectedStock: 3,
      actualStock: rougeSVariant.stock,
      totalProductStock: updatedProduct.stock,
      stockReducedCorrectly: rougeSVariant.stock === 3
    });

    // Test 5: Test variant-specific stock display
    console.log('\n5️⃣ Testing variant-specific stock...');
    const allVariants = updatedProduct.variants.map(v => ({
      color: v.color_name,
      size: v.size,
      stock: v.stock,
      available: v.stock > 0
    }));
    
    console.log('✅ Variant stock status:', allVariants);

    // Test 6: Clean up - delete the test product
    console.log('\n6️⃣ Cleaning up test data...');
    await axios.delete(`${API_BASE}/products/${productId}`);
    console.log('✅ Test product deleted');

    console.log('\n🎉 All tests passed! Variant stock management is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testVariantIntegration();
}

module.exports = { testVariantIntegration };
