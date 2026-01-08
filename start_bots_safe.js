const { fork } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

console.log(chalk.blue('=== 8X8ORG ECOSYSTEM STARTUP ==='));
console.log(chalk.yellow('Owner: FlashTM8 (1950324763)'));
console.log(chalk.yellow('Signature: 8x8org by FlashTM8 ⚡️'));
console.log(chalk.yellow(new Date().toString()));
console.log('');

// Check for duplicate instances
const pidFile = '/tmp/8x8org_ecosystem.pid';
if (fs.existsSync(pidFile)) {
    const existingPid = parseInt(fs.readFileSync(pidFile, 'utf8'));
    try {
        process.kill(existingPid, 0); // Check if process exists
        console.log(chalk.red('❌ Ecosystem is already running!'));
        console.log(chalk.yellow(`PID: ${existingPid}`));
        console.log(chalk.yellow('Run: ./manage_ecosystem.sh stop'));
        process.exit(1);
    } catch (e) {
        // Process doesn't exist, remove stale PID file
        fs.unlinkSync(pidFile);
    }
}

// Save current PID
fs.writeFileSync(pidFile, process.pid.toString());

// Handle cleanup on exit
process.on('exit', () => {
    if (fs.existsSync(pidFile)) {
        fs.unlinkSync(pidFile);
    }
});

process.on('SIGINT', () => {
    console.log(chalk.yellow('\nShutting down ecosystem...'));
    botProcesses.forEach(proc => {
        if (proc && proc.connected) {
            proc.kill('SIGTERM');
        }
    });
    if (fs.existsSync(pidFile)) {
        fs.unlinkSync(pidFile);
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(chalk.yellow('\nTerminating ecosystem...'));
    botProcesses.forEach(proc => {
        if (proc && proc.connected) {
            proc.kill('SIGTERM');
        }
    });
    if (fs.existsSync(pidFile)) {
        fs.unlinkSync(pidFile);
    }
    process.exit(0);
});

console.log(chalk.blue('SAFE BOT STARTUP SYSTEM'));
console.log(chalk.yellow('Starting bots safely...'));

const bots = [
    { name: 'Main Bot', path: './bots/main_bot/index.js', env: 'MAIN_BOT_TOKEN' },
    { name: 'Airdrop Bot', path: './bots/airdrop_bot/index.js', env: 'AIRDROP_BOT_TOKEN' },
    { name: 'In Bot', path: './bots/in_bot/index.js', env: 'IN_BOT_TOKEN' },
    { name: 'Out Bot', path: './bots/out_bot/index.js', env: 'OUT_BOT_TOKEN' },
    { name: 'Wallet Bot', path: './bots/wallet_bot/index.js', env: 'WALLET_BOT_TOKEN' },
    { name: 'NFT Bot', path: './bots/nft_marketplace/index.js', env: 'NFT_BOT_TOKEN' }
];

const botProcesses = [];

async function startBot(bot) {
    return new Promise((resolve) => {
        console.log(chalk.blue(`Starting ${bot.name}...`));
        
        try {
            const proc = fork(bot.path, [], {
                stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
                env: { ...process.env, BOT_TYPE: bot.name.toUpperCase().replace(' ', '_') }
            });
            
            botProcesses.push(proc);
            
            // Listen for messages from child process
            proc.on('message', (msg) => {
                if (msg === 'ready') {
                    console.log(chalk.green(`✓ ${bot.name} started (PID: ${proc.pid})`));
                    resolve(proc);
                }
            });
            
            // Handle output
            proc.stdout.on('data', (data) => {
                console.log(`[${bot.name}] ${data.toString().trim()}`);
            });
            
            proc.stderr.on('data', (data) => {
                console.error(chalk.red(`[${bot.name} ERROR] ${data.toString().trim()}`));
            });
            
            proc.on('exit', (code) => {
                console.log(chalk.yellow(`${bot.name} exited with code ${code}`));
                const index = botProcesses.indexOf(proc);
                if (index > -1) {
                    botProcesses.splice(index, 1);
                }
            });
            
            // If no 'ready' message after 10 seconds, assume it started
            setTimeout(() => {
                if (proc.connected) {
                    console.log(chalk.green(`✓ ${bot.name} started (PID: ${proc.pid})`));
                    resolve(proc);
                }
            }, 10000);
            
        } catch (error) {
            console.error(chalk.red(`Failed to start ${bot.name}:`), error);
            resolve(null);
        }
    });
}

async function startAllBots() {
    console.log(chalk.blue('\nInitializing bots...'));
    
    for (const bot of bots) {
        await startBot(bot);
        // Small delay between starting bots
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(chalk.green(`\n✓ Started ${botProcesses.length} bot(s)`));
    
    // Monitor and display status
    setInterval(() => {
        console.log(chalk.cyan('\nBOT STATUS'));
        console.log(chalk.cyan(`Uptime: ${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s`));
        console.log(chalk.cyan(`Total: ${bots.length} bots, ${botProcesses.length} running`));
        
        bots.forEach((bot, index) => {
            const proc = botProcesses[index];
            const status = proc && proc.connected ? 'RUNNING' : 'STOPPED';
            const pid = proc ? proc.pid : 'N/A';
            console.log(chalk.white(`${index + 1}. ${bot.name}: ${status} (PID: ${pid})`));
        });
    }, 30000);
    
    console.log(chalk.yellow('\nMonitoring active (updates every 30s)'));
    console.log(chalk.yellow('System active. Press Ctrl+C to exit.'));
}

startAllBots().catch(error => {
    console.error(chalk.red('Failed to start ecosystem:'), error);
    process.exit(1);
});
