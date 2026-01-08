// Bot Integration Manager
// Safely connects all bots together

require('dotenv').config();
const fs = require('fs');
const path = require('path');

class BotIntegrationManager {
    constructor() {
        this.bots = {
            existing: {},
            new: {},
            all: {}
        };
        
        this.status = {
            started: false,
            startTime: null,
            errors: [],
            metrics: {
                totalBots: 0,
                runningBots: 0,
                failedBots: 0
            }
        };
        
        this.logFile = 'logs/bot_integration.log';
        this.ensureLogDirectory();
    }
    
    ensureLogDirectory() {
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs', { recursive: true });
        }
    }
    
    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}\n`;
        
        // Console output
        console.log(`[${level}] ${message}`);
        
        // File output
        fs.appendFileSync(this.logFile, logMessage);
    }
    
    async loadExistingBots() {
        this.log('Loading existing bots...');
        
        const botFiles = [
            { name: 'main_bot', path: './main_bot/index.js' },
            { name: 'airdrop_bot', path: './airdrop_bot/index.js' },
            { name: 'in_bot', path: './in_bot/index.js' },
            { name: 'out_bot', path: './out_bot/index.js' }
        ];
        
        for (const bot of botFiles) {
            try {
                const botPath = path.join(__dirname, bot.path);
                if (fs.existsSync(botPath)) {
                    const BotClass = require(botPath);
                    this.bots.existing[bot.name] = typeof BotClass === 'function' ? new BotClass() : BotClass;
                    this.log(`Loaded existing bot: ${bot.name}`);
                } else {
                    this.log(`Existing bot not found: ${bot.name}`, 'WARN');
                }
            } catch (error) {
                this.log(`Failed to load existing bot ${bot.name}: ${error.message}`, 'ERROR');
                this.status.errors.push({ bot: bot.name, error: error.message });
            }
        }
    }
    
    async loadNewBots() {
        this.log('Loading new bots...');
        
        const newBots = [
            { name: 'wallet_bot', path: './wallet_bot/index.js', class: 'WalletBot' },
            { name: 'nft_marketplace', path: './nft_marketplace/index.js', class: 'NFTMarketplaceBot' }
        ];
        
        for (const bot of newBots) {
            try {
                const botPath = path.join(__dirname, bot.path);
                if (fs.existsSync(botPath)) {
                    const BotModule = require(botPath);
                    this.bots.new[bot.name] = new BotModule();
                    this.log(`Loaded new bot: ${bot.name}`);
                } else {
                    this.log(`New bot not found: ${bot.name}`, 'WARN');
                }
            } catch (error) {
                this.log(`Failed to load new bot ${bot.name}: ${error.message}`, 'ERROR');
                this.status.errors.push({ bot: bot.name, error: error.message });
            }
        }
    }
    
    async startAllBots() {
        this.log('Starting all bots...');
        this.status.startTime = new Date();
        
        // Merge all bots
        this.bots.all = { ...this.bots.existing, ...this.bots.new };
        
        // Start each bot
        for (const [name, bot] of Object.entries(this.bots.all)) {
            try {
                if (bot && typeof bot.start === 'function') {
                    bot.start();
                    this.status.metrics.runningBots++;
                    this.log(`Started bot: ${name}`);
                } else {
                    this.log(`Bot ${name} has no start method`, 'WARN');
                }
            } catch (error) {
                this.status.metrics.failedBots++;
                this.log(`Failed to start bot ${name}: ${error.message}`, 'ERROR');
                this.status.errors.push({ bot: name, error: error.message, action: 'start' });
            }
        }
        
        this.status.metrics.totalBots = Object.keys(this.bots.all).length;
        this.status.started = true;
        
        this.log(`Bot startup complete. Total: ${this.status.metrics.totalBots}, ` +
                `Running: ${this.status.metrics.runningBots}, ` +
                `Failed: ${this.status.metrics.failedBots}`);
        
        return this.status;
    }
    
    getBotStatus(name) {
        if (!this.bots.all[name]) {
            return { exists: false, running: false };
        }
        
        const bot = this.bots.all[name];
        return {
            exists: true,
            running: !!bot && typeof bot.start === 'function',
            name,
            type: this.bots.existing[name] ? 'existing' : 'new',
            methods: Object.getOwnPropertyNames(Object.getPrototypeOf(bot || {}))
        };
    }
    
    getAllStatus() {
        const status = {};
        
        for (const name of Object.keys(this.bots.all)) {
            status[name] = this.getBotStatus(name);
        }
        
        return {
            system: this.status,
            bots: status,
            timestamp: new Date().toISOString()
        };
    }
    
    async executeBotMethod(botName, methodName, ...args) {
        try {
            const bot = this.bots.all[botName];
            if (!bot) {
                throw new Error(`Bot ${botName} not found`);
            }
            
            if (typeof bot[methodName] !== 'function') {
                throw new Error(`Method ${methodName} not found on bot ${botName}`);
            }
            
            this.log(`Executing ${botName}.${methodName}(${args.map(a => JSON.stringify(a)).join(', ')})`);
            
            const result = await bot[methodName](...args);
            
            return {
                success: true,
                bot: botName,
                method: methodName,
                result
            };
        } catch (error) {
            this.log(`Failed to execute ${botName}.${methodName}: ${error.message}`, 'ERROR');
            
            return {
                success: false,
                bot: botName,
                method: methodName,
                error: error.message
            };
        }
    }
    
    // Heartbeat monitoring
    startMonitoring(intervalSeconds = 30) {
        this.log(`Starting monitoring (interval: ${intervalSeconds}s)`);
        
        this.monitorInterval = setInterval(() => {
            const now = new Date();
            const uptime = Math.floor((now - this.status.startTime) / 1000);
            
            this.log(`System uptime: ${uptime}s | ` +
                    `Bots: ${this.status.metrics.runningBots}/${this.status.metrics.totalBots} running | ` +
                    `Errors: ${this.status.errors.length}`);
            
            // Save status snapshot
            this.saveStatusSnapshot();
        }, intervalSeconds * 1000);
    }
    
    saveStatusSnapshot() {
        const snapshot = {
            timestamp: new Date().toISOString(),
            status: this.getAllStatus(),
            memory: process.memoryUsage()
        };
        
        const snapshotFile = `logs/status_snapshot_${Date.now()}.json`;
        fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));
    }
    
    async shutdown() {
        this.log('Shutting down bot integration...');
        
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        
        // Call shutdown methods if they exist
        for (const [name, bot] of Object.entries(this.bots.all)) {
            try {
                if (bot && typeof bot.shutdown === 'function') {
                    await bot.shutdown();
                    this.log(`Shutdown bot: ${name}`);
                }
            } catch (error) {
                this.log(`Error shutting down ${name}: ${error.message}`, 'ERROR');
            }
        }
        
        this.log('Bot integration shutdown complete');
        return { success: true, shutdownTime: new Date().toISOString() };
    }
}

// Export the manager
module.exports = BotIntegrationManager;

// If run directly, start the integration
if (require.main === module) {
    const manager = new BotIntegrationManager();
    
    const start = async () => {
        await manager.loadExistingBots();
        await manager.loadNewBots();
        await manager.startAllBots();
        manager.startMonitoring(60); // Monitor every 60 seconds
        
        // Log status every 5 minutes
        setInterval(() => {
            const status = manager.getAllStatus();
            console.log('\n📊 BOT SYSTEM STATUS 📊');
            console.log('=======================');
            console.log(`Total Bots: ${status.system.metrics.totalBots}`);
            console.log(`Running: ${status.system.metrics.runningBots}`);
            console.log(`Uptime: ${Math.floor((new Date() - status.system.startTime) / 1000)}s`);
            console.log('=======================\n');
        }, 300000);
    };
    
    start().catch(console.error);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT. Shutting down...');
        await manager.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM. Shutting down...');
        await manager.shutdown();
        process.exit(0);
    });
}
