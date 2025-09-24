#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 FORCE DEPLOYMENT - Frontend API Integration');
console.log('=' .repeat(60));

// 1. Clean everything
console.log('\n🧹 Cleaning build cache...');
try {
  if (fs.existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'inherit' });
  }
  if (fs.existsSync('node_modules/.vite')) {
    execSync('rm -rf node_modules/.vite', { stdio: 'inherit' });
  }
  console.log('✅ Cache cleaned');
} catch (error) {
  console.log('⚠️  Cache clean failed (not critical)');
}

// 2. Force rebuild
console.log('\n🔨 Force rebuilding...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// 3. Verify dist folder
console.log('\n🔍 Verifying build...');
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Dist folder not created');
  process.exit(1);
}

const indexPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html not found in dist');
  process.exit(1);
}

console.log('✅ Build verification passed');

// 4. Check for our API integration
console.log('\n🔍 Checking API integration...');
const jsFiles = fs.readdirSync(distPath).filter(f => f.endsWith('.js') && f.startsWith('index-'));
if (jsFiles.length === 0) {
  console.error('❌ No main JS file found');
  process.exit(1);
}

const mainJsPath = path.join(distPath, jsFiles[0]);
const jsContent = fs.readFileSync(mainJsPath, 'utf8');

if (jsContent.includes('/api/shipping-fees')) {
  console.log('✅ API integration found in build');
} else {
  console.log('⚠️  API integration not found in build - this might be the issue');
}

console.log('\n🎯 DEPLOYMENT READY');
console.log('Next steps:');
console.log('1. git add .');
console.log('2. git commit -m "Force rebuild with API integration"');
console.log('3. git push origin main');
console.log('4. Wait 5 minutes for Railway deployment');
console.log('5. Test the frontend');

console.log('\n📋 Files ready for deployment:');
console.log(`- dist/ folder: ${fs.readdirSync(distPath).length} files`);
console.log(`- Main JS: ${jsFiles[0]}`);
console.log(`- Size: ${Math.round(fs.statSync(mainJsPath).size / 1024)} KB`);
