#!/usr/bin/env node

/**
 * Pre-deployment check script for Railway
 * This script validates that all required files and configurations are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running pre-deployment checks...\n');

const checks = [
  {
    name: 'Package.json exists',
    check: () => fs.existsSync('package.json'),
    fix: 'Make sure package.json is in the root directory'
  },
  {
    name: 'Server.js exists',
    check: () => fs.existsSync('server.js'),
    fix: 'Make sure server.js is in the root directory'
  },
  {
    name: 'API directory exists',
    check: () => fs.existsSync('api') && fs.statSync('api').isDirectory(),
    fix: 'Make sure api/ directory exists'
  },
  {
    name: 'API index.js exists',
    check: () => fs.existsSync('api/index.js'),
    fix: 'Make sure api/index.js exists'
  },
  {
    name: 'Database config exists',
    check: () => fs.existsSync('api/config/database.js'),
    fix: 'Make sure api/config/database.js exists'
  },
  {
    name: 'Vite config exists',
    check: () => fs.existsSync('vite.config.js'),
    fix: 'Make sure vite.config.js exists'
  },
  {
    name: 'Source directory exists',
    check: () => fs.existsSync('src') && fs.statSync('src').isDirectory(),
    fix: 'Make sure src/ directory exists'
  },
  {
    name: 'Environment example exists',
    check: () => fs.existsSync('.env.example'),
    fix: 'Create .env.example file with required environment variables'
  }
];

let allPassed = true;

checks.forEach((check, index) => {
  const passed = check.check();
  const status = passed ? '✅' : '❌';
  console.log(`${index + 1}. ${status} ${check.name}`);
  
  if (!passed) {
    console.log(`   💡 Fix: ${check.fix}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 All checks passed! Your app is ready for Railway deployment.');
  console.log('\n📋 Next steps:');
  console.log('1. Push your code to GitHub');
  console.log('2. Create a new Railway project from GitHub');
  console.log('3. Add a MySQL database service');
  console.log('4. Set environment variables (see .env.example)');
  console.log('5. Deploy and monitor logs');
} else {
  console.log('⚠️  Some checks failed. Please fix the issues above before deploying.');
  process.exit(1);
}

console.log('\n🔗 Useful Railway commands:');
console.log('- railway login');
console.log('- railway link');
console.log('- railway up');
console.log('- railway logs');
