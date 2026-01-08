const TelegramBot = require('node-telegram-bot-api');

// Try to load admin config, but handle if missing
let adminConfig, logAction;
try {
    adminConfig = require('../../shared/admin_config');
    logAction = require('../../shared/middleware/admin_auth').logAction;
} catch (error) {
    console.warn('⚠️  Admin config not found, using default');
    adminConfig = {
        owner: {
            telegram_id: process.env.ADMIN_TELEGRAM_ID || '1950324763',
            username: process.env.ADMIN_USERNAME || 'FlashTM8',
            signature: process.env.OWNER_SIGNATURE || '8x8org by FlashTM8 ⚡️'
        },
        isAdmin: function(userId) {
            return userId.toString() === this.owner.telegram_id.toString();
        },
        getSignature: function() {
            return this.owner.signature;
        }
    };
    logAction = function(userId, action, details) {
        console.log(`[ADMIN ACTION] User ${userId}: ${action}`, details || '');
    };
}

// Simple logger
const logger = {
    botEvent: (name, message) => console.log(`[${name}] ${message}`),
    error: (message, error) => console.error(`[ERROR] ${message}`, error?.message || error)
};

class MainBot {
    constructor() {
        this.token = process.env.MAIN_BOT_TOKEN || process.env.APP_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
        this.botName = 'app8x8org_bot';
        this.botUsername = '@app8x8org_bot';
        
        if (!this.token || this.token.includes('your_') || this.token === '856...ko8') {
            logger.error('❌ Invalid bot token. Please set MAIN_BOT_TOKEN in .env');
            this.bot = null;
            return;
        }
        
        this.bot = new TelegramBot(this.token, {
            polling: true,
            request: { timeout: 60000 }
        });
        
        this.initialize();
    }

    async initialize() {
        if (!this.bot) {
            logger.error('Bot not initialized - no valid token');
            return;
        }

        try {
            logger.botEvent(this.botName, 'Initializing...');
            await this.setupCommands();
            await this.setupListeners();
            
            const me = await this.bot.getMe();
            logger.botEvent(this.botName, `Connected as @${me.username}`);
            console.log(`[${this.botName}] ✅ Bot Ready for User Interface`);
            
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
            const username = msg.from.username || 'User';
            
            logAction(userId, 'started_main_bot', { username });
            
            const isOwner = adminConfig.isAdmin(userId);
            
            let welcomeMsg = `👋 *Welcome to 8x8org Ecosystem!*\n\n`;
            welcomeMsg += `I'm your personal interface bot.\n\n`;
            
            if (isOwner) {
                welcomeMsg += `👑 *Owner Access Detected*\n`;
                welcomeMsg += `Welcome back, FlashTM8!\n\n`;
                welcomeMsg += `*Admin Commands:*\n`;
                welcomeMsg += `/admin - Admin panel\n`;
                welcomeMsg += `/export - Generate reports\n`;
                welcomeMsg += `/status - System status\n`;
                welcomeMsg += `/users - View users\n\n`;
            }
            
            welcomeMsg += `*User Commands:*\n`;
            welcomeMsg += `/dashboard - Your dashboard\n`;
            welcomeMsg += `/profile - Your profile\n`;
            welcomeMsg += `/tasks - Access task system\n`;
            welcomeMsg += `/wallet - Crypto wallet\n`;
            welcomeMsg += `/nft - NFT marketplace\n`;
            welcomeMsg += `/help - Show all commands\n\n`;
            welcomeMsg += `${adminConfig.getSignature()}`;
            
            await this.bot.sendMessage(chatId, welcomeMsg, { parse_mode: 'Markdown' });
        });

