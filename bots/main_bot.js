const { Telegraf } = require('telegraf');
const logger = require('../utils/logger');
const { User } = require('../database/models');

async function startMainBot() {
    try {
        const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
        
        logger.botEvent('main', 'initializing');
        
        // ===== START COMMAND =====
        bot.start(async (ctx) => {
            try {
                const userId = ctx.from.id;
                const firstName = ctx.from.first_name || 'User';
                const username = ctx.from.username || `user_${userId}`;
                
                logger.userAction(userId, 'start_command', { username });
                
                // Check if user exists
                let user = await User.findOne({ where: { telegram_id: userId } });
                
                if (!user) {
                    // Create new user
                    user = await User.create({
                        telegram_id: userId,
                        account_number: `8x8org-${userId}-${Date.now().toString().slice(-6)}`,
                        username: username,
                        first_name: firstName,
                        last_name: ctx.from.last_name || '',
                        profile_data: JSON.stringify({
                            join_date: new Date().toISOString(),
                            language: ctx.from.language_code || 'en',
                            source: 'telegram_bot'
                        }),
                        last_active: new Date()
                    });
                    
                    logger.userAction(userId, 'registered', { account: user.account_number });
                    
                    await ctx.replyWithMarkdown(`🎉 *Welcome to 8x8org, ${firstName}!*

✅ *Account Created Successfully!*

📋 *Your Account Details:*
• Account Number: \`${user.account_number}\`
• Telegram: @${username}
• Join Date: ${new Date().toLocaleDateString()}

💡 *Useful Commands:*
/profile - View your profile
/help - See all commands
/tasks - View available tasks

🚀 *Get started by exploring tasks with /tasks*`);
                    
                } else {
                    // Update last active
                    await user.update({ last_active: new Date() });
                    
                    await ctx.replyWithMarkdown(`👋 *Welcome back, ${firstName}!*

📊 *Your Stats:*
• Account: \`${user.account_number}\`
• Level: ${user.level}
• Score: ${user.score} points
• Tasks Completed: ${user.tasks_completed}
• Status: ${user.is_verified ? '✅ Verified' : '🔒 Not Verified'}

💡 What would you like to do today?`);
                }
                
            } catch (error) {
                logger.error('Start command error:', error);
                await ctx.reply('❌ Sorry, something went wrong. Please try again or contact support.');
            }
        });
        
        // ===== PROFILE COMMAND =====
        bot.command('profile', async (ctx) => {
            try {
                const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
                
                if (!user) {
                    await ctx.reply('❌ Please start the bot first with /start');
                    return;
                }
                
                // Update last active
                await user.update({ last_active: new Date() });
                
                const profileText = `
📋 *YOUR 8x8org PROFILE*

👤 *Account Information*
• Account Number: \`${user.account_number}\`
• Telegram: @${user.username || 'Not set'}
• Name: ${user.first_name} ${user.last_name || ''}
• Digital ID: ${user.digital_id || 'Not assigned'}

🏆 *Achievements*
• Level: ${user.level}
• Score: ${user.score} points
• Reputation: ${user.reputation}
• Tasks Completed: ${user.tasks_completed}
• Status: ${user.is_verified ? '✅ Verified' : '🔒 Not Verified'}

📅 *Account Details*
• Created: ${new Date(user.created_at).toLocaleDateString()}
• Last Active: ${new Date(user.last_active).toLocaleDateString()}
• Referral Code: \`${user.referral_code || 'Not set'}\`

💎 *Account Label: ${user.label}*
                `;
                
                await ctx.replyWithMarkdown(profileText);
                
            } catch (error) {
                logger.error('Profile command error:', error);
                await ctx.reply('❌ Error loading profile. Please try again.');
            }
        });
        
        // ===== HELP COMMAND =====
        bot.help(async (ctx) => {
            const helpText = `
🤖 *8x8org Bot Commands*

*Account Commands*
/start - Start using the bot
/profile - View your profile
/settings - Account settings

*Task Commands*
/tasks - View available tasks
/mytasks - View your task progress
/leaderboard - View rankings

*Information Commands*
/help - Show this help
/status - Check system status
/support - Contact support

*Admin Commands* ${ctx.from.id.toString() === process.env.OWNER_ID ? '(Available)' : '(Owner Only)'}
/admin - Admin panel
/users - User management
/stats - System statistics

🔗 *Need help?* Contact @${process.env.OWNER_USERNAME || 'admin'}
            `;
            
            await ctx.replyWithMarkdown(helpText);
        });
        
        // ===== TASKS COMMAND =====
        bot.command('tasks', async (ctx) => {
            try {
                const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
                
                if (!user) {
                    await ctx.reply('❌ Please start the bot first with /start');
                    return;
                }
                
                // Example tasks (you'll replace with real tasks from database)
                const tasksText = `
📝 *Available Tasks*

*Task 1: Introduction*
• Description: Complete your profile introduction
• Reward: 50 points
• Command: /task1

*Task 2: Feedback*
• Description: Provide system feedback
• Reward: 30 points
• Command: /task2

*Task 3: Verification*
• Description: Verify your account
• Reward: 100 points
• Command: /task3

💡 *More tasks coming soon!*
                `;
                
                await ctx.replyWithMarkdown(tasksText);
                
            } catch (error) {
                logger.error('Tasks command error:', error);
                await ctx.reply('❌ Error loading tasks.');
            }
        });
        
        // ===== ADMIN COMMAND (Owner Only) =====
        bot.command('admin', async (ctx) => {
            if (ctx.from.id.toString() !== process.env.OWNER_ID) {
                await ctx.reply('❌ Access denied. This command is for owner only.');
                return;
            }
            
            try {
                const totalUsers = await User.count();
                const recentUsers = await User.count({
                    where: {
                        created_at: {
                            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                        }
                    }
                });
                
                const adminText = `
👑 *ADMIN PANEL*

📊 *System Statistics*
• Total Users: ${totalUsers}
• New Users (24h): ${recentUsers}
• System Uptime: ${process.uptime().toFixed(0)} seconds

⚙️ *Quick Actions*
• /announce - Send announcement to all users
• /backup - Backup database
• /export - Export user data
• /stats - Detailed statistics

🛠️ *User Management*
• /ban [id] - Ban user
• /unban [id] - Unban user
• /verify [id] - Verify user
• /search [name] - Search users

🔧 *System Commands*
• /restart - Restart bot
• /logs - View logs
• /config - View configuration
                `;
                
                await ctx.replyWithMarkdown(adminText);
                
            } catch (error) {
                logger.error('Admin command error:', error);
                await ctx.reply('❌ Admin command failed.');
            }
        });
        
        // ===== SIMPLE ECHO (for testing) =====
        bot.on('text', async (ctx) => {
            const message = ctx.message.text;
            
            // Ignore commands (they start with /)
            if (!message.startsWith('/')) {
                await ctx.reply(`You said: "${message}"\n\nTry /help for commands.`);
            }
        });
        
        // ===== LAUNCH BOT =====
        await bot.launch();
        logger.botEvent('main', 'started');
        console.log('✅ MAIN BOT IS RUNNING!');
        console.log(`🤖 Bot Username: @${bot.botInfo.username}`);
        console.log('📱 Go to Telegram and message your bot!');
        
        // Graceful shutdown
        process.once('SIGINT', () => {
            bot.stop('SIGINT');
            logger.botEvent('main', 'stopped');
        });
        process.once('SIGTERM', () => {
            bot.stop('SIGTERM');
            logger.botEvent('main', 'stopped');
        });
        
        return bot;
        
    } catch (error) {
        logger.error('Failed to start Main Bot:', error);
        throw error;
    }
}

module.exports = startMainBot;
