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
        items TEXT,
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
    
    // Create shipping tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS domicile_fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        commune TEXT NOT NULL,
        wilaya TEXT NOT NULL,
        prix DECIMAL(10,2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS stopdesk_fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom_desk TEXT NOT NULL,
        commune TEXT NOT NULL,
        wilaya TEXT NOT NULL,
        prix DECIMAL(10,2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create promotions table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        discount_percentage INTEGER NOT NULL,
        start_date DATETIME,
        end_date DATETIME,
        is_active INTEGER DEFAULT 1,
        usage_limit INTEGER DEFAULT NULL,
        usage_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create accounts table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        name TEXT,
        password TEXT,
        full_name TEXT,
        role TEXT DEFAULT 'customer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
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
        ('Biskra', 800),
        ('Tlemcen', 800),
        ('Béjaïa', 700),
        ('Tizi Ouzou', 600),
        ('Skikda', 750),
        ('Chlef', 700),
        ('Tiaret', 750),
        ('Médéa', 600),
        ('Mostaganem', 700),
        ('Tébessa', 850),
        ('El Oued', 900),
        ('Jijel', 700),
        ('Ouargla', 950),
        ('Bordj Bou Arreridj', 700),
        ('Boumerdès', 500),
        ('Mascara', 750),
        ('Souk Ahras', 800),
        ('M\'Sila', 750),
        ('Guelma', 750),
        ('Relizane', 700),
        ('Khenchela', 800),
        ('Ghardaïa', 900),
        ('El Bayadh', 850),
        ('Naâma', 900),
        ('Tissemsilt', 750),
        ('Mila', 700),
        ('Aïn Defla', 650),
        ('Aïn Témouchent', 750),
        ('Laghouat', 850),
        ('Adrar', 1000),
        ('Béchar', 950),
        ('Tamanrasset', 1200),
        ('Illizi', 1200),
        ('Tindouf', 1100),
        ('El Tarf', 750),
        ('Tipaza', 500),
        ('Saïda', 750)`);
      
      console.log('✅ Default shipping fees inserted');
    }

    // Check if domicile fees exist
    const domicileCount = await db.get('SELECT COUNT(*) as count FROM domicile_fees');
    
    if (domicileCount.count === 0) {
      // Insert default domicile fees for major communes
      await db.run(`INSERT INTO domicile_fees (commune, wilaya, prix) VALUES 
        ('Alger Centre', 'Alger', 400),
        ('Bab Ezzouar', 'Alger', 450),
        ('Hydra', 'Alger', 400),
        ('Bir Mourad Raïs', 'Alger', 400),
        ('El Biar', 'Alger', 400),
        ('Kouba', 'Alger', 450),
        ('Oran', 'Oran', 600),
        ('Es Senia', 'Oran', 650),
        ('Bir El Djir', 'Oran', 600),
        ('Constantine', 'Constantine', 700),
        ('El Khroub', 'Constantine', 750),
        ('Annaba', 'Annaba', 800),
        ('El Bouni', 'Annaba', 850),
        ('Sétif', 'Sétif', 650),
        ('Batna', 'Batna', 750),
        ('Blida', 'Blida', 450),
        ('Ouled Yaich', 'Blida', 500),
        ('Tizi Ouzou', 'Tizi Ouzou', 600),
        ('Béjaïa', 'Béjaïa', 700),
        ('Tlemcen', 'Tlemcen', 800)`);
      
      console.log('✅ Default domicile fees inserted');
    }

    // Check if stopdesk fees exist
    const stopdeskCount = await db.get('SELECT COUNT(*) as count FROM stopdesk_fees');
    
    if (stopdeskCount.count === 0) {
      // Insert default stopdesk fees
      await db.run(`INSERT INTO stopdesk_fees (nom_desk, commune, wilaya, prix) VALUES 
        ('Alger Centre', 'Alger Centre', 'Alger', 300),
        ('Bab Ezzouar', 'Bab Ezzouar', 'Alger', 350),
        ('Hydra', 'Hydra', 'Alger', 300),
        ('Bir Mourad Raïs', 'Bir Mourad Raïs', 'Alger', 300),
        ('Oran Centre', 'Oran', 'Oran', 500),
        ('Es Senia', 'Es Senia', 'Oran', 550),
        ('Constantine Centre', 'Constantine', 'Constantine', 600),
        ('Annaba Centre', 'Annaba', 'Annaba', 700),
        ('Sétif Centre', 'Sétif', 'Sétif', 550),
        ('Batna Centre', 'Batna', 'Batna', 650),
        ('Blida Centre', 'Blida', 'Blida', 350),
        ('Tizi Ouzou Centre', 'Tizi Ouzou', 'Tizi Ouzou', 500),
        ('Béjaïa Centre', 'Béjaïa', 'Béjaïa', 600),
        ('Tlemcen Centre', 'Tlemcen', 'Tlemcen', 700)`);
      
      console.log('✅ Default stopdesk fees inserted');
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