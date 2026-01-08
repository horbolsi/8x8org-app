const fs = require('fs');
const path = require('path');

console.log('=== SHAREABLE BOT CONFIGURATION ===');
console.log('Copy everything below this line:\n');
console.log('----------------------------------------');

// Get basic system info
console.log('System Information:');
console.log(`- Node.js: ${process.version}`);
console.log(`- Platform: ${process.platform}`);
console.log(`- Arch: ${process.arch}`);
console.log(`- CPUs: ${require('os').cpus().length}`);
console.log(`- Memory: ${Math.round(require('os').totalmem() / 1024 / 1024 / 1024)}GB`);

// Check directory structure
console.log('\nDirectory Structure:');
function listDir(dir, prefix = '') {
    try {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    console.log(`${prefix}📁 ${item}/`);
                    // Only go one level deep for bots
                    if (dir.includes('bots') || item === 'bots') {
                        listDir(fullPath, prefix + '  ');
                    }
                } else {
                    console.log(`${prefix}📄 ${item}`);
                }
            } catch (e) {
                console.log(`${prefix}❓ ${item} (error)`);
            }
        });
    } catch (e) {
        console.log(`${prefix}Error reading directory`);
    }
}

listDir('.');

// Check package.json
console.log('\nPackage.json Dependencies:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`- Name: ${packageJson.name || 'Not set'}`);
    console.log(`- Version: ${packageJson.version || 'Not set'}`);
    
    if (packageJson.dependencies) {
        console.log('- Dependencies:');
        Object.keys(packageJson.dependencies).forEach(dep => {
            console.log(`  ${dep}: ${packageJson.dependencies[dep]}`);
        });
    }
    
    if (packageJson.scripts) {
        console.log('- Scripts:');
        Object.keys(packageJson.scripts).forEach(script => {
            console.log(`  ${script}: ${packageJson.scripts[script]}`);
        });
    }
} catch (e) {
    console.log('- No package.json or error reading');
}

// Check for critical files
console.log('\nCritical Files:');
const criticalFiles = [
    '.env', '.env.example', '.gitignore', 'package.json',
    'start_bots_safe.js', 'index.js'
];

criticalFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`${exists ? '✓' : '✗'} ${file}`);
});

// Check bot files
console.log('\nBot Files:');
const botsDir = './bots';
if (fs.existsSync(botsDir)) {
    const bots = fs.readdirSync(botsDir);
    bots.forEach(bot => {
        const botPath = path.join(botsDir, bot);
        if (fs.statSync(botPath).isDirectory()) {
            const hasIndex = fs.existsSync(path.join(botPath, 'index.js'));
            console.log(`${hasIndex ? '✓' : '✗'} bots/${bot}/index.js`);
        }
    });
}

// Environment variable status (without values)
console.log('\nEnvironment Variables Status:');
const envVarsToCheck = [
    'OUT_BOT_TOKEN', 'APP_BOT_TOKEN', 'TELEGRAM_BOT_TOKEN',
    'AIRDROP_BOT_TOKEN', 'IN_BOT_TOKEN', 'WALLET_BOT_TOKEN',
    'NFT_BOT_TOKEN', 'MAIN_BOT_TOKEN',
    'DATABASE_URL', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'
];

envVarsToCheck.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        // Show first 3 and last 3 chars for verification
        const masked = value.length > 6 ? 
            `${value.substring(0, 3)}...${value.substring(value.length - 3)}` : 
            '[SET]';
        console.log(`✓ ${varName}: ${masked}`);
    } else {
        console.log(`✗ ${varName}: NOT SET`);
    }
});

console.log('\nError Details:');
console.log('1. Out Bot failing with: "Telegram Bot Token not provided!"');
console.log('2. Missing winston dependency');
console.log('3. Database models cannot load');
console.log('\nSuggested fixes:');
console.log('1. Add OUT_BOT_TOKEN to .env file');
console.log('2. Run: npm install winston sequelize sqlite3');
console.log('3. Check if database/models exists');

console.log('\n----------------------------------------');
console.log('End of configuration');
