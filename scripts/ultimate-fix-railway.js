/**
 * SCRIPT DE CORRECTION ULTIME POUR RAILWAY
 * Ce script force l'ajout de la colonne product_type à la table products
 * et vérifie que la colonne est bien présente
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function ultimateFixProductType() {
  console.log('🚀 DÉMARRAGE DU SCRIPT DE CORRECTION ULTIME');
  
  let connection;
  
  try {
    // Récupérer l'URL de la base de données
    const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
    
    if (!dbUrl) {
      throw new Error('❌ ERREUR: Aucune URL de base de données trouvée');
    }
    
    console.log('🔌 Connexion à la base de données...');
    
    // Créer une connexion avec des options optimisées pour Railway
    connection = await mysql.createConnection({
      uri: dbUrl,
      multipleStatements: true,
      connectTimeout: 30000,
      waitForConnections: true
    });
    
    console.log('✅ Connexion établie');
    
    // 1. Vérifier si la table products existe
    console.log('🔍 Vérification de l\'existence de la table products...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products'
    `);
    
    if (tables.length === 0) {
      throw new Error('❌ ERREUR: La table products n\'existe pas!');
    }
    
    console.log('✅ La table products existe');
    
    // 2. Vérifier la structure actuelle de la table
    console.log('📊 Affichage de la structure actuelle de la table products:');
    const [tableInfo] = await connection.execute(`DESCRIBE products`);
    console.table(tableInfo);
    
    // 3. Vérifier si la colonne product_type existe déjà
    console.log('🔍 Vérification de l\'existence de la colonne product_type...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'product_type'
    `);
    
    // 4. Forcer l'ajout de la colonne avec plusieurs méthodes
    if (columns.length === 0) {
      console.log('⚠️ La colonne product_type n\'existe pas, tentative d\'ajout...');
      
      try {
        // Méthode 1: ALTER TABLE standard
        console.log('🔄 Méthode 1: ALTER TABLE standard');
        await connection.execute(`
          ALTER TABLE products 
          ADD COLUMN product_type VARCHAR(50) DEFAULT 'simple' NOT NULL
        `);
        console.log('✅ Colonne ajoutée avec succès (Méthode 1)');
      } catch (error1) {
        console.log(`⚠️ Méthode 1 a échoué: ${error1.message}`);
        
        try {
          // Méthode 2: ALTER TABLE avec IF NOT EXISTS (MySQL 8.0.23+)
          console.log('🔄 Méthode 2: ALTER TABLE avec IF NOT EXISTS');
          await connection.execute(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) DEFAULT 'simple' NOT NULL
          `);
          console.log('✅ Colonne ajoutée avec succès (Méthode 2)');
        } catch (error2) {
          console.log(`⚠️ Méthode 2 a échoué: ${error2.message}`);
          
          try {
            // Méthode 3: Procédure stockée dynamique
            console.log('🔄 Méthode 3: Procédure stockée dynamique');
            await connection.execute(`
              SET @dbname = DATABASE();
              SET @tablename = 'products';
              SET @columnname = 'product_type';
              SET @columntype = 'VARCHAR(50) DEFAULT \\'simple\\' NOT NULL';
              SET @stmt = CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' ', @columntype);
              PREPARE dynamic_stmt FROM @stmt;
              EXECUTE dynamic_stmt;
              DEALLOCATE PREPARE dynamic_stmt;
            `);
            console.log('✅ Colonne ajoutée avec succès (Méthode 3)');
          } catch (error3) {
            console.log(`⚠️ Méthode 3 a échoué: ${error3.message}`);
            
            // Méthode 4: Dernière tentative avec une requête brute
            console.log('🔄 Méthode 4: Requête SQL brute');
            try {
              await connection.query('ALTER TABLE products ADD COLUMN product_type VARCHAR(50) DEFAULT "simple" NOT NULL');
              console.log('✅ Colonne ajoutée avec succès (Méthode 4)');
            } catch (error4) {
              console.error('❌ TOUTES LES MÉTHODES ONT ÉCHOUÉ:', error4);
              throw new Error('Impossible d\'ajouter la colonne product_type');
            }
          }
        }
      }
    } else {
      console.log('✅ La colonne product_type existe déjà');
    }
    
    // 5. Vérification finale
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
      throw new Error('❌ ERREUR CRITIQUE: La colonne product_type n\'a pas pu être ajoutée malgré toutes les tentatives');
    }
    
    // 6. Afficher la structure finale de la table
    const [finalTableInfo] = await connection.execute(`DESCRIBE products`);
    console.log('📊 Structure finale de la table products:');
    console.table(finalTableInfo);
    
    console.log('🎉 SCRIPT TERMINÉ AVEC SUCCÈS');
    
  } catch (error) {
    console.error('❌ ERREUR CRITIQUE:', error);
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
ultimateFixProductType();