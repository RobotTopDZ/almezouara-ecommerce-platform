/**
 * Script pour forcer l'ajout de la colonne product_type à la table products sur Railway
 * Ce script est conçu pour résoudre l'erreur "Unknown column 'product_type' in 'field list'"
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function forceAddProductTypeColumn() {
  console.log('🚀 Démarrage du script de correction pour Railway...');
  
  let connection;
  
  try {
    // Récupérer l'URL de la base de données depuis les variables d'environnement
    const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
    
    if (!dbUrl) {
      throw new Error('Aucune URL de base de données trouvée dans les variables d\'environnement');
    }
    
    console.log('🔌 Connexion à la base de données MySQL...');
    
    // Créer un pool de connexions avec des options optimisées pour Railway
    const pool = mysql.createPool({
      uri: dbUrl,
      connectionLimit: 5,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      connectTimeout: 10000,
      waitForConnections: true
    });
    
    // Obtenir une connexion du pool
    connection = await pool.getConnection();
    console.log('✅ Connexion à la base de données établie');
    
    // Forcer l'ajout de la colonne sans vérification préalable
    try {
      console.log('🔄 Tentative directe d\'ajout de la colonne product_type...');
      
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN product_type VARCHAR(50) DEFAULT 'simple' NOT NULL
      `);
      
      console.log('✅ Colonne product_type ajoutée avec succès');
    } catch (alterError) {
      // Si la colonne existe déjà, MySQL renverra une erreur
      if (alterError.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ La colonne product_type existe déjà');
      } else {
        // Tentative alternative avec une approche différente
        console.log('⚠️ Première tentative échouée, essai avec une approche alternative...');
        
        try {
          // Vérifier si la colonne existe
          const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'products' 
            AND COLUMN_NAME = 'product_type'
          `);
          
          if (columns.length === 0) {
            // La colonne n'existe pas, on l'ajoute
            await connection.execute(`
              ALTER TABLE products 
              ADD COLUMN product_type VARCHAR(50) DEFAULT 'simple' NOT NULL
            `);
            console.log('✅ Colonne product_type ajoutée avec succès (méthode alternative)');
          } else {
            console.log('ℹ️ La colonne product_type existe déjà (vérification alternative)');
          }
        } catch (secondError) {
          throw new Error(`Échec de l'approche alternative: ${secondError.message}`);
        }
      }
    }
    
    // Vérifier que la colonne a bien été ajoutée
    const [verifyColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'product_type'
    `);
    
    if (verifyColumns.length > 0) {
      console.log('✅ Vérification réussie: la colonne product_type existe maintenant');
    } else {
      throw new Error('Échec de la vérification: la colonne product_type n\'a pas été ajoutée');
    }
    
    // Afficher la structure de la table products
    const [tableInfo] = await connection.execute(`
      DESCRIBE products
    `);
    
    console.log('📊 Structure actuelle de la table products:');
    console.table(tableInfo);
    
    console.log('🎉 Script terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du script:', error);
  } finally {
    if (connection) {
      await connection.release();
      console.log('🔌 Connexion à la base de données libérée');
    }
    
    // Forcer la fin du processus pour éviter les problèmes de connexion persistante
    process.exit(0);
  }
}

// Exécuter le script
forceAddProductTypeColumn();