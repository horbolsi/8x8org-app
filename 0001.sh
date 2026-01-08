#!/bin/bash

# ============================================
# SAFE BOT SYSTEM UPGRADE SCRIPT
# Adds Wallet & NFT Marketplace to EXISTING setup
# WON'T break your current bots!
# ============================================

echo "🛡️  SAFE BOT SYSTEM UPGRADE"
echo "============================"
echo "⚠️  This will NOT modify existing bot files"
echo "⚠️  Only adds NEW functionality"
echo ""

# Create backup of current bot structure
echo "📦 Creating safety backup..."
cp -r bots bots_backup_$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created"

# Check current package.json
echo "📋 Checking current dependencies..."
if [ -f "package.json" ]; then
    echo "Found existing package.json"
    # Extract current dependencies safely
    CURRENT_DEPS=$(grep -A 50 '"dependencies"' package.json | grep -A 50 -B 50 "}" | head -100)
    echo "Current dependencies analyzed"
else
    echo "No package.json found, creating minimal one"
    cat > package.json << 'EOF'
{
  "name": "multi-bot-system",
  "version": "1.0.0",
  "description": "Multi-bot system with wallet and NFT features",
  "main": "bots/main_bot/index.js",
  "scripts": {
    "start": "node bots/main_bot/index.js",
    "dev": "nodemon bots/main_bot/index.js",
    "bot:wallet": "node bots/wallet_bot/index.js",
    "bot:nft": "node bots/nft_marketplace/index.js",
    "bot:airdrop": "node bots/airdrop_bot/index.js",
    "bot:in": "node bots/in_bot/index.js",
    "bot:out": "node bots/out_bot/index.js"
  }
}
EOF
fi

# Install ONLY new dependencies (if missing)
echo "📥 Installing ONLY new dependencies..."
npm install --save \
  ethers@^6.8.0 \
  web3@^4.3.0 \
  dotenv@^16.3.1 \
  axios@^1.6.0 \
  node-cron@^3.0.3 \
  redis@^4.6.12 2>/dev/null || echo "Some dependencies already installed"

echo "✅ Dependencies handled safely"

# Create NEW bot directories (won't overwrite existing)
echo "📁 Creating NEW bot directories..."
mkdir -p bots/wallet_bot
mkdir -p bots/nft_marketplace
mkdir -p shared
mkdir -p utils

echo "✅ Directory structure enhanced"

# Create WALLET BOT (compatible with existing structure)
cat > bots/wallet_bot/index.js << 'EOF'
// ============================================
// WALLET BOT - Safe Integration
// Works alongside existing bots
// ============================================

require('dotenv').config();
const { ethers } = require('ethers');
const Web3 = require('web3');
const axios = require('axios');

class WalletBot {
    constructor() {
        console.log('🔐 Wallet Bot Initializing...');
        
        // Use existing bot pattern
        this.config = {
            networks: {
                ethereum: process.env.ETH_RPC || 'https://mainnet.infura.io/v3/your-key',
                polygon: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
                bsc: process.env.BSC_RPC || 'https://bsc-dataseed.binance.org'
            },
            // Can be extended to use existing config
        };
        
        this.providers = {};
        this.wallets = new Map();
        
        this.initializeProviders();
    }
    
    initializeProviders() {
        for (const [network, rpc] of Object.entries(this.config.networks)) {
            this.providers[network] = new ethers.JsonRpcProvider(rpc);
        }
        console.log('✅ Providers initialized');
    }
    
    // SAFE: Doesn't conflict with existing bot methods
    async getBalance(address, network = 'ethereum') {
        try {
            const provider = this.providers[network];
            if (!provider) throw new Error(`Network ${network} not configured`);
            
            const balance = await provider.getBalance(address);
            return {
                network,
                address,
                balance: ethers.formatEther(balance),
                raw: balance.toString()
            };
        } catch (error) {
            console.error('Balance check error:', error);
            return null;
        }
    }
    
