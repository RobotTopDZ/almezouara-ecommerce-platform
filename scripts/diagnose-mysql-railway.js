#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function diagnoseMySQLRailway() {
  console.log('🔍 DIAGNOSTIC MYSQL RAILWAY\n');
  
  // Check environment variables
  console.log('📋 Variables d\'environnement :');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Définie' : '❌ Manquante');
  console.log('- DATABASE_HOST:', process.env.DATABASE_HOST || 'Non définie');
  console.log('- DATABASE_PORT:', process.env.DATABASE_PORT || 'Non définie');
  console.log('- DATABASE_USER:', process.env.DATABASE_USER ? '✅ Définie' : '❌ Manquante');
  console.log('- DATABASE_PASSWORD:', process.env.DATABASE_PASSWORD ? '✅ Définie' : '❌ Manquante');
  console.log('- DATABASE_NAME:', process.env.DATABASE_NAME || 'Non définie');
  console.log('- DATABASE_SSL:', process.env.DATABASE_SSL || 'Non définie');
  console.log('');
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL manquante !');
    console.log('🔧 Dans Railway :');
    console.log('1. Allez dans votre service principal');
    console.log('2. Variables → Ajoutez : DATABASE_URL=${{MySQL.MYSQL_URL}}');
    console.log('3. Remplacez "MySQL" par le nom exact de votre service MySQL');
    return;
  }
  
  // Parse DATABASE_URL
  let config;
  try {
    const url = new URL(process.env.DATABASE_URL);
    config = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      ssl: {
        rejectUnauthorized: false
      }
    };
    
    console.log('🔗 Configuration de connexion :');
    console.log('- Host:', config.host);
    console.log('- Port:', config.port);
    console.log('- Database:', config.database);
    console.log('- User:', config.user);
    console.log('- SSL: Activé (rejectUnauthorized: false)');
    console.log('');
    
  } catch (error) {
    console.error('❌ DATABASE_URL invalide :', error.message);
    console.log('🔧 Vérifiez le format : mysql://user:password@host:port/database');
    return;
  }
  
  // Test connection
  console.log('🔌 Test de connexion MySQL...');
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connexion MySQL réussie !');
    
    // Test basic query
    console.log('🧪 Test de requête de base...');
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as current_time');
    console.log('✅ Requête réussie :', rows[0]);
    
    // Check database
    console.log('🗄️ Vérification de la base de données...');
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('✅ Bases de données disponibles :');
    databases.forEach(db => console.log(`   - ${db.Database}`));
    
    // Check if our database exists
    const dbExists = databases.some(db => db.Database === config.database);
    if (!dbExists) {
      console.log(`❌ Base de données "${config.database}" n'existe pas !`);
      console.log('🔧 Création de la base de données...');
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
      console.log('✅ Base de données créée');
    }
    
    // Use our database
    await connection.execute(`USE \`${config.database}\``);
    console.log(`✅ Utilisation de la base "${config.database}"`);
    
    // Check tables
    console.log('📋 Vérification des tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('❌ Aucune table trouvée !');
      console.log('🔧 Les tables doivent être créées par l\'application');
      console.log('💡 Suggestion : Redémarrez votre service principal sur Railway');
    } else {
      console.log('✅ Tables existantes :');
      tables.forEach(table => {
        const tableName = table[`Tables_in_${config.database}`];
        console.log(`   - ${tableName}`);
      });
      
      // Check specific tables
      const requiredTables = ['accounts', 'orders', 'order_items', 'promotions', 'domicile_fees', 'stopdesk_fees'];
      const existingTables = tables.map(t => t[`Tables_in_${config.database}`]);
      
      console.log('🔍 Vérification des tables requises :');
      requiredTables.forEach(table => {
        if (existingTables.includes(table)) {
          console.log(`   ✅ ${table}`);
        } else {
          console.log(`   ❌ ${table} (manquante)`);
        }
      });
      
      // Check data in key tables
      if (existingTables.includes('domicile_fees')) {
        const [domicileCount] = await connection.execute('SELECT COUNT(*) as count FROM domicile_fees');
        console.log(`📊 Frais domicile : ${domicileCount[0].count} entrées`);
      }
      
      if (existingTables.includes('stopdesk_fees')) {
        const [stopdeskCount] = await connection.execute('SELECT COUNT(*) as count FROM stopdesk_fees');
        console.log(`📊 Frais stopdesk : ${stopdeskCount[0].count} entrées`);
      }
      
      if (existingTables.includes('orders')) {
        const [orderCount] = await connection.execute('SELECT COUNT(*) as count FROM orders');
        console.log(`📊 Commandes : ${orderCount[0].count} entrées`);
      }
    }
    
    console.log('\n🎯 DIAGNOSTIC COMPLET');
    console.log('=' .repeat(50));
    
    if (tables.length === 0) {
      console.log('🔧 ACTIONS REQUISES :');
      console.log('1. Redémarrez votre service principal sur Railway');
      console.log('2. Ou exécutez : curl -X POST .../api/populate-shipping');
      console.log('3. Vérifiez les logs de déploiement');
    } else {
      console.log('✅ MySQL Railway est configuré correctement !');
      console.log('🚀 Votre base de données est prête pour l\'application !');
    }
    
  } catch (error) {
    console.error('❌ Erreur MySQL :', error.message);
    console.log('\n🔧 SOLUTIONS :');
    
    if (error.code === 'ENOTFOUND') {
      console.log('- Vérifiez que le service MySQL est actif sur Railway');
      console.log('- Vérifiez le hostname dans DATABASE_URL');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('- Vérifiez les identifiants dans DATABASE_URL');
      console.log('- Recréez la variable DATABASE_URL avec ${{MySQL.MYSQL_URL}}');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('- Le service MySQL n\'accepte pas les connexions');
      console.log('- Redémarrez le service MySQL sur Railway');
    } else {
      console.log('- Vérifiez les paramètres SSL');
      console.log('- Consultez les logs du service MySQL sur Railway');
    }
    
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run diagnosis
diagnoseMySQLRailway().catch(console.error);
