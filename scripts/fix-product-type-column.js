/**
 * Script pour forcer l'ajout de la colonne product_type à la table products
 * Ce script est conçu pour résoudre l'erreur "Unknown column 'product_type' in 'field list'"
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixProductTypeColumn() {
  console.log('🔧 Démarrage du script de correction pour la colonne product_type...');
  
  let connection;
  
  try {
    // Récupérer l'URL de la base de données depuis les variables d'environnement
    const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
    
    if (!dbUrl) {
      throw new Error('Aucune URL de base de données trouvée dans les variables d\'environnement');
    }
    
    console.log('🔌 Connexion à la base de données MySQL...');
    
    // Créer une connexion à la base de données
    connection = await mysql.createConnection(dbUrl);
    
    console.log('✅ Connexion à la base de données établie');
    
    // Vérifier si la table products existe
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products'
    `);
    
    if (tables.length === 0) {
      throw new Error('La table products n\'existe pas');
    }
    
    // Vérifier si la colonne product_type existe déjà
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'product_type'
    `);
    
    // Si la colonne n'existe pas, l'ajouter
    if (columns.length === 0) {
      console.log('🔄 La colonne product_type n\'existe pas, ajout en cours...');
      
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN product_type VARCHAR(50) DEFAULT 'simple' NOT NULL
      `);
      
      console.log('✅ Colonne product_type ajoutée avec succès');
    } else {
      console.log('ℹ️ La colonne product_type existe déjà');
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
      await connection.end();
      console.log('🔌 Connexion à la base de données fermée');
    }
  }
}

// Exécuter le script
fixProductTypeColumn();