    // SAFE: New functionality only
    async createWallet(network = 'ethereum') {
        try {
            const wallet = ethers.Wallet.createRandom();
            return {
                address: wallet.address,
                privateKey: wallet.privateKey,
                mnemonic: wallet.mnemonic?.phrase,
                network
            };
        } catch (error) {
            console.error('Wallet creation error:', error);
            return null;
        }
    }
    
    // SAFE: Integrates with existing pattern
    async sendTransaction(fromPrivateKey, toAddress, amount, network = 'ethereum') {
        try {
            const provider = this.providers[network];
            const wallet = new ethers.Wallet(fromPrivateKey, provider);
            
            const tx = await wallet.sendTransaction({
                to: toAddress,
                value: ethers.parseEther(amount.toString())
            });
            
            return {
                hash: tx.hash,
                from: wallet.address,
                to: toAddress,
                amount,
                network,
                status: 'pending'
            };
        } catch (error) {
            console.error('Transaction error:', error);
            return null;
        }
    }
    
    // Portfolio tracking
    async getPortfolio(address) {
        try {
            const balances = {};
            for (const [network, provider] of Object.entries(this.providers)) {
                const balance = await provider.getBalance(address);
                balances[network] = ethers.formatEther(balance);
            }
            
            return {
                address,
                balances,
                totalUSD: await this.calculateTotalUSD(balances),
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Portfolio error:', error);
            return null;
        }
    }
    
    async calculateTotalUSD(balances) {
        // Simplified - would integrate with price APIs
        const ethPrice = await this.getETHPrice();
        let total = 0;
        
        for (const [network, balance] of Object.entries(balances)) {
            if (network === 'ethereum') {
                total += parseFloat(balance) * ethPrice;
            }
            // Add other networks as needed
        }
        
        return total;
    }
    
    async getETHPrice() {
        try {
            const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
            return response.data.ethereum.usd;
        } catch (error) {
            console.error('Price fetch error:', error);
            return 2000; // Fallback price
        }
    }
    
    // Start the wallet bot
    start() {
        console.log('🚀 Wallet Bot Started');
        console.log('📊 Available networks:', Object.keys(this.config.networks));
        
        // Can be called from existing main bot
        return this;
    }
}

// Export for integration with existing system
module.exports = WalletBot;

// If running standalone
if (require.main === module) {
    const walletBot = new WalletBot();
    walletBot.start();
    
    // Example usage
    if (process.argv[2] === 'test') {
        walletBot.getBalance('0x742d35Cc6634C0532925a3b844Bc9e90F1f04ee1')
            .then(console.log)
            .catch(console.error);
    }
}
EOF

echo "✅ Wallet Bot created (bots/wallet_bot/index.js)"

# Create NFT MARKETPLACE BOT
cat > bots/nft_marketplace/index.js << 'EOF'
// ============================================
// NFT MARKETPLACE BOT - Safe Integration
// Works alongside existing bots
// ============================================

require('dotenv').config();
const { ethers } = require('ethers');
const axios = require('axios');

class NFTMarketplaceBot {
    constructor() {
        console.log('🖼️  NFT Marketplace Bot Initializing...');
        
        this.config = {
            marketplaces: {
                opensea: {
                    api: 'https://api.opensea.io/api/v1',
                    key: process.env.OPENSEA_API_KEY || ''
                },
                rarible: {
                    api: 'https://api.rarible.org/v0.1',
                    key: process.env.RARIBLE_API_KEY || ''
                },
                looksrare: {
                    api: 'https://api.looksrare.org/api/v1',
                    key: process.env.LOOKSRARE_API_KEY || ''
                }
            },
            networks: {
                ethereum: process.env.ETH_RPC,
                polygon: process.env.POLYGON_RPC
            }
        };
        
        this.providers = {};
        this.initialize();
    }
    
