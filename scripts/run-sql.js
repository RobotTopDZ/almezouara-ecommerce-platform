#!/usr/bin/env node

const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');

async function runSQLFile(filePath) {
  console.log(`📄 Reading SQL file: ${filePath}`);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // Parse DATABASE_URL if available (Railway format)
  let dbConfig = {
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'railway',
    multipleStatements: true,
    ssl: process.env.DATABASE_SSL === 'true' || process.env.DATABASE_URL ? {
      rejectUnauthorized: false
    } : false
  };

  // If DATABASE_URL is provided, use it instead
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    dbConfig = {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.replace(/^\//, ''),
      multipleStatements: true,
      ssl: { rejectUnauthorized: false }
    };
  }

  console.log('🔌 Connecting to database...');
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🚀 Executing SQL statements...');
    const [results] = await connection.query(sql);
    console.log('✅ SQL executed successfully');
    console.log('Results:', results);
  } catch (error) {
    console.error('❌ Error executing SQL:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Get SQL file path from command line arguments
const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('❌ Please provide an SQL file path');
  process.exit(1);
}

const fullPath = path.isAbsolute(sqlFile) 
  ? sqlFile 
  : path.join(process.cwd(), sqlFile);

runSQLFile(fullPath).catch(console.error);
