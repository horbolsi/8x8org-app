console.log('🚀 Starting Multi-Bot System...\n');

const { spawn } = require('child_process');
const fs = require('fs');

const bots = [
    { name: 'Wallet Bot', file: 'bots/wallet_bot/index.js', essential: true },
    { name: 'NFT Bot', file: 'bots/nft_marketplace/index.js', essential: false },
    { name: 'Main Bot', file: 'bots/main_bot/index.js', essential: false },
    { name: 'Airdrop Bot', file: 'bots/airdrop_bot/index.js', essential: false },
    { name: 'In Bot', file: 'bots/in_bot/index.js', essential: false },
    { name: 'Out Bot', file: 'bots/out_bot/index.js', essential: false }
];

const processes = [];

// Start each bot
bots.forEach(bot => {
    if (!fs.existsSync(bot.file)) {
        console.log(`⏭️ Skipping ${bot.name} (file not found)`);
        return;
    }
    
    try {
        console.log(`▶️ Starting ${bot.name}...`);
        const process = spawn('node', [bot.file], {
            stdio: 'inherit',
            detached: false
        });
        
        processes.push({
            name: bot.name,
            process: process,
            pid: process.pid
        });
        
        console.log(`✅ ${bot.name} started (PID: ${process.pid})`);
        
        process.on('close', (code) => {
            console.log(`⚠️ ${bot.name} exited with code ${code}`);
        });
        
    } catch (error) {
        console.log(`❌ Failed to start ${bot.name}: ${error.message}`);
    }
});

console.log(`\n🎉 Started ${processes.length}/${bots.length} bots`);
console.log('\n📊 Active Bots:');
processes.forEach(p => {
    console.log(`   • ${p.name} (PID: ${p.pid})`);
});

console.log('\n💡 Commands:');
console.log('   • npm test    - Run tests');
console.log('   • npm run wallet - Start wallet bot');
console.log('   • npm run nft    - Start NFT bot');

// Keep alive
setInterval(() => {
    // Just keep the process alive
}, 60000);

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    processes.forEach(p => {
        try {
            p.process.kill();
        } catch (e) {
            // Ignore
        }
    });
    process.exit(0);
});