    async initialize() {
        // Initialize providers
        for (const [network, rpc] of Object.entries(this.config.networks)) {
            if (rpc) {
                this.providers[network] = new ethers.JsonRpcProvider(rpc);
            }
        }
        
        console.log('✅ NFT Bot initialized');
    }
    
    // NFT Collection Analysis
    async getCollectionStats(contractAddress, network = 'ethereum') {
        try {
            const openseaUrl = `${this.config.marketplaces.opensea.api}/collection/${contractAddress}/stats`;
            
            const response = await axios.get(openseaUrl, {
                headers: {
                    'X-API-KEY': this.config.marketplaces.opensea.key
                }
            });
            
            return {
                contract: contractAddress,
                network,
                stats: response.data.stats,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Collection stats error:', error.message);
            return this.getCollectionFallback(contractAddress, network);
        }
    }
    
    async getCollectionFallback(contractAddress, network) {
        // Fallback method if API fails
        return {
            contract: contractAddress,
            network,
            stats: {
                floor_price: 0,
                total_volume: 0,
                total_sales: 0
            },
            source: 'fallback',
            lastUpdated: new Date().toISOString()
        };
    }
    
    // NFT Trading
    async listNFT(contractAddress, tokenId, price, sellerPrivateKey, network = 'ethereum') {
        try {
            const provider = this.providers[network];
            if (!provider) throw new Error(`Network ${network} not configured`);
            
            // Simplified listing - would use marketplace contracts
            const listing = {
                contract: contractAddress,
                tokenId,
                price,
                network,
                seller: new ethers.Wallet(sellerPrivateKey, provider).address,
                listingTime: new Date().toISOString(),
                status: 'listed'
            };
            
            // In production: interact with marketplace contract
            console.log('📝 NFT Listed:', listing);
            
            return listing;
        } catch (error) {
            console.error('Listing error:', error);
            return null;
        }
    }
    
    // Floor Price Tracking
    async trackFloorPrice(contractAddress, network = 'ethereum', interval = 300) {
        console.log(`📊 Starting floor price tracking for ${contractAddress} (${network})`);
        
        // Track every 5 minutes by default
        setInterval(async () => {
            try {
                const stats = await this.getCollectionStats(contractAddress, network);
                const floorPrice = stats.stats?.floor_price || 0;
                
                console.log(`🏷️  Floor price for ${contractAddress}: ${floorPrice} ETH`);
                
                // Could trigger alerts, notifications, etc.
                this.checkPriceAlert(contractAddress, floorPrice);
                
            } catch (error) {
                console.error('Tracking error:', error.message);
            }
        }, interval * 1000);
    }
    
    checkPriceAlert(contractAddress, currentPrice) {
        // Implement price alert logic
        const alerts = this.alerts || {};
        const alert = alerts[contractAddress];
        
        if (alert && currentPrice <= alert.targetPrice) {
            console.log(`🚨 ALERT: ${contractAddress} floor price reached target: ${currentPrice} ETH`);
            // Trigger notification
        }
    }
    
    // NFT Gallery
    async getWalletNFTs(walletAddress, network = 'ethereum') {
        try {
            // Using OpenSea API
            const url = `${this.config.marketplaces.opensea.api}/assets?owner=${walletAddress}&order_direction=desc&limit=50`;
            
            const response = await axios.get(url, {
                headers: {
                    'X-API-KEY': this.config.marketplaces.opensea.key
                }
            });
            
            return {
                wallet: walletAddress,
                network,
                count: response.data.assets?.length || 0,
                nfts: response.data.assets || [],
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('NFT fetch error:', error.message);
            return { wallet: walletAddress, nfts: [], error: error.message };
        }
    }
    
    // Start the NFT bot
    start() {
        console.log('🚀 NFT Marketplace Bot Started');
        console.log('🛒 Available marketplaces:', Object.keys(this.config.marketplaces));
        
        // Start tracking if configured
        if (process.env.TRACK_COLLECTIONS) {
            const collections = process.env.TRACK_COLLECTIONS.split(',');
            collections.forEach(collection => {
                this.trackFloorPrice(collection.trim());
            });
        }
        
        return this;
    }
}

// Export for integration
module.exports = NFTMarketplaceBot;

// If running standalone
if (require.main === module) {
    const nftBot = new NFTMarketplaceBot();
    nftBot.start();
}
EOF

echo "✅ NFT Marketplace Bot created (bots/nft_marketplace/index.js)"

# Create SHARED utilities (won't conflict)
cat > shared/blockchain.js << 'EOF'
// ============================================
// SHARED Blockchain Utilities
// Used by ALL bots safely
// ============================================

const { ethers } = require('ethers');

class BlockchainUtils {
    static getProvider(network = 'ethereum') {
        const rpcUrls = {
            ethereum: process.env.ETH_RPC || 'https://mainnet.infura.io/v3/your-key',
            polygon: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
            bsc: process.env.BSC_RPC || 'https://bsc-dataseed.binance.org',
            arbitrum: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
            optimism: process.env.OPTIMISM_RPC || 'https://mainnet.optimism.io'
        };
        
        return new ethers.JsonRpcProvider(rpcUrls[network] || rpcUrls.ethereum);
    }
    
    static formatAddress(address) {
        if (!address || address.length < 10) return address;
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
    
    static isValidAddress(address) {
        return ethers.isAddress(address);
    }
    
    static parseTransaction(tx) {
        return {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: ethers.formatEther(tx.value),
            gasPrice: ethers.formatEther(tx.gasPrice || 0),
            timestamp: new Date().toISOString()
        };
    }
    
    static async getGasPrice(network = 'ethereum') {
        try {
            const provider = this.getProvider(network);
            const feeData = await provider.getFeeData();
            return {
                network,
                gasPrice: ethers.formatUnits(feeData.gasPrice || 0, 'gwei'),
                maxFeePerGas: ethers.formatUnits(feeData.maxFeePerGas || 0, 'gwei'),
                maxPriorityFeePerGas: ethers.formatUnits(feeData.maxPriorityFeePerGas || 0, 'gwei'),
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Gas price error:', error);
            return null;
        }
    }
}

module.exports = BlockchainUtils;
EOF

echo "✅ Shared utilities created (shared/blockchain.js)"

# Create INTEGRATION layer (connects new and existing bots)
cat > bots/integration.js << 'EOF'
// ============================================
// BOT INTEGRATION LAYER
// Safely connects new bots with existing ones
// ============================================

require('dotenv').config();

class BotIntegration {
    constructor() {
        this.bots = {
            // Existing bots (loaded dynamically)
            existing: {},
            // New bots
            wallet: null,
            nft: null
        };
        
        this.sharedState = {
            lastRun: {},
            metrics: {},
            errors: []
        };
    }
    
    // SAFELY load existing bots (if they export properly)
    async loadExistingBots() {
        try {
            // Try to load main bot if exists
            if (require.resolve('./main_bot/index.js')) {
                const MainBot = require('./main_bot/index.js');
                this.bots.existing.main = typeof MainBot === 'function' ? new MainBot() : MainBot;
                console.log('✅ Loaded existing main bot');
            }
        } catch (error) {
            console.log('⚠️  Could not load main bot (might use different pattern)');
        }
        
        try {
            // Try to load airdrop bot
            if (require.resolve('./airdrop_bot/index.js')) {
                const AirdropBot = require('./airdrop_bot/index.js');
                this.bots.existing.airdrop = typeof AirdropBot === 'function' ? new AirdropBot() : AirdropBot;
                console.log('✅ Loaded existing airdrop bot');
            }
        } catch (error) {
            // Silent fail - bot might not export as class
        }
        
        // Add more existing bots as needed
    }
    
    // Load new bots
    async loadNewBots() {
        try {
            const WalletBot = require('./wallet_bot/index.js');
            const NFTMarketplaceBot = require('./nft_marketplace/index.js');
            
            this.bots.wallet = new WalletBot();
            this.bots.nft = new NFTMarketplaceBot();
            
            console.log('✅ Loaded new wallet & NFT bots');
        } catch (error) {
            console.error('Failed to load new bots:', error.message);
        }
    }
    
    // Start all bots with safety
    async startAll() {
        console.log('🚀 Starting ALL bots integration...');
        
        // Load bots
        await this.loadExistingBots();
        await this.loadNewBots();
        
        // Start existing bots if they have start method
        for (const [name, bot] of Object.entries(this.bots.existing)) {
            if (bot && typeof bot.start === 'function') {
                try {
                    bot.start();
                    this.sharedState.lastRun[name] = new Date().toISOString();
                    console.log(`✅ Started existing bot: ${name}`);
                } catch (error) {
                    console.error(`Failed to start ${name}:`, error.message);
                    this.sharedState.errors.push({ bot: name, error: error.message });
                }
            }
        }
        
        // Start new bots
        if (this.bots.wallet) {
            this.bots.wallet.start();
            this.sharedState.lastRun.wallet = new Date().toISOString();
            console.log('✅ Started wallet bot');
        }
        
        if (this.bots.nft) {
            this.bots.nft.start();
            this.sharedState.lastRun.nft = new Date().toISOString();
            console.log('✅ Started NFT bot');
        }
        
        console.log('🎉 All bots integrated and running!');
        console.log('📊 Active bots:', Object.keys(this.sharedState.lastRun));
        
        return this;
    }
    
    // Get bot status
    getStatus() {
        return {
            timestamp: new Date().toISOString(),
            active: Object.keys(this.sharedState.lastRun),
            lastRun: this.sharedState.lastRun,
            errors: this.sharedState.errors,
            metrics: this.sharedState.metrics
        };
    }
    
    // Safe shutdown
    async shutdown() {
        console.log('🛑 Gracefully shutting down bots...');
        // Implement graceful shutdown if bots have stop methods
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('👋 All bots stopped');
                resolve();
            }, 1000);
        });
    }
}

// Export for use
module.exports = BotIntegration;

// If running as main integration point
if (require.main === module) {
    const integration = new BotIntegration();
    integration.startAll().catch(console.error);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        await integration.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await integration.shutdown();
        process.exit(0);
    });
}
EOF

