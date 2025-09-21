// Database Configuration for Hostinger MySQL/MariaDB
module.exports = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'your_username',
    password: process.env.DB_PASSWORD || 'your_password',
    database: process.env.DB_NAME || 'almezouara_db',
    port: process.env.DB_PORT || 3306
  },
  server: {
    port: process.env.PORT || 5000
  },
  yalidine: {
    apiId: process.env.YALIDINE_API_ID || 'your_api_id',
    apiToken: process.env.YALIDINE_API_TOKEN || 'your_api_token'
  }
};
