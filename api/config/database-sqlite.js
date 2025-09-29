const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();

// SQLite database configuration for local development
const dbPath = path.join(__dirname, '..', '..', 'almezouara.db');

let db = null;

// Initialize SQLite database
const initializeSQLite = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('🔧 SQLite database connected successfully');
    
    // Create tables if they don't exist
    await createTables();
    
    return db;
  } catch (error) {
    console.error('❌ SQLite connection error:', error);
    throw error;
  }
};

// Create necessary tables
const createTables = async () => {
  try {
    // Categories table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        color TEXT DEFAULT '#6B7280',
        icon TEXT DEFAULT 'category',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category_id INTEGER,
        images TEXT,
        colors TEXT,
        sizes TEXT,
        stock INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        product_type TEXT DEFAULT 'simple',
        sku TEXT UNIQUE,
        barcode TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    // Product variants table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        color_name TEXT NOT NULL,
        color_value TEXT DEFAULT '#000000',
        size TEXT NOT NULL,
        stock INTEGER DEFAULT 0,
        sku TEXT,
        barcode TEXT,
        price_adjustment DECIMAL(10,2) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(product_id, color_name, size)
      )
    `);

    // Orders table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        phone VARCHAR(20),
        full_name VARCHAR(255),
        wilaya VARCHAR(100),
        city VARCHAR(100),
        address TEXT,
        delivery_method VARCHAR(50),
        total DECIMAL(10,2),
        discount_percentage INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Order items table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        variant_id INTEGER,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (variant_id) REFERENCES product_variants(id)
      )
    `);

    // Shipping fees table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS shipping_fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wilaya TEXT NOT NULL UNIQUE,
        fee DECIMAL(10,2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ SQLite tables created successfully');
    
    // Insert some default data
    await insertDefaultData();
    
  } catch (error) {
    console.error('❌ Error creating SQLite tables:', error);
    throw error;
  }
};