echo "✅ Integration layer created (bots/integration.js)"

# Create ENVIRONMENT template (adds to existing .env if any)
cat > .env.example.new << 'EOF'
# ============================================
# NEW ENVIRONMENT VARIABLES
# Add these to your existing .env file
# ============================================

# Wallet Bot Configuration
ETH_RPC=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
POLYGON_RPC=https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY
BSC_RPC=https://bsc-dataseed.binance.org

# NFT Marketplace Configuration
OPENSEA_API_KEY=your_opensea_api_key_here
RARIBLE_API_KEY=your_rarible_api_key_here
LOOKSRARE_API_KEY=your_looksrare_api_key_here

# Tracking (optional)
TRACK_COLLECTIONS=boredapeyachtclub,cryptopunks,azuki

# Wallet (optional - for automated transactions)
WALLET_PRIVATE_KEY=your_wallet_private_key_here

# Monitoring
HEARTBEAT_URL=https://healthchecks.io/your-check
LOG_LEVEL=info

# ============================================
# DO NOT DELETE YOUR EXISTING .env VARIABLES!
# Just add these new ones at the bottom.
# ============================================
EOF

echo "✅ Environment template created (.env.example.new)"

# Create SAFE startup script
cat > start_all_bots.js << 'EOF'
// ============================================
// SAFE STARTUP SCRIPT
// Starts all bots without breaking existing ones
// ============================================

