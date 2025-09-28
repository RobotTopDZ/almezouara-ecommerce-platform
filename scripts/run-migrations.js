const db = require('../api/config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    const migrationsPath = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsPath);

    for (const file of files) {
      if (file.endsWith('.js')) {
        const migration = require(path.join(migrationsPath, file));
        if (typeof migration.up === 'function') {
          console.log(`Running migration: ${file}`);
          await migration.up(db); // Pass the db object to the migration
        }
      }
    }

    console.log('All migrations executed successfully.');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

runMigrations();