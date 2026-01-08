const fs = require('fs');
const path = require('path');

console.log('=== SAFE BOT CONFIGURATION VIEWER ===');
console.log('This script shows your configuration without exposing secrets.\n');

// Function to mask sensitive data
function maskString(str, visibleChars = 4) {
    if (!str) return '[NOT SET]';
    if (str.length <= visibleChars * 2) return '[HIDDEN]';
    return str.substring(0, visibleChars) + '****' + str.substring(str.length - visibleChars);
}

// Function to check if file exists
function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch {
        return false;
    }
}

// Check .env file
const envPath = path.join(__dirname, '.env');
console.log('1. ENVIRONMENT FILE:');
if (fileExists(envPath)) {
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        
        const botTokens = {};
        const otherConfigs = [];
        
        lines.forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=');
                
                if (key && value) {
                    const cleanKey = key.trim();
                    const cleanValue = value.trim();
                    
                    if (cleanKey.includes('TOKEN') || cleanKey.includes('KEY') || cleanKey.includes('SECRET')) {
                        botTokens[cleanKey] = cleanValue;
                    } else {
                        otherConfigs.push(`${cleanKey}=${cleanValue}`);
                    }
                }
            }
        });
        
        console.log(`   ✓ .env file exists (${lines.length} lines)`);
        console.log('   Bot Tokens (masked):');
        Object.entries(botTokens).forEach(([key, value]) => {
            console.log(`     ${key}: ${maskString(value)}`);
        });
        
        if (otherConfigs.length > 0) {
            console.log('   Other Configurations:');
            otherConfigs.forEach(config => {
                console.log(`     ${config}`);
            });
        }
    } catch (error) {
        console.log(`   ✗ Error reading .env: ${error.message}`);
    }
} else {
    console.log('   ✗ No .env file found');
}

console.log('\n2. BOT DIRECTORY STRUCTURE:');
const botsDir = path.join(__dirname, 'bots');
if (fileExists(botsDir)) {
    const bots = fs.readdirSync(botsDir);
    console.log(`   Found ${bots.length} bot directories:`);
    bots.forEach(bot => {
        const botPath = path.join(botsDir, bot);
        const stats = fs.statSync(botPath);
        if (stats.isDirectory()) {
            const files = fs.readdirSync(botPath);
            console.log(`   - ${bot}/ (${files.length} files)`);
        }
    });
} else {
    console.log('   ✗ bots directory not found');
}

console.log('\n3. NODE MODULES CHECK:');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fileExists(nodeModulesPath)) {
    const modules = fs.readdirSync(nodeModulesPath);
    console.log(`   ✓ node_modules exists (${modules.length} packages)`);
    
    // Check critical packages
    const criticalPackages = [
        'telegraf', 'node-telegram-bot-api', 'sequelize', 
        'winston', 'axios', 'dotenv', 'ethers'
    ];
    
    console.log('   Critical packages:');
    criticalPackages.forEach(pkg => {
        const pkgPath = path.join(nodeModulesPath, pkg);
        if (fileExists(pkgPath)) {
            console.log(`     ✓ ${pkg}`);
        } else {
            console.log(`     ✗ ${pkg} (missing)`);
        }
    });
} else {
    console.log('   ✗ node_modules not found');
}

console.log('\n4. DATABASE CHECK:');
const dbDir = path.join(__dirname, 'database');
if (fileExists(dbDir)) {
    console.log('   ✓ database directory exists');
    const dbFiles = fs.readdirSync(dbDir);
    dbFiles.forEach(file => {
        console.log(`     - ${file}`);
    });
} else {
    console.log('   ✗ database directory not found');
}

console.log('\n5. CURRENT PROCESS INFO:');
console.log(`   Node.js version: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Current directory: ${process.cwd()}`);
console.log(`   Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);

console.log('\n6. ENVIRONMENT VARIABLES (safe view):');
const envVars = Object.keys(process.env);
const botEnvVars = envVars.filter(key => 
    key.includes('BOT') || 
    key.includes('TOKEN') || 
    key.includes('KEY') ||
    key.includes('SECRET') ||
    key.includes('DATABASE') ||
    key.includes('DB_')
);

if (botEnvVars.length > 0) {
    console.log('   Bot-related environment variables:');
    botEnvVars.forEach(key => {
        const value = process.env[key];
        if (key.includes('TOKEN') || key.includes('KEY') || key.includes('SECRET')) {
            console.log(`     ${key}: ${maskString(value)}`);
        } else {
            console.log(`     ${key}: ${value ? '[SET]' : '[NOT SET]'}`);
        }
    });
} else {
    console.log('   No bot-related environment variables found');
}

console.log('\n=== SUMMARY ===');
console.log('To share this with me, copy the output above.');
console.log('For token issues, check:');
console.log('1. .env file exists and has proper tokens');
console.log('2. Tokens are valid (get from @BotFather)');
console.log('3. All required packages are installed');
console.log('\nTo fix missing dependencies: npm install telegraf sequelize winston axios dotenv');
