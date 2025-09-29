const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  let connection;
  try {
    // Connect to the default mysql database to create the application database
    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      port: process.env.DATABASE_PORT || 3306,
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || ''
    });

    const dbName = process.env.DATABASE_NAME || 'almezouara_ecommerce';
    console.log(`Attempting to create database: ${dbName}`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database ${dbName} created or already exists.`);

    console.log(`Granting privileges to user...`);
    await connection.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${process.env.DATABASE_USER}'@'localhost';`);
    await connection.query(`FLUSH PRIVILEGES;`);
    console.log('Privileges granted.');

  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
})();