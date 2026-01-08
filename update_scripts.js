const fs = require('fs');
const path = require('path');

try {
    const packagePath = path.join(__dirname, 'package.json');
    let packageJson = {};
    
    if (fs.existsSync(packagePath)) {
        packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    }
    
    // Ensure scripts section exists
    packageJson.scripts = packageJson.scripts || {};
    
    // Add/update scripts
    const newScripts = {
        "start": "node start_all_bots.js",
        "start:single": "node start_all_bots.js --single",
        "start:wallet": "node start_all_bots.js --wallet-only",
        "start:nft": "node start_all_bots.js --nft-only",
        "test": "node test_bots.js",
        "wallet": "node bots/wallet_bot/index.js",
        "nft": "node bots/nft_marketplace/index.js",
        "integration": "node bots/integration.js",
        "dev": "nodemon start_all_bots.js",
        "monitor": "node monitor_bots.js"
    };
    
    // Merge scripts
    packageJson.scripts = { ...packageJson.scripts, ...newScripts };
    
    // Ensure dependencies exist
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.dependencies.ethers = packageJson.dependencies.ethers || "^6.8.0";
    packageJson.dependencies.axios = packageJson.dependencies.axios || "^1.6.0";
    packageJson.dependencies.dotenv = packageJson.dependencies.dotenv || "^16.3.1";
    
    // Write back
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json with new scripts');
    
    console.log('\n📋 Available Commands:');
    Object.entries(newScripts).forEach(([cmd, script]) => {
        console.log(`   npm run ${cmd.padEnd(15)} - ${script}`);
    });
    
} catch (error) {
    console.error('Error updating package.json:', error.message);
}
