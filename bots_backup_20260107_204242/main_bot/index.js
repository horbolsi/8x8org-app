const TelegramBot = require('node-telegram-bot-api');
const { User, Task, UserTask, Command, AuditLog } = require('../../database/models');
const security = require('../../utils/security');
const emailService = require('../../utils/email');
const logger = require('../../utils/logger');

class MainBot {
    constructor() {
        this.token = process.env.MAIN_BOT_TOKEN;
        if (!this.token) {
            throw new Error('MAIN_BOT_TOKEN is required in environment variables');
        }
        
        this.bot = new TelegramBot(this.token, {
            polling: {
                interval: 300,
                autoStart: true,
                params: {
                    timeout: 10
                }
            }
        });
        
        this.botName = 'main';
        this.userSessions = new Map();
        this.commandCooldowns = new Map();
        this.initialize();
    }

    async initialize() {
        logger.botEvent(this.botName, 'Initializing...');
        
        try {
            await this.setupCommands();
            await this.setupListeners();
            
            // Test bot connection
            const me = await this.bot.getMe();
            logger.botEvent(this.botName, `Connected as @${me.username} (${me.id})`);
            
            // Send startup notification to owner
            await this.notifyOwnerStartup();
            
        } catch (error) {
            logger.error(`Failed to initialize ${this.botName} bot:`, error);
            throw error;
        }
    }