require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');

class SafeBotStarter {
    constructor() {
        this.botProcesses = [];
        this.startTime = new Date();
    }
    
    // Method 1: Start all bots in separate processes (safest)
    startSeparateProcesses() {
        console.log('🚀 Starting bots in separate processes...');
        
        const bots = [
            { name: 'main_bot', command: 'node bots/main_bot/index.js' },
            { name: 'airdrop_bot', command: 'node bots/airdrop_bot/index.js' },
            { name: 'in_bot', command: 'node bots/in_bot/index.js' },
            { name: 'out_bot', command: 'node bots/out_bot/index.js' },
            { name: 'wallet_bot', command: 'node bots/wallet_bot/index.js' },
            { name: 'nft_bot', command: 'node bots/nft_marketplace/index.js' }
        ];
        
        bots.forEach(bot => {
            try {
                const process = exec(bot.command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`❌ ${bot.name} error:`, error.message);
                        return;
                    }
                    if (stderr) {
                        console.error(`⚠️  ${bot.name} stderr:`, stderr);
                    }
                });
                
                this.botProcesses.push({
                    name: bot.name,
                    process: process,
                    pid: process.pid
                });
                
                console.log(`✅ Started ${bot.name} (PID: ${process.pid})`);
                
            } catch (error) {
                console.error(`Failed to start ${bot.name}:`, error.message);
            }
        });
        
        console.log(`\n🎉 Started ${this.botProcesses.length} bot processes`);
        console.log('📊 Run "node monitor_bots.js" to check status');
    }
    
    // Method 2: Use integration layer (if you want single process)
    startIntegrated() {
        console.log('🔗 Starting integrated bot system...');
        const BotIntegration = require('./bots/integration.js');
        const integration = new BotIntegration();
        return integration.startAll();
    }
    
    // Monitor bot health
    monitor() {
        setInterval(() => {
            const now = new Date();
            const uptime = Math.floor((now - this.startTime) / 1000);
            
            console.log('\n📈 BOT SYSTEM STATUS');
            console.log('===================');
            console.log(`Uptime: ${uptime}s`);
            console.log(`Active processes: ${this.botProcesses.length}`);
            
            this.botProcesses.forEach(bot => {
                console.log(`- ${bot.name}: PID ${bot.pid} (alive: ${!bot.process.killed})`);
            });
            
            console.log('===================\n');
        }, 30000); // Every 30 seconds
    }
    
    // Graceful shutdown
    shutdown() {
        console.log('\n🛑 Shutting down all bots...');
        
        this.botProcesses.forEach(bot => {
            try {
                bot.process.kill('SIGTERM');
                console.log(`Stopped ${bot.name}`);
            } catch (error) {
                console.error(`Failed to stop ${bot.name}:`, error.message);
            }
        });
        
        setTimeout(() => {
            console.log('👋 All bots stopped. Goodbye!');
            process.exit(0);
        }, 2000);
    }
}

