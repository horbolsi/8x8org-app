// Admin Authentication Middleware
// Ensures only admin can access certain commands

const adminConfig = require('../admin_config');

function isAdmin(ctx, next) {
    const userId = ctx.from?.id;
    const username = ctx.from?.username;
    
    if (!userId) {
        return ctx.reply('❌ User ID not found. Please try again.');
    }
    
    if (adminConfig.isAdmin(userId)) {
        return next();
    } else {
        // Log unauthorized access attempt
        console.log(`🚫 Unauthorized access attempt by user ${userId} (@${username})`);
        
        return ctx.reply(
            `⛔ Access Denied\n\n` +
            `This command is restricted to administrators only.\n\n` +
            `${adminConfig.getSignature()}`
        );
    }
}

function requireAdmin(bot, command, handler) {
    bot.command(command, (ctx) => {
        const userId = ctx.from.id;
        
        if (adminConfig.isAdmin(userId)) {
            return handler(ctx);
        } else {
            return ctx.reply(
                `🚫 Administrator Required\n\n` +
                `This command can only be used by the system owner.\n\n` +
                `${adminConfig.getSignature()}`
            );
        }
    });
}

function adminOnly(bot, command, handler) {
    bot.command(command, isAdmin, handler);
}

function logAction(userId, action, details = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        userId,
        action,
        details,
        signature: '8x8org by FlashTM8 ⚡️'
    };
    
    console.log(`📝 ADMIN LOG: ${JSON.stringify(logEntry)}`);
    
    // Save to log file
    const fs = require('fs');
    const logDir = './logs/admin';
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = `${logDir}/actions_${new Date().toISOString().split('T')[0]}.json`;
    let logs = [];
    
    if (fs.existsSync(logFile)) {
        logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    }
    
    logs.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
}

module.exports = {
    isAdmin,
    requireAdmin,
    adminOnly,
    logAction
};
