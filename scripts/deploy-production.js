const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config();

console.log('🚀 Starting production deployment...\n');

function runCommand(command, description) {
  console.log(`🔧 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully\n`);
    return true;
  } catch (error) {
    console.error(`❌ Error during ${description}:`, error.message);
    console.log('\n⚠️  Deployment failed. Please check the error above and try again.');
    process.exit(1);
  }
}

// 1. Install dependencies
runCommand('npm install', 'Installing dependencies');

// 2. Run database migrations
runCommand('npm run db:migrate', 'Running database migrations');

// 3. Verify database schema
runCommand('npm run db:verify', 'Verifying database schema');

// 4. Build the application
runCommand('npm run build', 'Building application');

// 5. Start the application
console.log('🚀 Starting the application...');
console.log('   The application should now be running at http://localhost:3000');
console.log('   Press Ctrl+C to stop the application');

// Run the application
const { spawn } = require('child_process');
const app = spawn('node', ['server.js'], { stdio: 'inherit' });

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping the application...');
  app.kill('SIGINT');
  process.exit(0);
});