        // ========== ADMIN COMMAND ==========
        this.bot.onText(/\/admin/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            
            if (!adminConfig.isAdmin(userId)) {
                logAction(userId, 'unauthorized_admin_access', {});
                return this.bot.sendMessage(chatId,
                    `⛔ *Access Denied*\n\n` +
                    `Admin panel is restricted to system owner only.\n\n` +
                    `${adminConfig.getSignature()}`,
                    { parse_mode: 'Markdown' }
                );
            }
            
            logAction(userId, 'accessed_admin_panel', {});
            
            const adminMsg = `👑 *Admin Panel - 8x8org Ecosystem*\n\n` +
                `*Owner:* ${adminConfig.owner.username}\n` +
                `*Telegram ID:* ${adminConfig.owner.telegram_id}\n` +
                `*Time:* ${new Date().toLocaleString()}\n\n` +
                `*Admin Commands:*\n` +
                `/export - Generate Excel report\n` +
                `/status - System status\n` +
                `/backup - Create backup\n` +
                `/restart - Restart system\n\n` +
                `*Bot Status:*\n` +
                `• Main Bot: ✅ Online\n` +
                `• OUT Bot: ⚠️ Check token\n` +
                `• IN Bot: ✅ Ready\n` +
                `• Airdrop Bot: ✅ Ready\n` +
                `• Wallet Bot: ✅ Online\n` +
                `• NFT Bot: ✅ Online\n\n` +
                `${adminConfig.getSignature()}`;
            
            await this.bot.sendMessage(chatId, adminMsg, { parse_mode: 'Markdown' });
        });

        // ========== DASHBOARD COMMAND ==========
        this.bot.onText(/\/dashboard/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            const username = msg.from.username || 'User';
            
            const dashboardMsg = `📊 *Your Dashboard*\n\n` +
                `*Account:*\n` +
                `👤 User: @${username}\n` +
                `🆔 ID: ${userId}\n` +
                `📅 Member since: Today\n\n` +
                `*Statistics:*\n` +
                `✅ Tasks completed: 0\n` +
                `💰 Total earned: $0.00\n` +
                `🎯 Success rate: 0%\n` +
                `🏆 Rank: New member\n\n` +
                `*Quick Actions:*\n` +
                `• Browse tasks: /tasks\n` +
                `• Check wallet: /wallet\n` +
                `• View NFTs: /nft\n\n` +
                `${adminConfig.getSignature()}`;
            
            await this.bot.sendMessage(chatId, dashboardMsg, { parse_mode: 'Markdown' });
        });

        // ========== HELP COMMAND ==========
        this.bot.onText(/\/help/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            const isOwner = adminConfig.isAdmin(userId);
            
            let helpMsg = `🤖 *8x8org Ecosystem Help*\n\n`;
            
            if (isOwner) {
                helpMsg += `*Admin Commands:*\n`;
                helpMsg += `/admin - Admin panel\n`;
                helpMsg += `/export - Generate reports\n`;
                helpMsg += `/status - System status\n`;
                helpMsg += `/backup - Create backup\n\n`;
            }
            
            helpMsg += `*User Commands:*\n`;
            helpMsg += `/start - Welcome message\n`;
            helpMsg += `/dashboard - Your dashboard\n`;
            helpMsg += `/profile - Your profile\n`;
            helpMsg += `/tasks - Access task system\n`;
            helpMsg += `/wallet - Crypto wallet\n`;
            helpMsg += `/nft - NFT marketplace\n`;
            helpMsg += `/help - This message\n\n`;
            helpMsg += `${adminConfig.getSignature()}`;
            
            await this.bot.sendMessage(chatId, helpMsg, { parse_mode: 'Markdown' });
        });

        // ========== TASKS COMMAND ==========
        this.bot.onText(/\/tasks/, async (msg) => {
            const chatId = msg.chat.id;
            
            await this.bot.sendMessage(chatId,
                `📋 *Task System Access*\n\n` +
                `*Available Task Bots:*\n\n` +
                `🌍 *OUT Bot* (@xorgbytm8_bot)\n` +
                `   Tasks outside your country\n` +
                `   Use: /tasks in that bot\n\n` +
                `🏠 *IN Bot* (Coming soon)\n` +
                `   Tasks inside your country\n\n` +
                `*Note:* Each bot handles specific task types.\n` +
                `${adminConfig.getSignature()}`,
                { parse_mode: 'Markdown' }
            );
        });

        // ========== STATUS COMMAND ==========
        this.bot.onText(/\/status/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            const isOwner = adminConfig.isAdmin(userId);
            
            let statusMsg = `⚙️ *System Status*\n\n`;
            
            if (isOwner) {
                statusMsg += `*Owner:* ${adminConfig.owner.username}\n`;
                statusMsg += `*Admin ID:* ${adminConfig.owner.telegram_id}\n`;
            }
            
            statusMsg += `*Bots Running:*\n`;
            statusMsg += `✅ Main Bot (This bot)\n`;
            statusMsg += `⚠️ OUT Bot (Token needed)\n`;
            statusMsg += `✅ IN Bot\n`;
            statusMsg += `✅ Airdrop Bot\n`;
            statusMsg += `✅ Wallet Bot\n`;
            statusMsg += `✅ NFT Bot\n\n`;
            statusMsg += `*System:*\n`;
            statusMsg += `🕒 Uptime: ${Math.floor(process.uptime())}s\n`;
            statusMsg += `💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n`;
            statusMsg += `📊 Node.js: ${process.version}\n\n`;
            statusMsg += `${adminConfig.getSignature()}`;
            
            await this.bot.sendMessage(chatId, statusMsg, { parse_mode: 'Markdown' });
        });

        logger.botEvent(this.botName, 'Commands setup complete');
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
    const bot = new MainBot();
    
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
    
    console.log(`[${bot.botName}] Starting User Interface Bot...`);
} else {
    module.exports = { MainBot };
}
