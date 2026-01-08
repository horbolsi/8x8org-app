const { execSync } = require('child_process');

console.log('Checking dependencies...');

try {
    // Check if node-telegram-bot-api is installed
    require.resolve('node-telegram-bot-api');
    console.log('✓ node-telegram-bot-api is installed');
} catch (e) {
    console.log('✗ node-telegram-bot-api is missing. Installing...');
    try {
        execSync('npm install node-telegram-bot-api --no-save', { stdio: 'inherit' });
        console.log('✓ node-telegram-bot-api installed successfully');
    } catch (installError) {
        console.error('Failed to install node-telegram-bot-api:', installError);
        process.exit(1);
    }
}

// Check other common dependencies
const deps = ['telegraf', 'dotenv', 'axios'];
deps.forEach(dep => {
    try {
        require.resolve(dep);
        console.log(`✓ ${dep} is installed`);
    } catch (e) {
        console.warn(`⚠ ${dep} might be missing`);
    }
});
