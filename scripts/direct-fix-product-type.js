/**
 * Script direct pour forcer l'ajout de la colonne product_type
 * Ce script utilise une approche directe et agressive pour résoudre le problème
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function directFixProductType() {
  console.log('🚀 Démarrage du script de correction directe');
  
  let connection;
  
  try {
    // Récupérer l'URL de la base de données
    const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
    
    if (!dbUrl) {
      throw new Error('Aucune URL de base de données trouvée');
    }
    
    console.log('🔌 Connexion à la base de données...');
    
    // Créer une connexion directe
    connection = await mysql.createConnection(dbUrl);
    console.log('✅ Connexion établie');
    
    // Approche directe: exécuter la commande ALTER TABLE sans vérification
    try {
      console.log('🔄 Ajout forcé de la colonne product_type...');
      
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN product_type VARCHAR(50) DEFAULT 'simple' NOT NULL
      `);
      
      console.log('✅ Colonne ajoutée avec succès');
    } catch (error) {
      // Si la colonne existe déjà, c'est normal d'avoir une erreur
      console.log(`ℹ️ Résultat de la tentative: ${error.message}`);
      
      // Vérifier si la colonne existe maintenant
      console.log('🔍 Vérification de la présence de la colonne...');
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'products' 
        AND COLUMN_NAME = 'product_type'
      `);
      
      if (columns.length > 0) {
        console.log('✅ La colonne product_type existe déjà');
      } else {
        // Si la colonne n'existe toujours pas, essayer une autre approche
        console.log('⚠️ La colonne n\'existe pas, tentative alternative...');
        
        // Récupérer la structure actuelle de la table
        const [tableInfo] = await connection.execute(`DESCRIBE products`);
        console.log('📊 Structure actuelle de la table:');
        console.table(tableInfo);
        
        // Forcer l'ajout de la colonne avec une autre méthode
        await connection.execute(`
          ALTER TABLE products 
          ADD COLUMN product_type VARCHAR(50) DEFAULT 'simple' NOT NULL
        `);
        
        console.log('✅ Colonne ajoutée avec la méthode alternative');
      }
    }
    
    // Vérification finale
    const [verifyColumns] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'product_type'
    `);
    
    if (verifyColumns.length > 0) {
      console.log('✅ SUCCÈS: La colonne product_type existe maintenant');
      console.log('📊 Détails de la colonne:');
      console.table(verifyColumns);
    } else {
      throw new Error('La colonne product_type n\'a pas pu être ajoutée');
    }
    
    // Afficher la structure complète de la table
    const [tableInfo] = await connection.execute(`DESCRIBE products`);
    console.log('📊 Structure finale de la table products:');
    console.table(tableInfo);
    
    console.log('🎉 Script terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
    
    // Forcer la fin du processus
    process.exit(0);
  }
}

// Exécuter le script
directFixProductType();