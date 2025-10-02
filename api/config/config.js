// Configuration file for the application
require('dotenv').config();

// Database configuration
const dbConfig = {
  client: process.env.DB_CLIENT || 'sqlite3',
  connection: {
    filename: process.env.DB_FILENAME || './almezouara.db'
  },
  useNullAsDefault: true
};

// Server configuration
const serverConfig = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development'
};

// Yalidine API configuration
const yalidineConfig = {
  apiId: process.env.YALIDINE_API_ID || '81907605813574145038',
  apiToken: process.env.YALIDINE_API_TOKEN || 'MvHyu5Lnm43rEqdVw2Y6BQjpa1sPOihIC7XU9KGTJZD0SxtNeWoRfF8Abgczkl'
};

module.exports = {
  db: dbConfig,
  server: serverConfig,
  yalidine: yalidineConfig
};