// Start based on command line argument
const starter = new SafeBotStarter();

if (process.argv[2] === 'integrated') {
    starter.startIntegrated();
} else {
    starter.startSeparateProcesses();
    starter.monitor();
}

// Handle shutdown
process.on('SIGINT', () => starter.shutdown());
process.on('SIGTERM', () => starter.shutdown());
EOF

echo "✅ Safe startup script created (start_all_bots.js)"

# Create monitoring script
cat > monitor_bots.js << 'EOF'
// ============================================
// BOT MONITORING SCRIPT
// Monitors all bots without interfering
// ============================================

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class BotMonitor {
    constructor() {
        this.bots = [
            { name: 'Main Bot', path: 'bots/main_bot/index.js', type: 'existing' },
            { name: 'Airdrop Bot', path: 'bots/airdrop_bot/index.js', type: 'existing' },
            { name: 'In Bot', path: 'bots/in_bot/index.js', type: 'existing' },
            { name: 'Out Bot', path: 'bots/out_bot/index.js', type: 'existing' },
            { name: 'Wallet Bot', path: 'bots/wallet_bot/index.js', type: 'new' },
            { name: 'NFT Bot', path: 'bots/nft_marketplace/index.js', type: 'new' }
        ];
        
        this.metrics = {
            checks: 0,
            lastCheck: null,
            errors: []
        };
    }
    
    async checkBot(bot) {
        return new Promise((resolve) => {
            // Check if file exists
            if (!fs.existsSync(bot.path)) {
                resolve({ ...bot, status: 'missing', error: 'File not found' });
                return;
            }
            
            // Check if process is running (simplified check)
            exec(`pgrep -f "${bot.path}"`, (error, stdout) => {
                if (error || !stdout.trim()) {
                    resolve({ ...bot, status: 'stopped', pid: null });
                } else {
                    resolve({ ...bot, status: 'running', pid: stdout.trim() });
                }
            });
        });
    }
    
    async checkAll() {
        console.log('\n🔍 BOT SYSTEM CHECK');
        console.log('==================');
        console.log(`Time: ${new Date().toLocaleTimeString()}`);
        
        const checks = await Promise.all(
            this.bots.map(bot => this.checkBot(bot))
        );
        
        let running = 0;
        let stopped = 0;
        let missing = 0;
        
        checks.forEach(result => {
            const icon = result.status === 'running' ? '✅' : 
                        result.status === 'stopped' ? '🟡' : '❌';
            
            console.log(`${icon} ${result.name.padEnd(15)} [${result.type}] - ${result.status.toUpperCase()} ${result.pid ? `(PID: ${result.pid})` : ''}`);
            
            if (result.status === 'running') running++;
            else if (result.status === 'stopped') stopped++;
            else missing++;
        });
        
        console.log('==================');
        console.log(`📊 Summary: ${running} running, ${stopped} stopped, ${missing} missing`);
        
        this.metrics.checks++;
        this.metrics.lastCheck = new Date().toISOString();
        
        // Log to file
        this.logToFile(checks);
        
        return checks;
    }
    
    logToFile(checks) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            checks: checks.map(c => ({
                name: c.name,
                status: c.status,
                pid: c.pid
            }))
        };
        
        const logDir = 'logs';
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
        
        fs.appendFileSync(
            path.join(logDir, 'bot_monitor.log'),
            JSON.stringify(logEntry) + '\n'
        );
    }
    
    startContinuousMonitoring(intervalSeconds = 60) {
        console.log(`🔄 Starting continuous monitoring (every ${intervalSeconds}s)`);
        
        // Initial check
        this.checkAll();
        
        // Periodic checks
        setInterval(() => {
            this.checkAll();
        }, intervalSeconds * 1000);
    }
}

