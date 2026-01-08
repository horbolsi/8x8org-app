// Admin Configuration - 8x8org Ecosystem
// Owner: FlashTM8 ⚡️

module.exports = {
    // System Owner
    owner: {
        telegram_id: process.env.ADMIN_TELEGRAM_ID || 'YOUR_TELEGRAM_ID_HERE',
        username: process.env.ADMIN_USERNAME || 'FlashTM8',
        signature: '8x8org by FlashTM8 ⚡️',
        email: process.env.OWNER_EMAIL || 'your-email@gmail.com'
    },

    // Admin permissions
    permissions: {
        // Only these Telegram IDs can use admin commands
        admin_ids: [process.env.ADMIN_TELEGRAM_ID || 'YOUR_TELEGRAM_ID_HERE'],
        
        // Bot access control
        bot_access: {
            main_bot: ['admin'],          // Only admin
            out_bot: ['users', 'admin'],   // Users + admin
            in_bot: ['users', 'admin'],    // Users + admin
            airdrop_bot: ['admin'],        // Only admin (distribution control)
            wallet_bot: ['users', 'admin'], // Users + admin
            nft_bot: ['users', 'admin'],   // Users + admin
            admin_bot: ['admin']           // Only admin
        },
        
        // Restricted commands (admin only)
        admin_only_commands: [
            '/admin', '/settings', '/config', '/restart',
            '/backup', '/export', '/users', '/stats',
            '/broadcast', '/addadmin', '/removeuser',
            '/shutdown', '/update', '/logs'
        ],
        
        // User commands (available to all users)
        user_commands: [
            '/start', '/help', '/status', '/balance',
            '/tasks', '/mytasks', '/submit', '/score',
            '/wallet', '/nft', '/profile'
        ]
    },

    // Security settings
    security: {
        require_admin_approval: true,
        log_all_actions: true,
        encrypt_sensitive_data: true,
        backup_on_changes: true,
        session_timeout: 3600, // 1 hour
        max_login_attempts: 3
    },

    // Reporting
    reporting: {
        email_reports: {
            enabled: true,
            to: process.env.REPORT_EMAIL || 'your-email@gmail.com',
            frequency: 'daily', // daily, weekly, monthly, or on-demand
            format: 'excel',    // excel, pdf, csv
            include: ['users', 'transactions', 'tasks', 'rewards', 'system']
        },
        telegram_reports: {
            enabled: true,
            chat_id: process.env.ADMIN_TELEGRAM_ID,
            frequency: 'realtime' // realtime, daily
        }
    },

    // System settings
    system: {
        name: '8x8org Bot Ecosystem',
        version: '1.0.0',
        maintenance_mode: false,
        auto_backup: true,
        backup_location: './backups/',
        log_location: './logs/'
    },

    // Bot specific configurations
    bots: {
        main_bot: {
            name: 'app8x8org_bot',
            description: 'Main Interface & User Account Management',
            admin_only: true,
            features: ['user_management', 'account_access', 'dashboard']
        },
        out_bot: {
            name: 'xorgbytm8_bot',
            description: 'OUT - Tasks for users outside their countries',
            admin_only: false,
            features: ['task_distribution', 'geo_tracking', 'external_tasks']
        },
        in_bot: {
            name: 'in_bot',
            description: 'IN - Tasks for users inside their countries',
            admin_only: false,
            features: ['local_tasks', 'geo_restricted', 'internal_tasks']
        },
        airdrop_bot: {
            name: 'airdrop_bot',
            description: 'Reward Distribution System',
            admin_only: true,
            features: ['token_distribution', 'reward_management', 'airdrop_campaigns']
        },
        wallet_bot: {
            name: 'wallet_bot',
            description: 'Crypto Wallet Management',
            admin_only: false,
            features: ['multi_chain', 'transactions', 'balance_tracking']
        },
        nft_bot: {
            name: 'nft_bot',
            description: 'NFT Marketplace Integration',
            admin_only: false,
            features: ['nft_trading', 'marketplace', 'collections']
        }
    },

    // Check if user is admin
    isAdmin: function(userId) {
        return this.permissions.admin_ids.includes(userId.toString());
    },

    // Check if user can access bot
    canAccessBot: function(userId, botName) {
        if (this.isAdmin(userId)) return true;
        
        const botConfig = this.bots[botName];
        if (!botConfig) return false;
        
        if (botConfig.admin_only) return false;
        
        return this.permissions.bot_access[botName]?.includes('users') || false;
    },

    // Get signature for messages
    getSignature: function() {
        return this.owner.signature;
    }
};
