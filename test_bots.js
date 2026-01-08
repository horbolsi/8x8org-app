console.log('🧪 Testing Bot System...\n');

// Test 1: File existence
console.log('📁 Test 1: Checking files...');
const files = [
    'bots/wallet_bot/index.js',
    'bots/nft_marketplace/index.js',
    'bots/main_bot/index.js',
    'bots/airdrop_bot/index.js',
    'bots/in_bot/index.js',
    'bots/out_bot/index.js',
    'shared/blockchain.js'
];

files.forEach(file => {
    const fs = require('fs');
    const exists = fs.existsSync(file);
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Test 2: Wallet Bot
console.log('\n🔐 Test 2: Wallet Bot...');
try {
    const WalletBot = require('./bots/wallet_bot/index.js');
    const walletBot = new WalletBot();
    console.log('   ✅ Wallet Bot loaded');
    
    // Quick async test
    setTimeout(async () => {
        const result = await walletBot.getBalance('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
        if (result.success) {
            console.log(`   💰 Test balance: ${result.balance.slice(0, 10)}... ETH`);
        } else {
            console.log(`   ⚠️ Balance test: ${result.error}`);
        }
    }, 1000);
} catch (error) {
    console.log(`   ❌ Wallet Bot: ${error.message}`);
}

// Test 3: NFT Bot
console.log('\n🖼️ Test 3: NFT Bot...');
try {
    const NFTBot = require('./bots/nft_marketplace/index.js');
    const nftBot = new NFTBot();
    console.log('   ✅ NFT Bot loaded');
} catch (error) {
    console.log(`   ❌ NFT Bot: ${error.message}`);
}

// Test 4: Existing bots
console.log('\n🤖 Test 4: Existing Bots...');
['main_bot', 'airdrop_bot', 'in_bot', 'out_bot'].forEach(botName => {
    try {
        require(`./bots/${botName}/index.js`);
        console.log(`   ✅ ${botName} loaded`);
    } catch (error) {
        console.log(`   ⚠️ ${botName}: ${error.message.slice(0, 50)}...`);
    }
});

console.log('\n🎉 TESTS COMPLETED!');
console.log('\n🚀 Start commands:');
console.log('   npm start          # Start all bots');
console.log('   node bots/wallet_bot/index.js    # Start wallet bot');
console.log('   node bots/nft_marketplace/index.js # Start NFT bot');
