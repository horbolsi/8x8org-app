const TelegramBot = require('node-telegram-bot-api');
const logger = require('../../utils/logger');

console.log('🚀 Starting Out Bot (Guaranteed Working Version)...');

// Get token from environment
const token = process.env.OUT_BOT_TOKEN || process.env.APP_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

if (!token || token.includes('your_') || token.includes('...')) {
  console.error('❌ ERROR: No valid bot token found!');
  console.log('Please set OUT_BOT_TOKEN in your .env file');
  console.log('Get a token from @BotFather on Telegram');
  process.exit(1);
}

console.log(`✅ Using bot token: ${token.substring(0, 10)}...`);

// Create bot instance
const bot = new TelegramBot(token, {
  polling: true,
  request: {
    timeout: 60000
  }
});

// Basic commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 
    `🎉 *Out Bot is Working!*\n\n` +
    `✅ Bot successfully connected\n` +
    `🆔 Your ID: ${msg.from.id}\n` +
    `👤 Username: @${msg.from.username || 'none'}\n\n` +
    `*Commands:*\n` +
    `/status - Check bot status\n` +
    `/test - Test connection\n` +
    `/help - Show all commands`,
    { parse_mode: 'Markdown' }
  );
  logger.botEvent('OUT', `User ${msg.from.id} started bot`);
});

bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const memory = process.memoryUsage();
  bot.sendMessage(chatId,
    `📊 *Bot Status*\n\n` +
    `✅ Operational\n` +
    `🕒 Uptime: ${Math.floor(process.uptime())}s\n` +
    `📈 Memory: ${Math.round(memory.heapUsed / 1024 / 1024)}MB\n` +
    `👥 Chat ID: ${chatId}\n` +
    `🔧 Version: 1.0.0`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/test/, (msg) => {
  bot.sendMessage(msg.chat.id, '✅ Test successful! Bot is responding.');
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `*🤖 Out Bot Help*\n\n` +
    `*Available Commands:*\n` +
    `/start - Start the bot\n` +
    `/status - Check bot status\n` +
    `/test - Test connection\n` +
    `/help - This message\n\n` +
    `*Coming Soon:*\n` +
    `/tasks - View available tasks\n` +
    `/mytasks - Your active tasks\n` +
    `/score - Your points`,
    { parse_mode: 'Markdown' }
  );
});

// Error handling
bot.on('error', (error) => {
  console.error('Bot error:', error.message);
  logger.error('Out Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.log('Polling error:', error.message);
});

// Success message
bot.getMe().then((me) => {
  console.log(`✅ Out Bot started successfully as @${me.username}`);
  console.log(`✅ Bot ID: ${me.id}`);
  console.log(`✅ Bot name: ${me.first_name}`);
  logger.botEvent('OUT', `Bot started as @${me.username}`);
}).catch((error) => {
  console.error('❌ Failed to start bot:', error.message);
  console.log('Possible issues:');
  console.log('1. Invalid bot token');
  console.log('2. No internet connection');
  console.log('3. Telegram API issues');
  process.exit(1);
});

// Handle shutdown
process.once('SIGINT', () => {
  console.log('\n🛑 Shutting down Out Bot...');
  bot.stopPolling();
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('\n🛑 Terminating Out Bot...');
  bot.stopPolling();
  process.exit(0);
});

console.log('✅ Out Bot setup complete. Waiting for messages...');
