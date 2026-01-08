const TelegramBot = require('node-telegram-bot-api');

// Simple logger
const logger = {
    botEvent: (name, message) => console.log(`[${name}] ${message}`),
    error: (message, error) => console.error(`[ERROR] ${message}`, error?.message || error),
    warn: (message) => console.warn(`[WARN] ${message}`)
};

// Try to load config
let config;
try {
    config = require('./config.js');
} catch (error) {
    config = {
        botName: 'xorgbytm8_bot',
        botUsername: '@xorgbytm8_bot',
        description: 'OUT - Tasks for users outside their countries',
        signature: '8x8org by FlashTM8 ⚡️'
    };
}

class OutBot {
    constructor() {
        this.token = process.env.OUT_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
        this.botName = config.botName || 'OUT';
        this.botUsername = config.botUsername || '@xorgbytm8_bot';
        
        console.log(`[${this.botName}] Initializing...`);
        console.log(`[${this.botName}] Token check: ${this.token ? 'Token exists' : 'No token'}`);
        
        if (!this.token || this.token.includes('your_') || this.token === '856...ko8') {
            logger.warn(`❌ ${this.botName}: Invalid or placeholder token detected`);
            logger.warn(`Please set a valid OUT_BOT_TOKEN in your .env file`);
            logger.warn(`Current token: ${this.token ? this.token.substring(0, 10) + '...' : 'Empty'}`);
            
            this.bot = null;
            console.log(`[${this.botName}] Running in offline mode (no Telegram connection)`);
            console.log(`[${this.botName}] To fix: Get token from @BotFather and update .env`);
            return;
        }
        
        try {
            this.bot = new TelegramBot(this.token, {
                polling: true,
                request: { timeout: 60000 }
            });
            
            console.log(`[${this.botName}] Bot instance created successfully`);
        } catch (error) {
            logger.error(`Failed to create bot instance:`, error);
            this.bot = null;
        }
        
        if (this.bot) {
            this.initialize();
        }
    }

    async initialize() {
        if (!this.bot) {
            console.log(`[${this.botName}] Skipping Telegram initialization (no valid token)`);
            return;
        }

        try {
            logger.botEvent(this.botName, 'Connecting to Telegram...');
            await this.setupCommands();
            await this.setupListeners();
            
            const me = await this.bot.getMe();
            logger.botEvent(this.botName, `Connected as @${me.username}`);
            console.log(`[${this.botName}] ✅ Bot Ready: @${me.username}`);
            console.log(`[${this.botName}] Bot ID: ${me.id}`);
            
        } catch (error) {
            logger.error(`Failed to initialize ${this.botName}:`, error);
            console.log(`[${this.botName}] ❌ Bot failed to connect. Check your token.`);
            console.log(`[${this.botName}] Error: ${error.message}`);
        }
    }

    async setupCommands() {
        if (!this.bot) return;

        // ========== START COMMAND ==========
        this.bot.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            
            const welcomeMsg = `🌍 *Welcome to ${this.botUsername}!*\n\n` +
                `I handle tasks for users *outside* their countries.\n\n` +
                `*Available Commands:*\n` +
                `/tasks - View available OUT tasks\n` +
                `/task_[id] - Start an OUT task\n` +
                `/my_tasks - Your active OUT tasks\n` +
                `/submit_[id] - Submit completed task\n` +
                `/score - Your points and rank\n` +
                `/help - Show all commands\n\n` +
                `*Note:* These tasks are available globally.\n\n` +
                `8x8org by FlashTM8 ⚡️`;
            
            await this.bot.sendMessage(chatId, welcomeMsg, { parse_mode: 'Markdown' });
        });

        // ========== TASKS COMMAND ==========
        this.bot.onText(/\/tasks/, async (msg) => {
            const chatId = msg.chat.id;
            
            const tasksMsg = `📋 *Available OUT Tasks*\n\n` +
                `*International Tasks (Available Worldwide):*\n\n` +
                `1. *Join Telegram Group*\n` +
                `   Join our international community\n` +
                `   🌐 Global | 🎯 50 points\n` +
                `   Command: /task_1\n\n` +
                `2. *Follow on Twitter/X*\n` +
                `   Follow our global account\n` +
                `   🌐 Global | 🎯 30 points\n` +
                `   Command: /task_2\n\n` +
                `3. *Retweet Announcement*\n` +
                `   Share our latest news\n` +
                `   🌐 Global | 🎯 25 points\n` +
                `   Command: /task_3\n\n` +
                `*How to start:*\n` +
                `Use /task_[number] to begin a task\n\n` +
                `8x8org by FlashTM8 ⚡️`;
            
            await this.bot.sendMessage(chatId, tasksMsg, { parse_mode: 'Markdown' });
        });

        // ========== HELP COMMAND ==========
        this.bot.onText(/\/help/, async (msg) => {
            const chatId = msg.chat.id;
            
            const helpMsg = `🤖 *${this.botUsername} Help*\n\n` +
                `*Task Commands:*\n` +
                `/tasks - List available OUT tasks\n` +
                `/task_[id] - Start an OUT task\n` +
                `/submit_[id] - Submit completed task\n` +
                `/my_tasks - Your active tasks\n` +
                `/score - Your points and rank\n\n` +
                `*Info Commands:*\n` +
                `/start - Welcome message\n` +
                `/status - Bot status\n` +
                `/help - This message\n\n` +
                `*What are OUT Tasks?*\n` +
                `Tasks available globally, regardless of location.\n\n` +
                `8x8org by FlashTM8 ⚡️`;
            
            await this.bot.sendMessage(chatId, helpMsg, { parse_mode: 'Markdown' });
        });

        // ========== STATUS COMMAND ==========
        this.bot.onText(/\/status/, async (msg) => {
            const chatId = msg.chat.id;
            
            const statusMsg = `⚙️ *${this.botUsername} Status*\n\n` +
                `✅ *Bot:* Online\n` +
                `🌍 *Scope:* International/Global\n` +
                `📋 *Tasks:* 3 available\n` +
                `👥 *Users:* Active\n` +
                `🕒 *Uptime:* ${Math.floor(process.uptime())}s\n\n` +
                `*Features:*\n` +
                `• Global task distribution\n` +
                `• Point reward system\n` +
                `• Progress tracking\n\n` +
                `8x8org by FlashTM8 ⚡️`;
            
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
    const bot = new OutBot();
    
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
    
    console.log(`[${bot.botName}] Initialization complete`);
} else {
    module.exports = { OutBot };
}
