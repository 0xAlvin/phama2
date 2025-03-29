const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Running authentication test...');
  
  // Execute with ts-node in CommonJS mode
  execSync('npx ts-node -r tsconfig-paths/register --compilerOptions \'{"module":"CommonJS"}\' src/lib/db/test-auth.ts', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log('Authentication test completed successfully');
} catch (error) {
  console.error('Failed to run authentication test:', error.message);
  process.exit(1);
}
