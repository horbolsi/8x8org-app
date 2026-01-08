// Enhanced Bot Monitor
console.log('📊 ENHANCED BOT MONITOR\n');

const fs = require('fs');
const { exec } = require('child_process');
const axios = require('axios');

class EnhancedMonitor {
    constructor() {
        this.bots = [
            { name: 'Wallet Bot', file: 'bots/wallet_bot/index.js', type: 'new' },
            { name: 'NFT Bot', file: 'bots/nft_marketplace/index.js', type: 'new' },
            { name: 'Main Bot', file: 'bots/main_bot/index.js', type: 'existing' },
            { name: 'Airdrop Bot', file: 'bots/airdrop_bot/index.js', type: 'existing' },
            { name: 'In Bot', file: 'bots/in_bot/index.js', type: 'existing' },
            { name: 'Out Bot', file: 'bots/out_bot/index.js', type: 'existing' }
        ];
        
        this.metrics = {
            startTime: new Date(),
            checks: 0,
            alerts: []
        };
    }
    
    async checkAll() {
        console.log('🔍 Running comprehensive check...\n');
        
        // 1. Check bot processes
        console.log('🤖 BOT PROCESSES:');
        console.log('────────────────');
        
        for (const bot of this.bots) {
            await this.checkBotProcess(bot);
        }
        
        // 2. Check system resources
        console.log('\n💻 SYSTEM RESOURCES:');
        console.log('───────────────────');
        await this.checkSystemResources();
        
        // 3. Check blockchain connectivity
        console.log('\n🔗 BLOCKCHAIN STATUS:');
        console.log('────────────────────');
        await this.checkBlockchainStatus();
        
        // 4. Log summary
        this.logSummary();
    }
    
    async checkBotProcess(bot) {
        return new Promise((resolve) => {
            exec(`pgrep -f "${bot.file}"`, (error, stdout) => {
                if (error || !stdout.trim()) {
                    console.log(`❌ ${bot.name}: Not running`);
                } else {
                    const pids = stdout.trim().split('\n');
                    console.log(`✅ ${bot.name}: Running (PID${pids.length > 1 ? 's' : ''}: ${pids.join(', ')})`);
                }
                resolve();
            });
        });
    }
    
    async checkSystemResources() {
        const mem = process.memoryUsage();
        console.log(`   Memory: ${Math.round(mem.heapUsed / 1024 / 1024)}MB / ${Math.round(mem.heapTotal / 1024 / 1024)}MB`);
        console.log(`   Uptime: ${Math.floor(process.uptime())}s`);
        
        // CPU usage (simplified)
        const startUsage = process.cpuUsage();
        setTimeout(() => {
            const endUsage = process.cpuUsage(startUsage);
            const cpuPercent = ((endUsage.user + endUsage.system) / 1000000).toFixed(1);
            console.log(`   CPU: ~${cpuPercent}%`);
        }, 100);
    }
    
    async checkBlockchainStatus() {
        try {
            const response = await axios.get('https://api.blockchair.com/ethereum/stats', {
                timeout: 5000
            });
            
            const data = response.data.data;
            console.log(`   Ethereum Block: ${data.blocks.toLocaleString()}`);
            console.log(`   Transactions: ${data.transactions.toLocaleString()}`);
            console.log(`   Gas Price: ${data.gas_prices.average / 1e9} Gwei`);
        } catch (error) {
            console.log('   ⚠️ Blockchain API unreachable');
        }
    }
    
    logSummary() {
        const uptime = Math.floor((new Date() - this.metrics.startTime) / 1000);
        console.log('\n📈 SUMMARY:');
        console.log('───────────');
        console.log(`Monitor Uptime: ${this.formatTime(uptime)}`);
        console.log(`Total Checks: ${this.metrics.checks}`);
        console.log(`Active Bots: ${this.bots.length}`);
        console.log(`Alerts: ${this.metrics.alerts.length}`);
        
        // Save to log file
        this.saveToLog();
    }
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}h ${minutes}m ${secs}s`;
    }
    
    saveToLog() {
        const logEntry = {
            timestamp: new Date().toISOString(),
            bots: this.bots.length,
            memory: process.memoryUsage(),
            uptime: process.uptime()
        };
        
        if (!fs.existsSync('logs')) fs.mkdirSync('logs');
        fs.appendFileSync('logs/enhanced_monitor.log', JSON.stringify(logEntry) + '\n');
    }
    
    startContinuousMonitoring(interval = 60) {
        console.log(`\n🔄 Starting continuous monitoring (every ${interval}s)...\n`);
        
        // Initial check
        this.checkAll();
        
        // Set interval
        setInterval(() => {
            this.metrics.checks++;
            this.checkAll();
        }, interval * 1000);
    }
}

// Run monitor
const monitor = new EnhancedMonitor();

if (process.argv[2] === 'continuous') {
    const interval = parseInt(process.argv[3]) || 60;
    monitor.startContinuousMonitoring(interval);
} else {
    monitor.checkAll();
}
