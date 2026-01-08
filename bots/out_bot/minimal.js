const TelegramBot = require('node-telegram-bot-api');

console.log('Starting minimal OUT Bot...');

const token = process.env.OUT_BOT_TOKEN || process.env.APP_BOT_TOKEN;
if (!token) {
    console.error('No token found! Set OUT_BOT_TOKEN or APP_BOT_TOKEN');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, '✅ OUT Bot is working!');
});

bot.onText(/\/status/, (msg) => {
    bot.sendMessage(msg.chat.id, `Status: OK\nUptime: ${process.uptime().toFixed(0)}s`);
});

bot.on('error', (error) => {
    console.error('Bot error:', error);
});

console.log('OUT Bot started successfully!');
console.log('Use /start or /status to test.');

// Handle shutdown
process.once('SIGINT', () => {
    console.log('Shutting down...');
    bot.stopPolling();
    process.exit(0);
});