// Insert default data
const insertDefaultData = async () => {
  try {
    // Check if categories exist
    const categoryCount = await db.get('SELECT COUNT(*) as count FROM categories');
    
    if (categoryCount.count === 0) {
      // Insert default categories
      await db.run(`INSERT INTO categories (name, description, color, icon) VALUES 
        ('Robes', 'Robes élégantes pour toutes les occasions', '#FF6B6B', 'dress'),
        ('Hijabs', 'Hijabs modernes et confortables', '#4ECDC4', 'hijab'),
        ('Abayas', 'Abayas traditionnelles et modernes', '#45B7D1', 'abaya'),
        ('Accessoires', 'Accessoires pour compléter votre look', '#96CEB4', 'accessories'),
        ('Chaussures', 'Chaussures confortables et stylées', '#FFEAA7', 'shoes')`);
      
      console.log('✅ Default categories inserted');
    }

    // Check if products exist
    const productCount = await db.get('SELECT COUNT(*) as count FROM products');
    
    if (productCount.count === 0) {
      // Get category IDs
      const categories = await db.all('SELECT id, name FROM categories');
      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat.name] = cat.id;
      });

      // Insert default products
      const products = [
        {
          name: 'Robe Élégante Rouge',
          description: 'Une robe élégante parfaite pour toutes les occasions. Fabriquée avec des matériaux de haute qualité pour un confort optimal.',
          price: 3500.00,
          category: 'Robes',
          images: ['/images/IMG_0630-scaled.jpeg', '/images/IMG_6710-scaled.jpeg', '/images/IMG_6789-scaled.jpeg'],
          colors: ['Rouge', 'Noir', 'Bleu'],
          sizes: ['S', 'M', 'L', 'XL'],
          stock: 15
        },
        {
          name: 'Hijab Moderne Bleu',
          description: 'Hijab moderne et confortable en tissu de qualité supérieure.',
          price: 1200.00,
          category: 'Hijabs',
          images: ['/images/IMG_0630-scaled.jpeg'],
          colors: ['Bleu', 'Noir', 'Blanc'],
          sizes: ['Unique'],
          stock: 25
        },
        {
          name: 'Abaya Traditionnelle',
          description: 'Abaya élégante et traditionnelle pour un style raffiné.',
          price: 4500.00,
          category: 'Abayas',
          images: ['/images/IMG_6710-scaled.jpeg'],
          colors: ['Noir', 'Marron', 'Gris'],
          sizes: ['S', 'M', 'L', 'XL'],
          stock: 10
        },
        {
          name: 'Collier Doré Élégant',
          description: 'Collier élégant plaqué or pour compléter votre look.',
          price: 800.00,
          category: 'Accessoires',
          images: ['/images/IMG_6789-scaled.jpeg'],
          colors: ['Doré', 'Argenté'],
          sizes: ['Unique'],
          stock: 30
        },
        {
          name: 'Escarpins Classiques',
          description: 'Escarpins noirs classiques et confortables.',
          price: 4500.00,
          category: 'Chaussures',
          images: ['/images/IMG_0630-scaled.jpeg'],
          colors: ['Noir', 'Beige', 'Rouge'],
          sizes: ['36', '37', '38', '39', '40'],
          stock: 12
        }
      ];

      for (const product of products) {
        const categoryId = categoryMap[product.category];
        if (categoryId) {
          await db.run(
            `INSERT INTO products (name, description, price, category_id, images, colors, sizes, stock, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
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
        }
      }
      
      console.log('✅ Default products inserted');
    }

    // Check if shipping fees exist
    const shippingCount = await db.get('SELECT COUNT(*) as count FROM shipping_fees');
    
    if (shippingCount.count === 0) {
      // Insert default shipping fees for major Algerian wilayas
      await db.run(`INSERT INTO shipping_fees (wilaya, fee) VALUES 
        ('Alger', 400),
        ('Oran', 500),
        ('Constantine', 600),
        ('Annaba', 650),
        ('Blida', 450),
        ('Batna', 700),
        ('Djelfa', 750),
        ('Sétif', 650),
        ('Sidi Bel Abbès', 600),
        ('Biskra', 800)`);
      
      console.log('✅ Default shipping fees inserted');
    }
    
  } catch (error) {
    console.error('❌ Error inserting default data:', error);
  }
};

// Mock pool interface for compatibility with existing code
const mockPool = {
  execute: async (query, params = []) => {
    if (!db) {
      await initializeSQLite();
    }
    
    // Convert MySQL syntax to SQLite where needed
    let sqliteQuery = query
      .replace(/NOW\(\)/g, "datetime('now')")
      .replace(/AUTO_INCREMENT/g, 'AUTOINCREMENT')
      .replace(/DECIMAL\((\d+),(\d+)\)/g, 'REAL')
      .replace(/BOOLEAN/g, 'INTEGER')
      .replace(/DATETIME/g, 'TEXT');
    
    try {
      if (sqliteQuery.trim().toUpperCase().startsWith('SELECT')) {
        const rows = await db.all(sqliteQuery, params);
        return [rows];
      } else if (sqliteQuery.trim().toUpperCase().startsWith('INSERT')) {
        const result = await db.run(sqliteQuery, params);
        return [{ insertId: result.lastID, affectedRows: result.changes }];
      } else {
        const result = await db.run(sqliteQuery, params);
        return [{ affectedRows: result.changes }];
      }
    } catch (error) {
      console.error('SQLite query error:', error);
      throw error;
    }
  },
  
  getConnection: async () => {
    return {
      execute: mockPool.execute,
      beginTransaction: async () => {
        await db.run('BEGIN TRANSACTION');
      },
      commit: async () => {
        await db.run('COMMIT');
      },
      rollback: async () => {
        await db.run('ROLLBACK');
      },
      release: async () => {
        // No-op for SQLite
      }
    };
  }
};

const testConnection = async () => {
  try {
    if (!db) {
      await initializeSQLite();
    }
    await db.get('SELECT 1');
    console.log('✅ SQLite database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ SQLite connection test failed:', error);
    return false;
  }
};

const initializeDatabase = async () => {
  try {
    await initializeSQLite();
    console.log('✅ SQLite database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ SQLite database initialization failed:', error);
    return false;
  }
};

module.exports = {
  pool: mockPool,
  testConnection,
  initializeDatabase
};