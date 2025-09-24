#!/usr/bin/env node

const { pool } = require('../api/config/database');

async function populateInitialData() {
  console.log('🌱 Populating initial data...');
  
  try {
    if (!pool) {
      console.error('❌ No database connection');
      process.exit(1);
    }
    
    // 1. Create categories
    console.log('📂 Creating categories...');
    const categories = [
      { name: 'Robes', description: 'Collection de robes élégantes', image: '/images/categories/robes.jpg' },
      { name: 'Tops & Blouses', description: 'Hauts et blouses tendance', image: '/images/categories/tops.jpg' },
      { name: 'Pantalons', description: 'Pantalons et jeans', image: '/images/categories/pantalons.jpg' },
      { name: 'Accessoires', description: 'Bijoux et accessoires', image: '/images/categories/accessoires.jpg' },
      { name: 'Chaussures', description: 'Chaussures pour toutes occasions', image: '/images/categories/chaussures.jpg' }
    ];
    
    for (const category of categories) {
      try {
        await pool.execute(
          'INSERT IGNORE INTO categories (name, description, image) VALUES (?, ?, ?)',
          [category.name, category.description, category.image]
        );
        console.log(`✅ Category created: ${category.name}`);
      } catch (error) {
        console.log(`⚠️  Category ${category.name} already exists`);
      }
    }
    
    // 2. Get category IDs
    const [categoryResults] = await pool.execute('SELECT id, name FROM categories');
    const categoryMap = {};
    categoryResults.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
    
    // 3. Create sample products
    console.log('👗 Creating sample products...');
    const products = [
      {
        name: 'Robe Élégante Noire',
        description: 'Robe noire élégante parfaite pour les soirées',
        price: 2500,
        category: 'Robes',
        images: ['/images/products/robe1-1.jpg', '/images/products/robe1-2.jpg'],
        colors: ['Noir', 'Bleu marine'],
        sizes: ['S', 'M', 'L', 'XL'],
        stock: 15
      },
      {
        name: 'Blouse Florale',
        description: 'Blouse légère avec motifs floraux',
        price: 1800,
        category: 'Tops & Blouses',
        images: ['/images/products/blouse1-1.jpg', '/images/products/blouse1-2.jpg'],
        colors: ['Rose', 'Blanc', 'Bleu'],
        sizes: ['S', 'M', 'L'],
        stock: 20
      },
      {
        name: 'Jean Slim Taille Haute',
        description: 'Jean slim confortable taille haute',
        price: 3200,
        category: 'Pantalons',
        images: ['/images/products/jean1-1.jpg', '/images/products/jean1-2.jpg'],
        colors: ['Bleu', 'Noir'],
        sizes: ['36', '38', '40', '42', '44'],
        stock: 25
      },
      {
        name: 'Collier Doré',
        description: 'Collier élégant plaqué or',
        price: 800,
        category: 'Accessoires',
        images: ['/images/products/collier1-1.jpg'],
        colors: ['Doré', 'Argenté'],
        sizes: ['Unique'],
        stock: 30
      },
      {
        name: 'Escarpins Classiques',
        description: 'Escarpins noirs classiques',
        price: 4500,
        category: 'Chaussures',
        images: ['/images/products/escarpins1-1.jpg', '/images/products/escarpins1-2.jpg'],
        colors: ['Noir', 'Beige', 'Rouge'],
        sizes: ['36', '37', '38', '39', '40'],
        stock: 12
      }
    ];
    
    for (const product of products) {
      try {
        const categoryId = categoryMap[product.category];
        if (!categoryId) {
          console.log(`⚠️  Category ${product.category} not found for ${product.name}`);
          continue;
        }
        
        const [result] = await pool.execute(
          'INSERT INTO products (name, description, price, category_id, images, colors, sizes, stock_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            product.name,
            product.description,
            product.price,
            categoryId,
            JSON.stringify(product.images),
            JSON.stringify(product.colors),
            JSON.stringify(product.sizes),
            product.stock
          ]
        );
        console.log(`✅ Product created: ${product.name} (ID: ${result.insertId})`);
      } catch (error) {
        console.log(`⚠️  Error creating ${product.name}:`, error.message);
      }
    }
    
    // 4. Verify data
    console.log('\n🔍 Verification...');
    const [categoriesCount] = await pool.execute('SELECT COUNT(*) as count FROM categories');
    const [productsCount] = await pool.execute('SELECT COUNT(*) as count FROM products');
    
    console.log(`📊 Categories: ${categoriesCount[0].count}`);
    console.log(`📊 Products: ${productsCount[0].count}`);
    
    console.log('\n🎉 Initial data populated successfully!');
    
  } catch (error) {
    console.error('❌ Error populating data:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

populateInitialData();
