const TelegramBot = require('node-telegram-bot-api');
const { User } = require('../../database/models');
const logger = require('../../utils/logger');

class AirdropBot {
    constructor() {
        this.token = process.env.AIRDROP_BOT_TOKEN || process.env.APP_BOT_TOKEN;
        if (!this.token) {
            throw new Error('AIRDROP_BOT_TOKEN or APP_BOT_TOKEN is required');
        }
        
        this.bot = new TelegramBot(this.token, { polling: true });
        this.botName = 'AIRDROP';
        this.initialize();
    }

    async initialize() {
        logger.botEvent(this.botName, 'Initializing...');
        
        try {
            await this.setupCommands();
            await this.setupListeners();
            
            const me = await this.bot.getMe();
            logger.botEvent(this.botName, `Connected as @${me.username}`);
            
        } catch (error) {
            logger.error(`Failed to initialize ${this.botName} bot:`, error);
            throw error;
        }
    }

    async setupCommands() {
        logger.botEvent(this.botName, 'Setting up commands...');
        
        // ========== COMMAND: /start ==========
        this.bot.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            
            logger.userAction(userId, 'AIRDROP bot /start');
            
            const user = await User.findOne({ where: { telegram_id: userId } });
            
            const welcomeMessage = `
🏆 *Welcome to 8x8org AIRDROP Bot!*

*This is where you can:*
• View leaderboards and rankings
• See other users' scores (with privacy settings)
• Check transparency data
• View global statistics
• Participate in airdrop events

*Your Status:* ${user ? `✅ Registered - Score: ${user.score} points` : '❌ Not registered'}

*Commands:*
/leaderboard - Top 100 users
/rank - Your ranking
/profile_[id] - View user profile
/stats - Global statistics
/transparency - Transparency data
/help - Help information

*To register:* Use /start in @xorgbytm8_bot
            `.trim();
            
            await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
        });

        // ========== COMMAND: /leaderboard ==========
        this.bot.onText(/\/leaderboard/, async (msg) => {
            const chatId = msg.chat.id;
            
            logger.userAction(msg.from.id, 'AIRDROP bot /leaderboard');
            
            try {
                const topUsers = await User.findAll({
                    where: { is_banned: false },
                    order: [['score', 'DESC']],
                    limit: 20
                });
                
                if (topUsers.length === 0) {
                    return await this.bot.sendMessage(chatId,
                        '📭 *No users on leaderboard yet*',
                        { parse_mode: 'Markdown' }
                    );
                }
                
                let message = `🏆 *8x8org Leaderboard*\n\n`;
                message += '*Top 20 Users by Score:*\n\n';
                
                topUsers.forEach((user, index) => {
                    const rankEmoji = index === 0 ? '🥇' : 
                                    index === 1 ? '🥈' : 
                                    index === 2 ? '🥉' : `${index + 1}.`;
                    
                    const name = user.first_name || 'Anonymous';
                    const score = user.score || 0;
                    const level = user.level || 1;
                    
                    message += `${rankEmoji} *${name}* - ${score} pts (Lvl ${level})\n`;
                });
                
                message += '\n*Use /rank to see your position*';
                message += '\n*Use /profile_[account] to view details*';
                
                await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
                
            } catch (error) {
                logger.error('Leaderboard error:', error);
                await this.bot.sendMessage(chatId,
                    '❌ *Error loading leaderboard*',
                    { parse_mode: 'Markdown' }
                );
            }
        });

        // ========== COMMAND: /rank ==========
        this.bot.onText(/\/rank/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            
            logger.userAction(userId, 'AIRDROP bot /rank');
            
            try {
                const user = await User.findOne({ where: { telegram_id: userId } });
                if (!user) {
                    return await this.bot.sendMessage(chatId,
                        '❌ *You are not registered*\n\n' +
                        'Use /start in @xorgbytm8_bot first.',
                        { parse_mode: 'Markdown' }
                    );
                }
                
                // Get all users for ranking
                const allUsers = await User.findAll({
                    where: { is_banned: false },
                    order: [['score', 'DESC']]
                });
                
                const rank = allUsers.findIndex(u => u.id === user.id) + 1;
                const totalUsers = allUsers.length;
                const percentile = totalUsers > 0 
                    ? Math.round(((totalUsers - rank) / totalUsers) * 100)
                    : 0;
                
                let rankMessage = `📊 *Your Ranking*\n\n`;
                rankMessage += `🏆 *Rank:* ${rank}/${totalUsers}\n`;
                rankMessage += `📈 *Percentile:* Top ${percentile}%\n`;
                rankMessage += `⭐ *Score:* ${user.score} points\n`;
                rankMessage += `🎯 *Level:* ${user.level}\n`;
                rankMessage += `✅ *Tasks Completed:* ${user.tasks_completed}\n`;
                rankMessage += `⭐ *Reputation:* ${user.reputation}\n\n`;
                
                if (rank <= 10) {
                    rankMessage += `🎉 *You're in the top 10! Keep it up!*\n`;
                } else if (rank <= 100) {
                    rankMessage += `👍 *You're in the top 100! Great work!*\n`;
                } else if (rank > 1) {
                    const nextUser = allUsers[rank - 2];
                    const pointsNeeded = nextUser ? (nextUser.score - user.score) : 0;
                    rankMessage += `📈 *Need ${pointsNeeded} more points to move up*\n`;
                }
                
                await this.bot.sendMessage(chatId, rankMessage, { parse_mode: 'Markdown' });
                
            } catch (error) {
                logger.error('Rank command error:', error);
                await this.bot.sendMessage(chatId,
                    '❌ *Error calculating rank*',
                    { parse_mode: 'Markdown' }
                );
            }
        });

        // ========== COMMAND: /profile_[id] ==========
        this.bot.onText(/\/profile_(\S+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const identifier = match[1];
            
            logger.userAction(msg.from.id, `AIRDROP bot /profile_${identifier}`);
            
            try {
                let user;
                
                // Try different lookup methods
                if (identifier.startsWith('8x8org-')) {
                    user = await User.findOne({ where: { account_number: identifier } });
                } else if (/^\d+$/.test(identifier)) {
                    user = await User.findOne({ where: { telegram_id: identifier } });
                } else {
                    user = await User.findOne({ where: { username: identifier } });
                }
                
                if (!user) {
                    return await this.bot.sendMessage(chatId,
                        '❌ *User not found*\n\n' +
                        'Search by: account number, Telegram ID, or username.',
                        { parse_mode: 'Markdown' }
                    );
                }
                
                // Check privacy
                const profileData = user.profile_data || {};
                const isPublic = profileData.settings?.public_profile !== false;
                
                if (!isPublic) {
                    return await this.bot.sendMessage(chatId,
                        '🔒 *This profile is private*',
                        { parse_mode: 'Markdown' }
                    );
                }
                
                // Get rank
                const allUsers = await User.findAll({
                    where: { is_banned: false },
                    order: [['score', 'DESC']]
                });
                const rank = allUsers.findIndex(u => u.id === user.id) + 1;
                
                let profileMessage = `👤 *User Profile*\n\n`;
                profileMessage += `🏷️ *Name:* ${user.first_name} ${user.last_name || ''}\n`;
                if (user.username) profileMessage += `📱 *Username:* @${user.username}\n`;
                profileMessage += `🔢 *Account:* \`${user.account_number}\`\n`;
                if (user.digital_id) profileMessage += `🆔 *Digital ID:* \`${user.digital_id}\`\n`;
                profileMessage += `\n📊 *Stats:*\n`;
                profileMessage += `🏆 *Rank:* ${rank}\n`;
                profileMessage += `⭐ *Score:* ${user.score} points\n`;
                profileMessage += `🎯 *Level:* ${user.level}\n`;
                profileMessage += `✅ *Tasks:* ${user.tasks_completed}\n`;
                profileMessage += `⭐ *Reputation:* ${user.reputation}\n`;
                profileMessage += `📅 *Joined:* ${new Date(user.created_at).toLocaleDateString()}\n`;
                
                if (profileData.bio) {
                    profileMessage += `\n📝 *Bio:* ${profileData.bio}\n`;
                }
                
                profileMessage += `\n🔍 *Privacy:* ${isPublic ? 'Public' : 'Private'}`;
                
                await this.bot.sendMessage(chatId, profileMessage, { parse_mode: 'Markdown' });
                
            } catch (error) {
                logger.error('Profile view error:', error);
                await this.bot.sendMessage(chatId,
                    '❌ *Error loading profile*',
                    { parse_mode: 'Markdown' }
                );
            }
        });

        // ========== COMMAND: /stats ==========
        this.bot.onText(/\/stats/, async (msg) => {
            const chatId = msg.chat.id;
            
            logger.userAction(msg.from.id, 'AIRDROP bot /stats');
            
            try {
                const totalUsers = await User.count({ where: { is_banned: false } });
                const activeUsers = await User.count({
                    where: {
                        is_banned: false,
                        last_active: {
                            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        }
                    }
                });
                
                const totalScore = await User.sum('score') || 0;
                const avgScore = totalUsers > 0 ? Math.round(totalScore / totalUsers) : 0;
                
                const topUser = await User.findOne({
                    where: { is_banned: false },
                    order: [['score', 'DESC']]
                });
                
                let statsMessage = `📈 *8x8org Global Statistics*\n\n`;
                statsMessage += `👥 *Total Users:* ${totalUsers}\n`;
                statsMessage += `🎯 *Active Users (7d):* ${activeUsers}\n`;
                statsMessage += `🏆 *Total Points:* ${totalScore}\n`;
                statsMessage += `📊 *Average Score:* ${avgScore}\n`;
                
                if (topUser) {
                    statsMessage += `\n👑 *Top User:*\n`;
                    statsMessage += `${topUser.first_name} - ${topUser.score} points\n`;
                }
                
                statsMessage += `\n🕒 *Last Updated:* ${new Date().toLocaleString()}\n`;
                statsMessage += `🌐 *System Status:* Operational ✅`;
                
                await this.bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
                
            } catch (error) {
                logger.error('Stats command error:', error);
                await this.bot.sendMessage(chatId,
                    '❌ *Error loading statistics*',
                    { parse_mode: 'Markdown' }
                );
            }
        });

        // ========== COMMAND: /transparency ==========
        this.bot.onText(/\/transparency/, async (msg) => {
            const chatId = msg.chat.id;
            
            const transparencyMessage = `
🔍 *8x8org Transparency Report*

*📊 System Integrity:*
• All scores calculated automatically
• Task completions verified
• User data encrypted
• Regular backups performed

*📈 Data Accuracy:*
• Real-time score updates
• Transparent ranking system
• Audit logs maintained
• Blockchain integration planned

*👁️ Visibility:*
• Public leaderboards
• User profiles (privacy controls)
• Global statistics
• Activity reports

*🛡️ Security:*
• Encrypted communications
• Secure database
• Privacy-first approach

*🤝 Trust:*
• Transparent operations
• Regular updates
• Community focus

*For detailed reports, contact admin.*
            `.trim();
            
            await this.bot.sendMessage(chatId, transparencyMessage, { parse_mode: 'Markdown' });
        });

        // ========== COMMAND: /help ==========
        this.bot.onText(/\/help/, async (msg) => {
            const chatId = msg.chat.id;
            
            const helpMessage = `
🏆 *AIRDROP Bot Commands*

*📊 Viewing Commands:*
/leaderboard - Top 100 users
/rank - Your ranking
/profile_[id] - View user profile
/stats - Global statistics
/transparency - Transparency data

*🔍 Search Options:*
/profile_8x8org-123... (by account)
/profile_123456789 (by Telegram ID)
/profile_username (by username)

*📈 Features:*
• Public leaderboards
• User rankings
• Score transparency
• Global statistics
• Privacy controls

*🔗 Requirements:*
Must be registered with main bot

*🆘 Need help?* Contact admin.
            `.trim();
            
            await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
        });

        logger.botEvent(this.botName, 'Commands setup complete');
        
    } catch (error) {
        logger.error('Failed to setup AIRDROP bot commands:', error);
        throw error;
    }
}

    async setupListeners() {
        this.bot.on('error', (error) => {
            logger.error('AIRDROP bot error:', error);
        });
        
        logger.botEvent(this.botName, 'Listeners setup complete');
    }

    async stop() {
        try {
            this.bot.stopPolling();
            logger.botEvent(this.botName, 'Stopped polling');
        } catch (error) {
            logger.error('Error stopping AIRDROP bot:', error);
        }
    }
}

async function startAirdropBot() {
    try {
        const bot = new AirdropBot();
        logger.botEvent('AIRDROP', 'Bot instance created');
        return bot;
    } catch (error) {
        logger.error('Failed to start AIRDROP bot:', error);
        throw error;
    }
}

module.exports = {
    AirdropBot,
    startAirdropBot
};
