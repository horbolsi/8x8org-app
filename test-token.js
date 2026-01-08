require('dotenv').config();
console.log('BOT_TOKEN from .env:', process.env.BOT_TOKEN ? 'SET (' + process.env.BOT_TOKEN.substring(0, 10) + '...)' : 'NOT SET');
console.log('app8x8org_BOT_TOKEN from env:', process.env.app8x8org_BOT_TOKEN ? 'SET' : 'NOT SET');

// Test Telegraf if installed
try {
  const Telegraf = require('telegraf');
  console.log('Telegraf loaded successfully');
} catch (e) {
  console.log('Telegraf error:', e.message);
}
