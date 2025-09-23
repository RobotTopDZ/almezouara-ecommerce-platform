#!/usr/bin/env node

/**
 * Railway startup script with enhanced logging and diagnostics
 */

console.log('🚂 Railway Startup Script - Almezouara E-Commerce');
console.log('=' .repeat(50));

// Log environment information
console.log('📊 Environment Information:');
console.log(`- Node Version: ${process.version}`);
console.log(`- Platform: ${process.platform}`);
console.log(`- Architecture: ${process.arch}`);
console.log(`- Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB used`);
console.log(`- Working Directory: ${process.cwd()}`);

// Log environment variables (safely)
console.log('\n🔧 Environment Variables:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`- PORT: ${process.env.PORT || 'not set'}`);
console.log(`- DATABASE_URL: ${process.env.DATABASE_URL ? 'set ✅' : 'not set ❌'}`);
console.log(`- DATABASE_HOST: ${process.env.DATABASE_HOST || 'not set'}`);
console.log(`- DATABASE_SSL: ${process.env.DATABASE_SSL || 'not set'}`);
console.log(`- CORS_ORIGIN: ${process.env.CORS_ORIGIN || 'not set'}`);

// Check for required files
console.log('\n📁 File System Check:');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'package.json',
  'server.js',
  'api/index.js',
  'api/config/database.js',
  'dist/index.html'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`- ${file}: ${exists ? '✅' : '❌'}`);
});

// Start the main server
console.log('\n🚀 Starting main server...');
console.log('=' .repeat(50));

try {
  require('../server.js');
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
