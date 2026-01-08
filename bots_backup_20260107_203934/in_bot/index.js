const TelegramBot = require('node-telegram-bot-api');
const { Task, User, UserTask } = require('../../database/models');
const logger = require('../../utils/logger');

class InBot {
    constructor() {
        this.token = process.env.IN_BOT_TOKEN || process.env.APP_BOT_TOKEN;
        if (!this.token) {
            logger.warn('IN_BOT_TOKEN not set, using APP_BOT_TOKEN');
        }
        
        this.bot = new TelegramBot(this.token, { polling: true });
        this.botName = 'IN';
        this.userSessions = new Map();
        this.initialize();
    }

    async initialize() {
        logger.botEvent(this.botName, 'Initializing...');
        
        try {
            await this.setupCommands();
            await this.setupListeners();
            
            // Test connection
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
            
            logger.userAction(userId, 'IN bot /start');
            
            const welcomeMessage = `
📥 *Welcome to IN Bot!*

This bot handles task assignments and completions.

*Available Commands:*
/tasks - View available tasks
/task_[id] - Start a specific task
/my_tasks - Your active tasks
/progress - Your progress
/score - Your current score
/help - Show help

*How it works:*
1. Browse available tasks with /tasks
2. Start a task with /task_[number]
3. Complete the task requirements
4. Submit with /submit_[number]
5. Earn points and level up!

*Note:* You need to be registered with the main bot first.
            `.trim();
            
            await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
        });

