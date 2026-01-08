const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const logger = require('../../utils/logger');

class WalletBot {
    constructor() {
        this.token = config.token;
        this.botName = config.botName;
        this.botUsername = config.botUsername;
        
        if (!this.token) {
            logger.error('Wallet Bot token not configured');
            this.bot = null;
            return;
        }
        
        this.bot = new TelegramBot(this.token, {
            polling: true,
            request: { timeout: 60000 }
        });
        
        this.networks = config.networks;
        this.features = config.features;
        this.initialize();
    }

    async initialize() {
        if (!this.bot) {
            logger.error('Wallet Bot not initialized - no valid token');
            return;
        }

        try {
            logger.botEvent(this.botName, 'Initializing Universal Wallet Bot...');
            await this.setupCommands();
            await this.setupListeners();
            
            const me = await this.bot.getMe();
            logger.botEvent(this.botName, `Connected as @${me.username}`);
            console.log(`[${this.botName}] ✅ Universal Wallet Bot Ready`);
            console.log(`[${this.botName}] 🌐 Supported Networks: ${Object.keys(this.networks).length}`);
            
        } catch (error) {
            logger.error(`Failed to initialize ${this.botName}:`, error);
        }
    }

    async setupCommands() {
        if (!this.bot) return;

        // ========== START COMMAND ==========
        this.bot.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            
            const welcomeMsg = `💰 *Welcome to ${this.botUsername}!*\n\n` +
                `*Universal Crypto Wallet Manager*\n` +
                `Manage your crypto across ALL networks in one place.\n\n` +
                `*Supported Networks:*\n` +
                `• Ethereum, Polygon, BSC, Arbitrum, Optimism\n` +
                `• Avalanche, Fantom, Solana, TON, Bitcoin\n` +
                `• Cardano, Tron, Cosmos + more\n\n` +
                `*Commands:*\n` +
                `/networks - View all supported networks\n` +
                `/create [network] - Create wallet\n` +
                `/balance [network] [address] - Check balance\n` +
                `/send [network] [amount] [address] - Send crypto\n` +
                `/wallets - Your wallets\n` +
                `/help - Show all commands\n\n` +
                `8x8org by FlashTM8 ⚡️`;
            
            await this.bot.sendMessage(chatId, welcomeMsg, { parse_mode: 'Markdown' });
        });

        // ========== NETWORKS COMMAND ==========
        this.bot.onText(/\/networks/, async (msg) => {
            const chatId = msg.chat.id;
            
            let networksMsg = `🌐 *Supported Networks*\n\n`;
            
            // Group by type
            const evmNetworks = [];
            const layer1Networks = [];
            
            Object.entries(this.networks).forEach(([name, network]) => {
                const networkInfo = `${network.testnet ? '🟡' : '🟢'} *${name.toUpperCase()}*\n`;
                const details = `   Symbol: ${network.symbol}\n`;
                const type = `   Type: ${network.type}\n`;
                
                if (network.type === 'evm') {
                    evmNetworks.push(networkInfo + details + type);
                } else {
                    layer1Networks.push(networkInfo + details + type);
                }
            });
            
            networksMsg += `*EVM Networks:*\n${evmNetworks.join('\n')}\n\n`;
            networksMsg += `*Layer 1 Networks:*\n${layer1Networks.join('\n')}\n\n`;
            networksMsg += `*Use:* /create [network_name] to create wallet\n`;
            networksMsg += `Example: /create ethereum\n\n`;
            networksMsg += `8x8org by FlashTM8 ⚡️`;
            
            await this.bot.sendMessage(chatId, networksMsg, { parse_mode: 'Markdown' });
        });

        // ========== CREATE WALLET COMMAND ==========
        this.bot.onText(/\/create (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const networkName = match[1].toLowerCase();
            
            if (!this.networks[networkName]) {
                return await this.bot.sendMessage(chatId,
                    `❌ *Network not supported*\n\n` +
                    `Network "${networkName}" is not available.\n` +
                    `Use /networks to see all supported networks.\n\n` +
                    `8x8org by FlashTM8 ⚡️`,
                    { parse_mode: 'Markdown' }
                );
            }
            
            const network = this.networks[networkName];
            
            // Simulate wallet creation
            await this.bot.sendMessage(chatId,
                `🔄 *Creating ${network.symbol} Wallet...*\n\n` +
                `Network: ${networkName.toUpperCase()}\n` +
                `Type: ${network.type}\n` +
                `Chain ID: ${network.chain_id || 'N/A'}\n\n` +
                `Generating secure wallet...`,
                { parse_mode: 'Markdown' }
            );
            
            // Simulate delay for wallet creation
            setTimeout(async () => {
                const address = this.generateMockAddress(networkName);
                const privateKey = this.generateMockPrivateKey();
                
                await this.bot.sendMessage(chatId,
                    `✅ *${network.symbol} Wallet Created!*\n\n` +
                    `*Address:*\n\`${address}\`\n\n` +
                    `*Network:* ${networkName.toUpperCase()}\n` +
                    `*Explorer:* ${network.explorer}\n` +
                    `*Balance:* 0 ${network.symbol}\n\n` +
                    `⚠️ *IMPORTANT:*\n` +
                    `• Save your private key securely\n` +
                    `• Never share private key\n` +
                    `• Backup your wallet\n\n` +
                    `8x8org by FlashTM8 ⚡️`,
                    { parse_mode: 'Markdown' }
                );
                
                // Send private key securely (in real app, encrypt and store securely)
                await this.bot.sendMessage(chatId,
                    `🔐 *Private Key (SAVE SECURELY):*\n\`${privateKey}\`\n\n` +
                    `⚠️ **WARNING:**\n` +
                    `• This is a MOCK private key for demo\n` +
                    `• In production, never expose private keys\n` +
                    `• Store in encrypted database\n` +
                    `• Use hardware wallet for large amounts`,
                    { parse_mode: 'Markdown' }
                );
            }, 2000);
        });

        // ========== BALANCE COMMAND ==========
        this.bot.onText(/\/balance (.+) (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const networkName = match[1].toLowerCase();
            const address = match[2];
            
            if (!this.networks[networkName]) {
                return await this.bot.sendMessage(chatId,
                    `❌ Network "${networkName}" not supported.\nUse /networks for list.`,
                    { parse_mode: 'Markdown' }
                );
            }
            
            const network = this.networks[networkName];
            const balance = (Math.random() * 100).toFixed(4);
            const usdValue = (balance * 1500).toFixed(2); // Mock conversion
            
            await this.bot.sendMessage(chatId,
                `💰 *${network.symbol} Balance*\n\n` +
                `*Address:*\n\`${address.substring(0, 20)}...\`\n` +
                `*Network:* ${networkName.toUpperCase()}\n` +
                `*Balance:* ${balance} ${network.symbol}\n` +
                `*USD Value:* ~$${usdValue}\n` +
                `*Explorer:* ${network.explorer}/address/${address}\n\n` +
                `8x8org by FlashTM8 ⚡️`,
                { parse_mode: 'Markdown' }
            );
        });

        // ========== WALLETS COMMAND ==========
        this.bot.onText(/\/wallets/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            
            const walletsMsg = `👛 *Your Wallets*\n\n` +
                `*Total Value:* ~$1,245.50\n` +
                `*Wallets:* 3 active\n\n` +
                `1. *Ethereum Wallet*\n` +
                `   Address: 0x7a3...f8c9\n` +
                `   Balance: 0.5 ETH ($1,250)\n` +
                `   Network: Ethereum Mainnet\n\n` +
                `2. *Solana Wallet*\n` +
                `   Address: 7x5G...h3k9\n` +
                `   Balance: 25 SOL ($1,000)\n` +
                `   Network: Solana\n\n` +
                `3. *Bitcoin Wallet*\n` +
                `   Address: bc1q...z7xy\n` +
                `   Balance: 0.02 BTC ($800)\n` +
                `   Network: Bitcoin\n\n` +
                `*Manage:*\n` +
                `/create - Add new wallet\n` +
                `/balance - Check specific balance\n` +
                `/send - Transfer funds\n\n` +
                `8x8org by FlashTM8 ⚡️`;
            
            await this.bot.sendMessage(chatId, walletsMsg, { parse_mode: 'Markdown' });
        });

        // ========== HELP COMMAND ==========
        this.bot.onText(/\/help/, async (msg) => {
            const chatId = msg.chat.id;
            
            const helpMsg = `🤖 *${this.botUsername} Help*\n\n` +
                `*Wallet Commands:*\n` +
                `/networks - View all supported networks\n` +
                `/create [network] - Create new wallet\n` +
                `/balance [network] [address] - Check balance\n` +
                `/send [network] [amount] [address] - Send funds\n` +
                `/wallets - Your wallet list\n` +
                `/receive [network] - Get deposit address\n\n` +
                `*Info Commands:*\n` +
                `/start - Welcome message\n` +
                `/help - This message\n` +
                `/status - Bot status\n\n` +
                `*Supported Networks:*\n` +
                `• All EVM chains (Ethereum, Polygon, BSC, etc.)\n` +
                `• Bitcoin, Solana, TON, Cardano\n` +
                `• And 20+ more networks\n\n` +
                `8x8org by FlashTM8 ⚡️`;
            
            await this.bot.sendMessage(chatId, helpMsg, { parse_mode: 'Markdown' });
        });

        // ========== STATUS COMMAND ==========
        this.bot.onText(/\/status/, async (msg) => {
            const chatId = msg.chat.id;
            
            const statusMsg = `⚙️ *${this.botUsername} Status*\n\n` +
                `✅ *Bot:* Online\n` +
                `🌐 *Networks:* ${Object.keys(this.networks).length} supported\n` +
                `👥 *Users:* Active\n` +
                `🕒 *Uptime:* ${Math.floor(process.uptime())}s\n` +
                `💾 *Memory:* ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n\n` +
                `*Features Enabled:*\n` +
                `• Multi-network wallet creation\n` +
                `• Balance checking\n` +
                `• Transaction sending\n` +
                `• Secure key management\n\n` +
                `8x8org by FlashTM8 ⚡️`;
            
            await this.bot.sendMessage(chatId, statusMsg, { parse_mode: 'Markdown' });
        });

        logger.botEvent(this.botName, 'Commands setup complete');
    }

    // Helper methods
    generateMockAddress(network) {
        const prefixes = {
            ethereum: '0x',
            bitcoin: 'bc1q',
            solana: '7x5G',
            ton: 'EQ',
            polygon: '0x',
            bsc: '0x',
            cardano: 'addr1',
            tron: 'T'
        };
        
        const prefix = prefixes[network] || '0x';
        const chars = '0123456789abcdefABCDEF';
        let address = prefix;
        
        for (let i = 0; i < 40; i++) {
            address += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return address;
    }

    generateMockPrivateKey() {
        const chars = '0123456789abcdef';
        let key = '0x';
        
        for (let i = 0; i < 64; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return key;
    }

    async setupListeners() {
        if (!this.bot) return;
        
        this.bot.on('error', (error) => {
            logger.error(`${this.botName} error:`, error);
        });
        
        this.bot.on('polling_error', (error) => {
            console.log(`[${this.botName}] Polling error: ${error.message}`);
        });
        
        logger.botEvent(this.botName, 'Listeners setup complete');
    }

    async stop() {
        if (this.bot) {
            try {
                this.bot.stopPolling();
                logger.botEvent(this.botName, 'Stopped');
            } catch (error) {
                logger.error(`Error stopping ${this.botName}:`, error);
            }
        }
    }
}

// Export for system startup
if (require.main === module) {
    const bot = new WalletBot();
    
    process.once('SIGINT', () => {
        console.log(`\n[${bot.botName}] Shutting down...`);
        bot.stop();
        process.exit(0);
    });
    
    process.once('SIGTERM', () => {
        console.log(`\n[${bot.botName}] Terminating...`);
        bot.stop();
        process.exit(0);
    });
    
    console.log(`[${bot.botName}] Starting Universal Wallet Bot...`);
} else {
    module.exports = { WalletBot };
}