    async setupCommands() {
        logger.botEvent(this.botName, 'Setting up commands...');
        
        // ========== COMMAND 1: /start ==========
        this.bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
            const chatId = msg.chat.id;
            const telegramId = msg.from.id;
            const referralCode = match ? match[1] : null;
            
            logger.userAction(telegramId, '/start command', {
                chat_id: chatId,
                referral_code: referralCode
            });
            
            try {
                let user = await User.findOne({ where: { telegram_id: telegramId } });
                
                if (!user) {
                    // Create new user
                    const accountNumber = security.generateAccountNumber(telegramId);
                    const digitalId = security.generateDigitalId(telegramId);
                    
                    user = await User.create({
                        telegram_id: telegramId,
                        account_number: accountNumber,
                        username: msg.from.username,
                        first_name: msg.from.first_name,
                        last_name: msg.from.last_name,
                        digital_id: digitalId,
                        profile_data: JSON.stringify({
                            join_date: new Date().toISOString(),
                            language: msg.from.language_code || 'en',
                            referrals: [],
                            settings: {
                                notifications: true,
                                email_updates: false,
                                privacy: 'standard'
                            }
                        }),
                        referral_code: security.generateReferralCode(telegramId)
                    });
                    
                    logger.userAction(telegramId, 'New user registered', {
                        account_number: accountNumber,
                        digital_id: digitalId
                    });
                    
                    // Log audit
                    await AuditLog.create({
                        user_id: user.id,
                        action: 'user_registered',
                        entity_type: 'user',
                        entity_id: user.id,
                        new_values: JSON.stringify({
                            telegram_id: telegramId,
                            account_number: accountNumber
                        })
                    });
                    
                    // Handle referral if provided
                    if (referralCode) {
                        await this.handleReferral(user, referralCode);
                    }
                    
                    // Send welcome message
                    const welcomeMessage = `
🎉 *Welcome to 8x8org Ecosystem!*

✅ *Your Digital ID:* \`${user.digital_id}\`
🔢 *Account Number:* \`${user.account_number}\`
🏷️ *Label:* 8x8org

📊 *Your journey begins now!*
• Start with /profile to set up your account
• Use /features to customize your experience
• Check /help for all available commands

🔗 *Referral Code:* \`${user.referral_code}\`
Share this code with friends to earn rewards!

🆘 *Need help?* Contact support or use /help
                    `.trim();
                    
                    await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
                    
                    // Send notification to owner about new user
                    if (telegramId.toString() !== process.env.OWNER_ID) {
                        await this.sendToOwner(
                            `🆕 *New User Registered*\n\n` +
                            `👤 *Name:* ${user.first_name} ${user.last_name || ''}\n` +
                            `📱 *Username:* @${user.username || 'N/A'}\n` +
                            `🆔 *Telegram ID:* ${telegramId}\n` +
                            `🔢 *Account:* ${user.account_number}\n` +
                            `🕒 *Time:* ${new Date().toLocaleString()}\n` +
                            `${referralCode ? `📝 *Referred by:* ${referralCode}\n` : ''}`
                        );
                    }
                    
                } else {
                    // Update last active
                    user.last_active = new Date();
                    await user.save();
                    
                    const welcomeBackMessage = `
👋 *Welcome back ${user.first_name}!*

📊 *Your Stats:*
• *Account:* \`${user.account_number}\`
• *Score:* ${user.score} points
• *Level:* ${user.level}
• *Tasks Completed:* ${user.tasks_completed}
• *Reputation:* ${user.reputation}

💡 *Quick Actions:*
/profile - Manage your account
/tasks - Available tasks
/features - Customize experience
/help - All commands
                    `.trim();
                    
                    await this.bot.sendMessage(chatId, welcomeBackMessage, { parse_mode: 'Markdown' });
                }
                
            } catch (error) {
                logger.error('Start command error:', error);
                await this.bot.sendMessage(chatId, 
                    '❌ *Error creating account*\n\n' +
                    'Please try again or contact support if the problem persists.',
                    { parse_mode: 'Markdown' }
                );
            }
        });

        // ========== COMMAND 2: /profile ==========
        this.bot.onText(/\/profile/, async (msg) => {
            const chatId = msg.chat.id;
            const telegramId = msg.from.id;
            
            logger.userAction(telegramId, '/profile command');
            
            try {
                const user = await User.findOne({ where: { telegram_id: telegramId } });
                
                if (!user) {
                    return await this.bot.sendMessage(chatId, 
                        '❌ *Please /start first*\n\n' +
                        'You need to register before accessing your profile.',
                        { parse_mode: 'Markdown' }
                    );
                }
                
                const profileData = user.profile_data || {};
                const features = profileData.settings || {};
                
                const profileMessage = `
👤 *Your Profile*

*Basic Information:*
• *Name:* ${user.first_name} ${user.last_name || ''}
• *Username:* @${user.username || 'Not set'}
• *Email:* ${user.email || 'Not set'}
• *Phone:* ${user.phone || 'Not set'}

*8x8org Identity:*
• *Digital ID:* \`${user.digital_id}\`
• *Account Number:* \`${user.account_number}\`
• *Referral Code:* \`${user.referral_code}\`

*Stats & Progress:*
• *Score:* ${user.score} points
• *Level:* ${user.level}
• *Reputation:* ${user.reputation}
• *Tasks Completed:* ${user.tasks_completed}
• *Joined:* ${new Date(user.created_at).toLocaleDateString()}

*Features Status:*
${features.notifications ? '🔔' : '🔕'} Notifications
${features.email_updates ? '📧' : '📭'} Email Updates
${features.privacy === 'public' ? '🌐' : '🔒'} ${features.privacy || 'standard'} Privacy

*Quick Actions:*
Use /edit_profile to update information
Use /features to adjust settings
                    `.trim();
                
                await this.bot.sendMessage(chatId, profileMessage, { parse_mode: 'Markdown' });
                
            } catch (error) {
                logger.error('Profile command error:', error);
                await this.bot.sendMessage(chatId, 
                    '❌ *Error loading profile*\n\n' +
                    'Please try again later.',
                    { parse_mode: 'Markdown' }
                );
            }
        });

        // ========== COMMAND 3: /edit_profile ==========
        this.bot.onText(/\/edit_profile/, async (msg) => {
            const chatId = msg.chat.id;
            const telegramId = msg.from.id;
            
            logger.userAction(telegramId, '/edit_profile command');
            
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '📧 Update Email', callback_data: 'edit_email' },
                            { text: '📱 Update Phone', callback_data: 'edit_phone' }
                        ],
                        [
                            { text: '👤 Update Name', callback_data: 'edit_name' },
                            { text: '🏷️ Update Label', callback_data: 'edit_label' }
                        ],
                        [
                            { text: '🎯 Update Goals', callback_data: 'edit_goals' },
                            { text: '🔙 Back to Profile', callback_data: 'back_to_profile' }
                        ]
                    ]
                }
            };
            
            await this.bot.sendMessage(chatId, 
                '✏️ *Edit Your Profile*\n\n' +
                'Select what you want to update:',
                { parse_mode: 'Markdown', ...keyboard }
            );
        });

        // ========== COMMAND 4: /features ==========
        this.bot.onText(/\/features/, async (msg) => {
            const chatId = msg.chat.id;
            const telegramId = msg.from.id;
            
            logger.userAction(telegramId, '/features command');
            
            const featuresList = `
⚙️ *Adjustable Features*

1. *Auto Backup* 🔄
   Automatically backup your data daily
   Command: /toggle_feature backup

2. *Email Notifications* 📧
   Receive email updates and reports
   Command: /toggle_feature email

3. *Public Profile* 🌐
   Show your profile in leaderboards
   Command: /toggle_feature public

4. *Task Reminders* ⏰
   Get reminders for pending tasks
   Command: /toggle_feature reminders

5. *Weekly Reports* 📊
   Receive weekly progress reports
   Command: /toggle_feature reports

6. *Achievement Alerts* 🏆
   Get notified of new achievements
   Command: /toggle_feature achievements

*Usage:* /toggle_feature [name]
*Example:* /toggle_feature email
            `.trim();
            
            await this.bot.sendMessage(chatId, featuresList, { parse_mode: 'Markdown' });
        });

        // ========== COMMAND 5: /toggle_feature ==========
        this.bot.onText(/\/toggle_feature\s+(\w+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const telegramId = msg.from.id;
            const featureName = match[1].toLowerCase();
            
            logger.userAction(telegramId, `/toggle_feature ${featureName}`);
            
            try {
                const user = await User.findOne({ where: { telegram_id: telegramId } });
                if (!user) return;
                
                const profileData = user.profile_data || {};
                const features = profileData.settings || {};
                
                const featureMap = {
                    'backup': 'auto_backup',
                    'email': 'email_notifications',
                    'public': 'public_profile',
                    'reminders': 'task_reminders',
                    'reports': 'weekly_reports',
                    'achievements': 'achievement_alerts'
                };
                
                const actualFeature = featureMap[featureName];
                if (!actualFeature) {
                    return await this.bot.sendMessage(chatId,
                        `❌ *Unknown feature: ${featureName}*\n\n` +
                        'Use /features to see available features.',
                        { parse_mode: 'Markdown' }
                    );
                }
                
                const currentValue = features[actualFeature] || false;
                features[actualFeature] = !currentValue;
                profileData.settings = features;
                
                user.profile_data = JSON.stringify(profileData);
                await user.save();
                
                const featureDisplayNames = {
                    'auto_backup': 'Auto Backup',
                    'email_notifications': 'Email Notifications',
                    'public_profile': 'Public Profile',
                    'task_reminders': 'Task Reminders',
                    'weekly_reports': 'Weekly Reports',
                    'achievement_alerts': 'Achievement Alerts'
                };
                
                await this.bot.sendMessage(chatId,
                    `✅ *${featureDisplayNames[actualFeature]} ${!currentValue ? 'enabled' : 'disabled'}!*\n\n` +
                    'Your preference has been saved.',
                    { parse_mode: 'Markdown' }
                );
                
            } catch (error) {
                logger.error('Toggle feature error:', error);
                await this.bot.sendMessage(chatId,
                    '❌ *Error updating feature*\n\n' +
                    'Please try again later.',
                    { parse_mode: 'Markdown' }
                );
            }
        });

        // ========== COMMAND 6: /admin (OWNER ONLY) ==========
        this.bot.onText(/\/admin/, async (msg) => {
            const chatId = msg.chat.id;
            const telegramId = msg.from.id;
            
            logger.userAction(telegramId, '/admin command attempt');
            
            // Check if user is owner
            if (telegramId.toString() !== process.env.OWNER_ID) {
                logger.userAction(telegramId, 'Unauthorized admin access attempt');
                return await this.bot.sendMessage(chatId,
                    '⛔ *Access Denied*\n\n' +
                    'This command is for system owner only.',
                    { parse_mode: 'Markdown' }
                );
            }
            
            logger.userAction(telegramId, 'Admin panel accessed');
            
            const adminKeyboard = {
                reply_markup: {
                    keyboard: [
                        ['📊 Generate Report', '👥 Manage Users'],
                        ['📈 System Stats', '⚙️ Bot Settings'],
                        ['📢 Send Broadcast', '💾 Backup System'],
                        ['🔗 Deploy to GitHub', '📋 View Logs'],
                        ['🔄 Restart System', '🔙 Exit Admin']
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            };
            
            await this.bot.sendMessage(chatId,
                `👑 *Admin Panel - 8x8org Ecosystem*\n\n` +
                `*Owner:* ${msg.from.first_name}\n` +
                `*ID:* ${telegramId}\n` +
                `*Time:* ${new Date().toLocaleString()}\n\n` +
                `Select an option below:`,
                { parse_mode: 'Markdown', ...adminKeyboard }
            );
        });

        // ========== COMMAND 7: /report (ADMIN ONLY) ==========
        this.bot.onText(/\/report\s+(\w+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const telegramId = msg.from.id;
            const period = match[1].toLowerCase();
            
            logger.userAction(telegramId, `/report ${period}`);
            
            // Check if user is owner/admin
            if (telegramId.toString() !== process.env.OWNER_ID) {
                return await this.bot.sendMessage(chatId,
                    '⛔ *Admin Only Command*',
                    { parse_mode: 'Markdown' }
                );
            }
            
            await this.bot.sendMessage(chatId,
                `📊 *Generating ${period} report...*\n\n` +
                'Please wait while we compile the data.',
                { parse_mode: 'Markdown' }
            );
            
            try {
                await this.generateReport(period, telegramId);
            } catch (error) {
                logger.error('Report generation error:', error);
                await this.bot.sendMessage(chatId,
                    '❌ *Error generating report*\n\n' +
                    `Error: ${error.message}`,
                    { parse_mode: 'Markdown' }
                );
            }
        });

        // ========== COMMAND 8: /broadcast (ADMIN ONLY) ==========
        this.bot.onText(/\/broadcast\s+(.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const telegramId = msg.from.id;
            const message = match[1];
            
            logger.userAction(telegramId, '/broadcast command');
            
            // Check if user is owner
            if (telegramId.toString() !== process.env.OWNER_ID) {
                return;
            }
            
            await this.bot.sendMessage(chatId,
                `📢 *Starting broadcast...*\n\n` +
                `Message: ${message.substring(0, 50)}...`,
                { parse_mode: 'Markdown' }
            );
            
            await this.broadcastMessage(message, telegramId);
        });

        // ========== COMMAND 9: /help ==========
        this.bot.onText(/\/help/, async (msg) => {
            const chatId = msg.chat.id;
            
            const helpMessage = `
📚 *8x8org Bot Commands*

*👤 User Commands:*
/start - Register and create account
/profile - View and manage profile
/edit_profile - Update profile information
/features - Adjustable features
/toggle_feature - Enable/disable features
/help - This help message

*📊 Task Commands:*
/tasks - View available tasks
/my_tasks - Your active tasks
/progress - Task progress
/score - Your current score

*👑 Admin Commands (Owner Only):*
/admin - Admin panel
/report [period] - Generate reports
/broadcast - Send message to all users
/backup - Backup system
/stats - System statistics

*📈 Report Periods:*
daily, weekly, monthly, yearly

*🔧 Support:*
Contact @${process.env.OWNER_ID} for assistance
            `.trim();
            
            await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
        });

        // ========== CALLBACK QUERY HANDLER ==========
        this.bot.on('callback_query', async (callbackQuery) => {
            const msg = callbackQuery.message;
            const data = callbackQuery.data;
            const chatId = msg.chat.id;
            const userId = callbackQuery.from.id;
            
            logger.userAction(userId, `Callback: ${data}`);
            
            try {
                switch(data) {
                    case 'edit_email':
                        await this.handleEditEmail(chatId, userId);
                        break;
                    case 'edit_phone':
                        await this.handleEditPhone(chatId, userId);
                        break;
                    case 'edit_name':
                        await this.handleEditName(chatId, userId);
                        break;
                    case 'back_to_profile':
                        await this.bot.deleteMessage(chatId, msg.message_id);
                        await this.bot.sendMessage(chatId, 'Returning to profile...');
                        // Trigger profile command
                        const fakeMsg = { ...msg, from: callbackQuery.from, text: '/profile' };
                        this.bot.emit('text', fakeMsg);
                        break;
                    default:
                        await this.bot.answerCallbackQuery(callbackQuery.id, {
                            text: 'Action not recognized'
                        });
                }
                
                await this.bot.answerCallbackQuery(callbackQuery.id);
            } catch (error) {
                logger.error('Callback query error:', error);
                await this.bot.answerCallbackQuery(callbackQuery.id, {
                    text: 'Error processing request'
                });
            }
        });

        logger.botEvent(this.botName, 'Commands setup complete');
        
    } catch (error) {
        logger.error('Failed to setup commands:', error);
        throw error;
    }
}

    async setupListeners() {
        // Handle text messages for profile editing
        this.bot.on('message', async (msg) => {
            if (!msg.text || msg.text.startsWith('/')) return;
            
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            const session = this.userSessions.get(userId);
            
            if (session && session.waitingFor === 'email') {
                await this.handleEmailInput(chatId, userId, msg.text);
                this.userSessions.delete(userId);
            }
            else if (session && session.waitingFor === 'phone') {
                await this.handlePhoneInput(chatId, userId, msg.text);
                this.userSessions.delete(userId);
            }
            else if (session && session.waitingFor === 'name') {
                await this.handleNameInput(chatId, userId, msg.text);
                this.userSessions.delete(userId);
            }
        });

        // Handle errors
        this.bot.on('error', (error) => {
            logger.error('Main bot error:', error);
        });

        this.bot.on('polling_error', (error) => {
            logger.error('Main bot polling error:', error);
        });

        logger.botEvent(this.botName, 'Listeners setup complete');
    }

    async handleReferral(user, referralCode) {
        try {
            const referrer = await User.findOne({ 
                where: { referral_code: referralCode }
            });
            
            if (referrer && referrer.id !== user.id) {
                // Update referrer's profile data
                const referrerProfile = referrer.profile_data || {};
                const referrals = referrerProfile.referrals || [];
                referrals.push({
                    user_id: user.id,
                    account_number: user.account_number,
                    joined_at: new Date().toISOString()
                });
                
                referrerProfile.referrals = referrals;
                referrer.profile_data = JSON.stringify(referrerProfile);
                
                // Add referral bonus
                referrer.score += 100; // 100 points for referral
                await referrer.save();
                
                // Update user's profile with referrer info
                const userProfile = user.profile_data || {};
                userProfile.referred_by = {
                    user_id: referrer.id,
                    account_number: referrer.account_number,
                    referral_code: referralCode
                };
                user.profile_data = JSON.stringify(userProfile);
                await user.save();
                
                logger.userAction(user.id, 'Referred by user', {
                    referrer_id: referrer.id,
                    referral_code: referralCode
                });
                
                // Notify referrer
                await this.sendToUser(referrer.telegram_id,
                    `🎉 *New Referral!*\n\n` +
                    `User ${user.account_number} joined using your referral code!\n` +
                    `You earned *100 points*!\n\n` +
                    `Your total referrals: ${referrals.length}`
                );
            }
        } catch (error) {
            logger.error('Referral handling error:', error);
        }
    }

    async handleEditEmail(chatId, userId) {
        this.userSessions.set(userId, { waitingFor: 'email' });
        
        await this.bot.sendMessage(chatId,
            '📧 *Update Email Address*\n\n' +
            'Please enter your email address:\n\n' +
            'We will use this to send you reports and notifications.\n' +
            'Type /cancel to abort.',
            { parse_mode: 'Markdown' }
        );
    }

    async handleEmailInput(chatId, userId, email) {
        if (email === '/cancel') {
            await this.bot.sendMessage(chatId, '❌ Email update cancelled.');
            return;
        }
        
        if (!security.validateEmail(email)) {
            await this.bot.sendMessage(chatId,
                '❌ *Invalid email format*\n\n' +
                'Please enter a valid email address:',
                { parse_mode: 'Markdown' }
            );
            return;
        }
        
        try {
            const user = await User.findOne({ where: { telegram_id: userId } });
            if (user) {
                user.email = email;
                await user.save();
                
                await this.bot.sendMessage(chatId,
                    `✅ *Email updated successfully!*\n\n` +
                    `Your email: ${email}\n\n` +
                    'You will now receive reports and notifications.',
                    { parse_mode: 'Markdown' }
                );
                
                logger.userAction(userId, 'Email updated', { email: email });
            }
        } catch (error) {
            logger.error('Email update error:', error);
            await this.bot.sendMessage(chatId,
                '❌ *Error updating email*\n\n' +
                'Please try again later.',
                { parse_mode: 'Markdown' }
            );
        }
    }

    async handleEditPhone(chatId, userId) {
        this.userSessions.set(userId, { waitingFor: 'phone' });
        
        await this.bot.sendMessage(chatId,
            '📱 *Update Phone Number*\n\n' +
            'Please enter your phone number (with country code):\n\n' +
            'Example: +12345678900\n' +
            'Type /cancel to abort.',
            { parse_mode: 'Markdown' }
        );
    }

    async handlePhoneInput(chatId, userId, phone) {
        if (phone === '/cancel') {
            await this.bot.sendMessage(chatId, '❌ Phone update cancelled.');
            return;
        }
        
        // Basic phone validation
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phone)) {
            await this.bot.sendMessage(chatId,
                '❌ *Invalid phone number*\n\n' +
                'Please enter a valid phone number with country code:\n' +
                'Example: +12345678900',
                { parse_mode: 'Markdown' }
            );
            return;
        }
        
        try {
            const user = await User.findOne({ where: { telegram_id: userId } });
            if (user) {
                user.phone = phone;
                await user.save();
                
                await this.bot.sendMessage(chatId,
                    `✅ *Phone number updated!*\n\n` +
                    `Your phone: ${phone}`,
                    { parse_mode: 'Markdown' }
                );
                
                logger.userAction(userId, 'Phone updated', { phone: phone });
            }
        } catch (error) {
            logger.error('Phone update error:', error);
            await this.bot.sendMessage(chatId,
                '❌ *Error updating phone number*',
                { parse_mode: 'Markdown' }
            );
        }
    }

    async handleEditName(chatId, userId) {
        this.userSessions.set(userId, { waitingFor: 'name' });
        
        await this.bot.sendMessage(chatId,
            '👤 *Update Name*\n\n' +
            'Please enter your new name:\n\n' +
            'Format: FirstName LastName\n' +
            'Type /cancel to abort.',
            { parse_mode: 'Markdown' }
        );
    }

    async handleNameInput(chatId, userId, name) {
        if (name === '/cancel') {
            await this.bot.sendMessage(chatId, '❌ Name update cancelled.');
            return;
        }
        
        const names = name.trim().split(' ');
        const firstName = names[0] || '';
        const lastName = names.slice(1).join(' ') || null;
        
        if (!firstName) {
            await this.bot.sendMessage(chatId,
                '❌ *Invalid name*\n\n' +
                'Please enter at least a first name.',
                { parse_mode: 'Markdown' }
            );
            return;
        }
        
        try {
            const user = await User.findOne({ where: { telegram_id: userId } });
            if (user) {
                user.first_name = firstName;
                user.last_name = lastName;
                await user.save();
                
                await this.bot.sendMessage(chatId,
                    `✅ *Name updated!*\n\n` +
                    `New name: ${firstName} ${lastName || ''}`,
                    { parse_mode: 'Markdown' }
                );
                
                logger.userAction(userId, 'Name updated', { 
                    first_name: firstName, 
                    last_name: lastName 
                });
            }
        } catch (error) {
            logger.error('Name update error:', error);
            await this.bot.sendMessage(chatId,
                '❌ *Error updating name*',
                { parse_mode: 'Markdown' }
            );
        }
    }

    async generateReport(period, adminId) {
        try {
            const { User, UserTask } = require('../../database/models');
            const ExcelJS = require('exceljs');
            
            let startDate = new Date();
            let periodName = period;
            
            switch(period) {
                case 'daily':
                    startDate.setDate(startDate.getDate() - 1);
                    break;
                case 'weekly':
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case 'monthly':
                    startDate.setMonth(startDate.getMonth() - 1);
                    break;
                case 'yearly':
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    break;
                default:
                    startDate.setDate(startDate.getDate() - 1);
                    periodName = 'daily';
            }
            
            // Collect data
            const newUsers = await User.count({
                where: {
                    created_at: { $gte: startDate }
                }
            });
            
            const activeUsers = await User.count({
                where: {
                    last_active: { $gte: startDate }
                }
            });
            
            const completedTasks = await UserTask.count({
                where: {
                    status: 'completed',
                    completed_at: { $gte: startDate }
                }
            });
            
            const topUsers = await User.findAll({
                where: { is_banned: false },
                order: [['score', 'DESC']],
                limit: 20
            });
            
            // Create Excel workbook
            const workbook = new ExcelJS.Workbook();
            workbook.creator = '8x8org Telegram Ecosystem';
            workbook.created = new Date();
            
            // Summary sheet
            const summarySheet = workbook.addWorksheet('Summary');
            summarySheet.columns = [
                { header: 'Metric', key: 'metric', width: 30 },
                { header: 'Value', key: 'value', width: 20 }
            ];
            
            summarySheet.addRow({ metric: 'Report Period', value: periodName });
            summarySheet.addRow({ metric: 'Start Date', value: startDate.toLocaleDateString() });
            summarySheet.addRow({ metric: 'End Date', value: new Date().toLocaleDateString() });
            summarySheet.addRow({ metric: 'Generated At', value: new Date().toLocaleString() });
            summarySheet.addRow({}); // Empty row
            summarySheet.addRow({ metric: 'New Users', value: newUsers });
            summarySheet.addRow({ metric: 'Active Users', value: activeUsers });
            summarySheet.addRow({ metric: 'Tasks Completed', value: completedTasks });
            summarySheet.addRow({ metric: 'Total Users', value: await User.count() });
            summarySheet.addRow({ metric: 'Total Tasks', value: await UserTask.count() });
            
            // Top Users sheet
            const usersSheet = workbook.addWorksheet('Top Users');
            usersSheet.columns = [
                { header: 'Rank', key: 'rank', width: 10 },
                { header: 'Account Number', key: 'account', width: 25 },
                { header: 'Name', key: 'name', width: 25 },
                { header: 'Score', key: 'score', width: 15 },
                { header: 'Level', key: 'level', width: 10 },
                { header: 'Tasks', key: 'tasks', width: 10 },
                { header: 'Joined', key: 'joined', width: 15 }
            ];
            
            topUsers.forEach((user, index) => {
                usersSheet.addRow({
                    rank: index + 1,
                    account: user.account_number,
                    name: `${user.first_name} ${user.last_name || ''}`.trim(),
                    score: user.score,
                    level: user.level,
                    tasks: user.tasks_completed,
                    joined: new Date(user.created_at).toLocaleDateString()
                });
            });
            
            // Save file
            const reportsDir = './reports/exports';
            if (!require('fs').existsSync(reportsDir)) {
                require('fs').mkdirSync(reportsDir, { recursive: true });
            }
            
            const filename = `8x8org_${periodName}_report_${Date.now()}.xlsx`;
            const filepath = `${reportsDir}/${filename}`;
            
            await workbook.xlsx.writeFile(filepath);
            
            // Send to admin via Telegram
            await this.bot.sendDocument(adminId, filepath, {
                caption: `📊 *${periodName.charAt(0).toUpperCase() + periodName.slice(1)} Report Generated*\n\n` +
                        `📅 Period: ${startDate.toLocaleDateString()} - ${new Date().toLocaleDateString()}\n` +
                        `👥 New Users: ${newUsers}\n` +
                        `📈 Active Users: ${activeUsers}\n` +
                        `✅ Tasks Completed: ${completedTasks}\n\n` +
                        `File: ${filename}`,
                parse_mode: 'Markdown'
            });
            
            // Also send via email
            await emailService.sendEmailWithExcel(
                [
                    { metric: 'New Users', value: newUsers },
                    { metric: 'Active Users', value: activeUsers },
                    { metric: 'Tasks Completed', value: completedTasks }
                ],
                filename.replace('.xlsx', ''),
                process.env.ADMIN_EMAIL,
                `8x8org ${periodName} Report`
            );
            
            logger.userAction(adminId, `Generated ${periodName} report`, {
                new_users: newUsers,
                active_users: activeUsers,
                completed_tasks: completedTasks
            });
            
        } catch (error) {
            logger.error('Report generation error:', error);
            throw error;
        }
    }

    async broadcastMessage(message, adminId) {
        try {
            const { User } = require('../../database/models');
            
            const users = await User.findAll({
                where: { is_banned: false },
                attributes: ['telegram_id', 'first_name']
            });
            
            let success = 0;
            let failed = 0;
            
            await this.bot.sendMessage(adminId,
                `📢 *Broadcast Started*\n\n` +
                `Recipients: ${users.length} users\n` +
                `Message length: ${message.length} characters\n\n` +
                `Sending...`,
                { parse_mode: 'Markdown' }
            );
            
            for (const user of users) {
                try {
                    await this.bot.sendMessage(user.telegram_id,
                        `📢 *Broadcast from Admin*\n\n${message}\n\n- 8x8org Team`,
                        { parse_mode: 'Markdown' }
                    );
                    success++;
                    
                    // Rate limiting
                    if (success % 10 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    
                } catch (error) {
                    failed++;
                    logger.error(`Failed to send to ${user.telegram_id}:`, error.message);
                }
            }
            
            await this.bot.sendMessage(adminId,
                `✅ *Broadcast Complete*\n\n` +
                `✅ Success: ${success} users\n` +
                `❌ Failed: ${failed} users\n` +
                `📊 Total: ${users.length} users\n\n` +
                `Success rate: ${((success / users.length) * 100).toFixed(1)}%`,
                { parse_mode: 'Markdown' }
            );
            
            logger.userAction(adminId, 'Broadcast sent', {
                success: success,
                failed: failed,
                total: users.length
            });
            
        } catch (error) {
            logger.error('Broadcast error:', error);
            await this.bot.sendMessage(adminId,
                '❌ *Broadcast failed*\n\n' +
                `Error: ${error.message}`,
                { parse_mode: 'Markdown' }
            );
        }
    }

    async sendToUser(telegramId, message, options = {}) {
        try {
            return await this.bot.sendMessage(telegramId, message, {
                parse_mode: 'Markdown',
                ...options
            });
        } catch (error) {
            logger.error(`Failed to send message to ${telegramId}:`, error);
            return null;
        }
    }

    async sendToOwner(message, options = {}) {
        return await this.sendToUser(process.env.OWNER_ID, message, options);
    }

    async notifyOwnerStartup() {
        try {
            const { User } = require('../../database/models');
            const userCount = await User.count();
            
            await this.sendToOwner(
                `🚀 *System Startup Notification*\n\n` +
                `✅ 8x8org Ecosystem is now running\n\n` +
                `📊 *Initial Stats:*\n` +
                `• Total Users: ${userCount}\n` +
                `• Bot: @${(await this.bot.getMe()).username}\n` +
                `• Time: ${new Date().toLocaleString()}\n\n` +
                `🔧 *Environment:* ${process.env.NODE_ENV}\n` +
                `🕒 *Uptime:* Just started\n\n` +
                `Use /admin to access controls`,
                { parse_mode: 'Markdown' }
            );
            
            logger.botEvent(this.botName, 'Startup notification sent to owner');
        } catch (error) {
            logger.error('Failed to send startup notification:', error);
        }
    }

    async stop() {
        try {
            this.bot.stopPolling();
            logger.botEvent(this.botName, 'Stopped polling');
            
            // Send shutdown notification to owner
            await this.sendToOwner(
                `🛑 *Main Bot Shutdown*\n\n` +
                `Main bot has been stopped.\n` +
                `Time: ${new Date().toLocaleString()}`,
                { parse_mode: 'Markdown' }
            );
            
        } catch (error) {
            logger.error('Error stopping main bot:', error);
        }
    }
}

async function startMainBot() {
    try {
        const bot = new MainBot();
        logger.botEvent('main', 'Bot instance created');
        return bot;
    } catch (error) {
        logger.error('Failed to start main bot:', error);
        throw error;
    }
}

module.exports = {
    MainBot,
    startMainBot
};