        // ========== COMMAND: /tasks ==========
        this.bot.onText(/\/tasks/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            
            logger.userAction(userId, 'IN bot /tasks');
            
            try {
                const user = await User.findOne({ where: { telegram_id: userId } });
                if (!user) {
                    return await this.bot.sendMessage(chatId,
                        '❌ *Please register first*\n\n' +
                        'Use /start in the main bot (@xorgbytm8_bot) to register.',
                        { parse_mode: 'Markdown' }
                    );
                }
                
                const tasks = await Task.findAll({
                    where: {
                        bot_type: 'IN',
                        is_active: true
                    },
                    order: [['points_reward', 'DESC']],
                    limit: 10
                });
                
                if (tasks.length === 0) {
                    return await this.bot.sendMessage(chatId,
                        '📭 *No tasks available*\n\n' +
                        'Check back later for new tasks!',
                        { parse_mode: 'Markdown' }
                    );
                }
                
                let message = `📋 *Available IN Tasks*\n\n`;
                
                tasks.forEach((task, index) => {
                    message += `*${index + 1}. ${task.title}*\n`;
                    message += `📝 ${task.description?.substring(0, 50) || 'No description'}...\n`;
                    message += `🏆 *Points:* ${task.points_reward}\n`;
                    message += `⏱️ *Cooldown:* ${task.cooldown_seconds ? `${Math.floor(task.cooldown_seconds / 3600)}h` : 'None'}\n`;
                    message += `🔢 *Command:* /task_${task.id}\n\n`;
                });
                
                message += `*To start a task:* /task_[number]\n`;
                message += `*Example:* /task_1`;
                
                await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
                
            } catch (error) {
                logger.error('Tasks command error:', error);
                await this.bot.sendMessage(chatId,
                    '❌ *Error loading tasks*\n\n' +
                    'Please try again later.',
                    { parse_mode: 'Markdown' }
                );
            }
        });

        // ========== COMMAND: /task_[id] ==========
        this.bot.onText(/\/task_(\d+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            const taskId = parseInt(match[1]);
            
            logger.userAction(userId, `IN bot /task_${taskId}`);
            
            try {
                const user = await User.findOne({ where: { telegram_id: userId } });
                if (!user) {
                    return await this.bot.sendMessage(chatId,
                        '❌ *Please register first*',
                        { parse_mode: 'Markdown' }
                    );
                }
                
                const task = await Task.findOne({
                    where: {
                        id: taskId,
                        bot_type: 'IN',
                        is_active: true
                    }
                });
                
                if (!task) {
                    return await this.bot.sendMessage(chatId,
                        `❌ *Task not found*\n\n` +
                        `Task ID ${taskId} doesn't exist or is inactive.`,
                        { parse_mode: 'Markdown' }
                    );
                }
                
                // Check if user already has this task
                const existingTask = await UserTask.findOne({
                    where: {
                        user_id: user.id,
                        task_id: task.id,
                        status: ['pending', 'in_progress']
                    }
                });
                
                if (existingTask) {
                    return await this.bot.sendMessage(chatId,
                        `⏳ *Task already in progress*\n\n` +
                        `Task: ${task.title}\n` +
                        `Status: ${existingTask.status}\n\n` +
                        `Use /submit_${task.id} to complete it.`,
                        { parse_mode: 'Markdown' }
                    );
                }
                
                // Check cooldown
                const lastCompletion = await UserTask.findOne({
                    where: {
                        user_id: user.id,
                        task_id: task.id,
                        status: 'completed'
                    },
                    order: [['completed_at', 'DESC']]
                });
                
                if (lastCompletion && task.cooldown_seconds > 0) {
                    const cooldownEnd = new Date(lastCompletion.completed_at);
                    cooldownEnd.setSeconds(cooldownEnd.getSeconds() + task.cooldown_seconds);
                    
                    if (new Date() < cooldownEnd) {
                        const remaining = Math.ceil((cooldownEnd - new Date()) / 1000);
                        const hours = Math.floor(remaining / 3600);
                        const minutes = Math.floor((remaining % 3600) / 60);
                        
                        return await this.bot.sendMessage(chatId,
                            `⏰ *Task on cooldown*\n\n` +
                            `You can retry this task in:\n` +
                            `${hours > 0 ? `${hours}h ` : ''}${minutes}m`,
                            { parse_mode: 'Markdown' }
                        );
                    }
                }
                
                // Create user task
                const userTask = await UserTask.create({
                    user_id: user.id,
                    task_id: task.id,
                    status: 'in_progress',
                    started_at: new Date()
                });
                
                // Store in session
                this.userSessions.set(`${userId}_${taskId}`, {
                    userTaskId: userTask.id,
                    taskId: task.id
                });
                
                const taskMessage = `
📥 *Task Assigned: ${task.title}*

📝 *Description:*
${task.description || 'No description provided'}

🏆 *Points Reward:* ${task.points_reward}
⏱️ *Time to Complete:* ${task.cooldown_seconds ? `${Math.floor(task.cooldown_seconds / 3600)} hours` : 'No limit'}

*To complete this task:*
1. Follow the instructions above
2. When done, use: /submit_${task.id}
3. Or cancel with: /cancel_${task.id}

*Requirements:*
${task.requirements ? JSON.stringify(task.requirements) : 'None'}
                `.trim();
                
                await this.bot.sendMessage(chatId, taskMessage, { parse_mode: 'Markdown' });
                
                logger.taskEvent(task.id, user.id, 'Task assigned', {
                    points: task.points_reward
                });
                
            } catch (error) {
                logger.error('Task assignment error:', error);
                await this.bot.sendMessage(chatId,
                    '❌ *Error assigning task*\n\n' +
                    'Please try again later.',
                    { parse_mode: 'Markdown' }
                );
            }
        });

        // ========== COMMAND: /submit_[id] ==========
        this.bot.onText(/\/submit_(\d+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            const taskId = parseInt(match[1]);
            
            logger.userAction(userId, `IN bot /submit_${taskId}`);
            
            try {
                const user = await User.findOne({ where: { telegram_id: userId } });
                if (!user) return;
                
                const sessionKey = `${userId}_${taskId}`;
                const session = this.userSessions.get(sessionKey);
                
                if (!session) {
                    return await this.bot.sendMessage(chatId,
                        '❌ *No active task found*\n\n' +
                        'Start a task first with /task_[id]',
                        { parse_mode: 'Markdown' }
                    );
                }
                
                // Set waiting for response
                this.userSessions.set(`waiting_${userId}`, {
                    taskId: taskId,
                    userTaskId: session.userTaskId
                });
                
                await this.bot.sendMessage(chatId,
                    `📤 *Submit Task Response*\n\n` +
                    `Please provide your response for task completion.\n\n` +
                    `You can send:\n` +
                    `• Text response\n` +
                    `• Photo with caption\n` +
                    `• Document\n\n` +
                    `*Type /cancel to abort submission*`,
                    { parse_mode: 'Markdown' }
                );
                
            } catch (error) {
                logger.error('Submit command error:', error);
                await this.bot.sendMessage(chatId,
                    '❌ *Error processing submission*',
                    { parse_mode: 'Markdown' }
                );
            }
        });

        // ========== COMMAND: /my_tasks ==========
        this.bot.onText(/\/my_tasks/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            
            logger.userAction(userId, 'IN bot /my_tasks');
            
            try {
                const user = await User.findOne({ where: { telegram_id: userId } });
                if (!user) return;
                
                const userTasks = await UserTask.findAll({
                    where: { user_id: user.id },
                    include: [{
                        model: Task,
                        where: { bot_type: 'IN' },
                        required: true
                    }],
                    order: [['created_at', 'DESC']],
                    limit: 10
                });
                
                if (userTasks.length === 0) {
                    return await this.bot.sendMessage(chatId,
                        '📭 *No active tasks*\n\n' +
                        'Use /tasks to see available tasks.',
                        { parse_mode: 'Markdown' }
                    );
                }
                
                let message = `📋 *Your IN Tasks*\n\n`;
                
                userTasks.forEach((userTask, index) => {
                    const task = userTask.Task;
                    message += `*${index + 1}. ${task.title}*\n`;
                    message += `📊 Status: ${userTask.status}\n`;
                    message += `⏱️ Started: ${new Date(userTask.started_at).toLocaleDateString()}\n`;
                    if (userTask.score_earned > 0) {
                        message += `🏆 Points: ${userTask.score_earned}\n`;
                    }
                    message += `🔢 ID: ${task.id}\n\n`;
                });
                
                message += `*To submit:* /submit_[id]\n`;
                message += `*To cancel:* /cancel_[id]`;
                
                await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
                
            } catch (error) {
                logger.error('My tasks command error:', error);
                await this.bot.sendMessage(chatId,
                    '❌ *Error loading your tasks*',
                    { parse_mode: 'Markdown' }
                );
            }
        });

        // ========== COMMAND: /progress ==========
        this.bot.onText(/\/progress/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            
            logger.userAction(userId, 'IN bot /progress');
            
            try {
                const user = await User.findOne({ where: { telegram_id: userId } });
                if (!user) return;
                
                const userTasks = await UserTask.findAll({
                    where: { user_id: user.id },
                    include: [{
                        model: Task,
                        where: { bot_type: 'IN' },
                        required: true
                    }]
                });
                
                const completed = userTasks.filter(t => t.status === 'completed').length;
                const inProgress = userTasks.filter(t => t.status === 'in_progress').length;
                const totalScore = userTasks
                    .filter(t => t.status === 'completed')
                    .reduce((sum, t) => sum + (t.score_earned || 0), 0);
                
                const progressMessage = `
📊 *Your IN Bot Progress*

✅ *Completed Tasks:* ${completed}
⏳ *In Progress:* ${inProgress}
🏆 *Total Points Earned:* ${totalScore}
📈 *Overall Score:* ${user.score}
🎯 *Level:* ${user.level}

*Recent Activity:*
${userTasks.slice(0, 3).map((t, i) => 
    `${i + 1}. ${t.Task.title} - ${t.status}${t.score_earned ? ` (+${t.score_earned})` : ''}`
).join('\n')}

*Keep up the great work!* 🚀
                `.trim();
                
                await this.bot.sendMessage(chatId, progressMessage, { parse_mode: 'Markdown' });
                
            } catch (error) {
                logger.error('Progress command error:', error);
                await this.bot.sendMessage(chatId,
                    '❌ *Error loading progress*',
                    { parse_mode: 'Markdown' }
                );
            }
        });

        // ========== COMMAND: /score ==========
        this.bot.onText(/\/score/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            
            logger.userAction(userId, 'IN bot /score');
            
            try {
                const user = await User.findOne({ where: { telegram_id: userId } });
                if (!user) return;
                
                await this.bot.sendMessage(chatId,
                    `🎯 *Your Score*\n\n` +
                    `🏆 *Total:* ${user.score} points\n` +
                    `⭐ *Level:* ${user.level}\n` +
                    `✅ *Tasks Completed:* ${user.tasks_completed}\n` +
                    `📈 *Reputation:* ${user.reputation}\n\n` +
                    `*Keep completing tasks to increase your score!*`,
                    { parse_mode: 'Markdown' }
                );
                
            } catch (error) {
                logger.error('Score command error:', error);
            }
        });

        // ========== COMMAND: /help ==========
        this.bot.onText(/\/help/, async (msg) => {
            const chatId = msg.chat.id;
            
            const helpMessage = `
🤖 *IN Bot Commands*

*📋 Task Commands:*
/tasks - View available tasks
/task_[id] - Start a task
/submit_[id] - Submit task response
/my_tasks - Your active tasks
/cancel_[id] - Cancel a task

*📊 Information:*
/progress - Your progress
/score - Your current score
/help - This help message

*🔗 Integration:*
Use /start in main bot to register
All tasks award points
Points contribute to your overall score

*🆘 Need help?* Contact admin.
            `.trim();
            
            await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
        });

        logger.botEvent(this.botName, 'Commands setup complete');
        
    } catch (error) {
        logger.error('Failed to setup IN bot commands:', error);
        throw error;
    }
}

    async setupListeners() {
        // Handle text responses for task submissions
        this.bot.on('message', async (msg) => {
            if (!msg.text || msg.text.startsWith('/')) return;
            
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            const waitingSession = this.userSessions.get(`waiting_${userId}`);
            
            if (waitingSession) {
                await this.handleTaskSubmission(chatId, userId, msg.text, waitingSession);
                this.userSessions.delete(`waiting_${userId}`);
            }
        });

        // Handle photo submissions
        this.bot.on('photo', async (msg) => {
            const userId = msg.from.id;
            const waitingSession = this.userSessions.get(`waiting_${userId}`);
            
            if (waitingSession) {
                await this.handlePhotoSubmission(msg, waitingSession);
                this.userSessions.delete(`waiting_${userId}`);
            }
        });

        // Handle document submissions
        this.bot.on('document', async (msg) => {
            const userId = msg.from.id;
            const waitingSession = this.userSessions.get(`waiting_${userId}`);
            
            if (waitingSession) {
                await this.handleDocumentSubmission(msg, waitingSession);
                this.userSessions.delete(`waiting_${userId}`);
            }
        });

        // Error handling
        this.bot.on('error', (error) => {
            logger.error('IN bot error:', error);
        });

        logger.botEvent(this.botName, 'Listeners setup complete');
    }

    async handleTaskSubmission(chatId, userId, response, session) {
        try {
            const { taskId, userTaskId } = session;
            
            const userTask = await UserTask.findByPk(userTaskId);
            if (!userTask) {
                await this.bot.sendMessage(chatId, '❌ Task not found');
                return;
            }
            
            const task = await Task.findByPk(taskId);
            if (!task) {
                await this.bot.sendMessage(chatId, '❌ Task details not found');
                return;
            }
            
            // Update user task with submission
            userTask.submitted_data = JSON.stringify({
                response: response,
                submitted_at: new Date().toISOString(),
                type: 'text'
            });
            userTask.status = 'completed';
            userTask.completed_at = new Date();
            userTask.score_earned = task.points_reward;
            await userTask.save();
            
            // Update user score
            const user = await User.findOne({ where: { telegram_id: userId } });
            if (user) {
                const oldScore = user.score;
                const oldLevel = user.level;
                
                user.score += task.points_reward;
                user.tasks_completed += 1;
                
                // Level up logic
                const newLevel = Math.floor(user.score / 100) + 1;
                user.level = newLevel;
                await user.save();
                
                // Clear session
                this.userSessions.delete(`${userId}_${taskId}`);
                
                // Send confirmation
                const confirmationMessage = `
✅ *Task Completed Successfully!*

🎯 *Task:* ${task.title}
📝 *Response recorded*
🏆 *Points earned:* +${task.points_reward}
💰 *New total:* ${user.score} points
${newLevel > oldLevel ? `🎉 *Level Up!* You're now level ${newLevel}\n` : ''}

*Use /tasks for more tasks!*
*Use /progress to track your achievements.*
                `.trim();
                
                await this.bot.sendMessage(chatId, confirmationMessage, { parse_mode: 'Markdown' });
                
                logger.taskEvent(task.id, user.id, 'Task completed', {
                    points_earned: task.points_reward,
                    new_score: user.score,
                    level_up: newLevel > oldLevel
                });
                
                // Notify owner for high-value tasks
                if (task.points_reward >= 100) {
                    await this.notifyOwnerAboutTaskCompletion(user, task, response);
                }
            }
            
        } catch (error) {
            logger.error('Task submission error:', error);
            await this.bot.sendMessage(chatId,
                '❌ *Error processing submission*\n\n' +
                'Please try again or contact support.',
                { parse_mode: 'Markdown' }
            );
        }
    }

    async handlePhotoSubmission(msg, session) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        
        try {
            const { taskId, userTaskId } = session;
            
            const userTask = await UserTask.findByPk(userTaskId);
            const task = await Task.findByPk(taskId);
            const user = await User.findOne({ where: { telegram_id: userId } });
            
            if (!userTask || !task || !user) {
                await this.bot.sendMessage(chatId, '❌ Submission error');
                return;
            }
            
            // Get the largest photo (last in array)
            const photo = msg.photo[msg.photo.length - 1];
            const fileId = photo.file_id;
            
            userTask.submitted_data = JSON.stringify({
                type: 'photo',
                file_id: fileId,
                caption: msg.caption || '',
                submitted_at: new Date().toISOString()
            });
            userTask.status = 'completed';
            userTask.completed_at = new Date();
            userTask.score_earned = task.points_reward;
            await userTask.save();
            
            // Update user
            user.score += task.points_reward;
            user.tasks_completed += 1;
            await user.save();
            
            // Clear session
            this.userSessions.delete(`${userId}_${taskId}`);
            
            await this.bot.sendMessage(chatId,
                `✅ *Photo submitted!*\n\n` +
                `🎯 Task: ${task.title}\n` +
                `🏆 Points earned: +${task.points_reward}\n` +
                `💰 New total: ${user.score} points`,
                { parse_mode: 'Markdown' }
            );
            
            logger.taskEvent(task.id, user.id, 'Photo task completed', {
                points_earned: task.points_reward
            });
            
        } catch (error) {
            logger.error('Photo submission error:', error);
            await this.bot.sendMessage(chatId, '❌ Error processing photo submission');
        }
    }

    async handleDocumentSubmission(msg, session) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        
        try {
            const { taskId, userTaskId } = session;
            
            const userTask = await UserTask.findByPk(userTaskId);
            const task = await Task.findByPk(taskId);
            const user = await User.findOne({ where: { telegram_id: userId } });
            
            if (!userTask || !task || !user) {
                await this.bot.sendMessage(chatId, '❌ Submission error');
                return;
            }
            
            const document = msg.document;
            
            userTask.submitted_data = JSON.stringify({
                type: 'document',
                file_id: document.file_id,
                file_name: document.file_name,
                mime_type: document.mime_type,
                caption: msg.caption || '',
                submitted_at: new Date().toISOString()
            });
            userTask.status = 'completed';
            userTask.completed_at = new Date();
            userTask.score_earned = task.points_reward;
            await userTask.save();
            
            // Update user
            user.score += task.points_reward;
            user.tasks_completed += 1;
            await user.save();
            
            // Clear session
            this.userSessions.delete(`${userId}_${taskId}`);
            
            await this.bot.sendMessage(chatId,
                `✅ *Document submitted!*\n\n` +
                `🎯 Task: ${task.title}\n` +
                `📄 File: ${document.file_name}\n` +
                `🏆 Points earned: +${task.points_reward}\n` +
                `💰 New total: ${user.score} points`,
                { parse_mode: 'Markdown' }
            );
            
            logger.taskEvent(task.id, user.id, 'Document task completed', {
                points_earned: task.points_reward,
                file_name: document.file_name
            });
            
        } catch (error) {
            logger.error('Document submission error:', error);
            await this.bot.sendMessage(chatId, '❌ Error processing document submission');
        }
    }

    async notifyOwnerAboutTaskCompletion(user, task, response) {
        try {
            // This would send to owner bot or main bot
            // For now, just log
            logger.userAction(user.id, 'High-value task completed', {
                task_id: task.id,
                task_title: task.title,
                points: task.points_reward,
                response_preview: response.substring(0, 100)
            });
        } catch (error) {
            logger.error('Failed to notify owner:', error);
        }
    }

    async stop() {
        try {
            this.bot.stopPolling();
            logger.botEvent(this.botName, 'Stopped polling');
        } catch (error) {
            logger.error('Error stopping IN bot:', error);
        }
    }
}

async function startInBot() {
    try {
        const bot = new InBot();
        logger.botEvent('IN', 'Bot instance created');
        return bot;
    } catch (error) {
        logger.error('Failed to start IN bot:', error);
        // Don't throw if token not set (optional bot)
        if (error.message.includes('token')) {
            logger.warn('IN bot not started (token not configured)');
            return null;
        }
        throw error;
    }
}

module.exports = {
    InBot,
    startInBot
};
