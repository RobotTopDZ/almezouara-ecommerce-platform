#!/usr/bin/env node

/**
 * Script de migration d'urgence pour corriger la base de données
 * À exécuter directement sur Railway
 */

const mysql = require('mysql2/promise');

async function fixDatabase() {
  console.log('🔧 Fixing database structure...');
  
  const pool = mysql.createPool({
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DATABASE_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ Database connected');
    connection.release();

    // Drop and recreate orders table
    try {
      await pool.execute('DROP TABLE IF EXISTS orders');
      console.log('🗑️ Dropped existing orders table');
    } catch (e) {
      console.log('⚠️ No existing orders table to drop');
    }

    // Create all tables
    const tables = [
      {
        name: 'accounts',
        sql: `CREATE TABLE IF NOT EXISTS accounts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          phone VARCHAR(20) UNIQUE NOT NULL,
          email VARCHAR(255),
          full_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      },
      {
        name: 'categories',
        sql: `CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          image VARCHAR(500),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      },
      {
        name: 'products',
        sql: `CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          category_id INT,
          images TEXT,
          colors TEXT,
          sizes TEXT,
          stock_quantity INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      },
      {
        name: 'orders',
        sql: `CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(50) PRIMARY KEY,
          phone VARCHAR(20),
          full_name VARCHAR(255),
          wilaya VARCHAR(100),
          city VARCHAR(100),
          address TEXT,
          delivery_method VARCHAR(50),
          items TEXT,
          total DECIMAL(10,2),
          discount_percentage INT DEFAULT 0,
          status VARCHAR(50) DEFAULT 'pending',
          yalidine_tracking VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      }
    ];

    for (const table of tables) {
      try {
        await pool.execute(table.sql);
        console.log(`✅ Table ${table.name} created/verified`);
      } catch (error) {
        console.error(`❌ Error creating ${table.name}:`, error.message);
      }
    }

    // Populate sample data
    console.log('🌱 Adding sample data...');
    
    // Categories
    const categories = [
      { name: 'Robes', description: 'Collection de robes élégantes' },
      { name: 'Tops & Blouses', description: 'Hauts et blouses tendance' },
      { name: 'Pantalons', description: 'Pantalons et jeans' },
      { name: 'Accessoires', description: 'Bijoux et accessoires' }
    ];
    
    for (const category of categories) {
      try {
        await pool.execute(
          'INSERT IGNORE INTO categories (name, description) VALUES (?, ?)',
          [category.name, category.description]
        );
        console.log(`✅ Category ${category.name} added`);
      } catch (error) {
        console.log(`⚠️ Category ${category.name} already exists`);
      }
    }

    // Products
    const products = [
      {
        name: 'Robe Élégante Noire',
        description: 'Robe noire élégante parfaite pour les soirées',
        price: 2500,
        category: 'Robes',
        stock: 15
      },
      {
        name: 'Blouse Florale',
        description: 'Blouse légère avec motifs floraux',
        price: 1800,
        category: 'Tops & Blouses',
        stock: 20
      },
      {
        name: 'Jean Slim Taille Haute',
        description: 'Jean slim confortable taille haute',
        price: 3200,
        category: 'Pantalons',
        stock: 25
      }
    ];
    
    // Get category IDs
    const [categoriesResult] = await pool.execute('SELECT id, name FROM categories');
    const categoryMap = {};
    categoriesResult.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
    
    for (const product of products) {
      try {
        const categoryId = categoryMap[product.category];
        if (categoryId) {
          await pool.execute(
            'INSERT IGNORE INTO products (name, description, price, category_id, stock_quantity, images, colors, sizes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              product.name,
              product.description,
              product.price,
              categoryId,
              product.stock,
              JSON.stringify(['/images/products/placeholder.jpg']),
              JSON.stringify(['Noir', 'Blanc']),
              JSON.stringify(['S', 'M', 'L'])
            ]
          );
          console.log(`✅ Product ${product.name} added`);
        }
      } catch (error) {
        console.log(`⚠️ Product ${product.name} already exists`);
      }
    }

    // Verify tables
    const [tables_result] = await pool.execute('SHOW TABLES');
    console.log('📊 Tables in database:', tables_result.map(t => Object.values(t)[0]));

    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixDatabase().catch(console.error);
}

module.exports = { fixDatabase };