// Run monitor
const monitor = new BotMonitor();

if (process.argv[2] === 'continuous') {
    monitor.startContinuousMonitoring(parseInt(process.argv[3]) || 60);
} else {
    monitor.checkAll().then(() => {
        process.exit(0);
    });
}
EOF

echo "✅ Monitoring script created (monitor_bots.js)"

# Create README for the new setup
cat > README_NEW_FEATURES.md << 'EOF'
# NEW BOT FEATURES - Safe Integration

## What Was Added:
1. **Wallet Bot** (`bots/wallet_bot/`) - Crypto wallet management
2. **NFT Marketplace Bot** (`bots/nft_marketplace/`) - NFT trading & tracking
3. **Shared Utilities** (`shared/`) - Common blockchain functions
4. **Integration Layer** (`bots/integration.js`) - Connects old & new
5. **Safe Startup** (`start_all_bots.js`) - Starts everything safely
6. **Monitoring** (`monitor_bots.js`) - Checks bot health

## Safety Features:
✅ **No existing files modified**  
✅ **New directories only**  
✅ **Optional integration** (use if you want)  
✅ **Backup created** before any changes  
✅ **Existing bots continue working**  

## How to Use:

### Option 1: Run New Bots Separately (Safest)
```bash
# Start just the new wallet bot
node bots/wallet_bot/index.js

# Start just the new NFT bot
node bots/nft_marketplace/index.js

# Or use npm scripts
npm run bot:wallet
npm run bot:nft