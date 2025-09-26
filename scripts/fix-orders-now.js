#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function fixOrdersTable() {
  console.log('🚀 Starting database repair...');
  
  // Configuration de la connexion à la base de données
  const dbConfig = {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  };

  // Si DATABASE_URL est disponible, l'utiliser à la place
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    Object.assign(dbConfig, {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.replace(/^\//, '')
    });
    dbConfig.ssl = { rejectUnauthorized: false };
  }

  console.log('🔌 Connecting to database...');
  const pool = mysql.createPool(dbConfig);
  
  try {
    // Sauvegarder les données existantes si la table existe
    let existingData = [];
    try {
      const [rows] = await pool.query('SELECT * FROM orders');
      existingData = rows;
      console.log(`📊 Found ${existingData.length} existing orders to preserve`);
    } catch (error) {
      console.log('ℹ️ No existing orders table or error reading it');
    }

    // Supprimer l'ancienne table si elle existe
    console.log('🗑️ Dropping existing orders table...');
    await pool.query('DROP TABLE IF EXISTS orders');

    // Créer la nouvelle table avec la bonne structure
    console.log('🔄 Creating new orders table...');
    await pool.query(`
      CREATE TABLE orders (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Created new orders table with correct structure');

    // Réinsérer les données existantes si nécessaire
    if (existingData.length > 0) {
      console.log('🔄 Restoring existing orders...');
      for (const order of existingData) {
        try {
          await pool.query(
            `INSERT INTO orders SET ?`, 
            {
              ...order,
              // S'assurer que les champs requis sont présents
              items: order.items || '[]',
              status: order.status || 'pending',
              created_at: order.created_at || new Date()
            }
          );
        } catch (error) {
          console.error(`❌ Error restoring order ${order.id}:`, error.message);
        }
      }
      console.log(`✅ Restored ${existingData.length} orders`);
    }

    // Vérifier la structure finale
    const [structure] = await pool.query('DESCRIBE orders');
    console.log('\n📋 Final table structure:');
    console.table(structure.map(({ Field, Type, Null, Key, Default, Extra }) => ({
      Field,
      Type,
      'Nullable': Null,
      'Key': Key || '',
      'Default': Default,
      'Extra': Extra || ''
    })));

    console.log('\n🎉 Database repair completed successfully!');
    
  } catch (error) {
    console.error('❌ Repair failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter la réparation
fixOrdersTable().catch(console.error);
