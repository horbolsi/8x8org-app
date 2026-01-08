module.exports = {
    // Bot identity
    botName: 'app8x8org_bot',
    botUsername: '@app8x8org_bot',
    description: 'Main User Interface & Account Management',
    
    // Token - using your specific token
    token: process.env.MAIN_BOT_TOKEN || process.env.APP_BOT_TOKEN || process.env.BOT_TOKEN,
    
    // Owner information
    owner: {
        telegram_id: 1950324763,
        username: 'FlashTM8',
        email: 'xorgbytm8@gmail.com'
    },
    
    // Features
    features: {
        user_dashboard: true,
        account_management: true,
        admin_panel: true,
        system_access: true,
        excel_reports: true,
        email_notifications: true
    },
    
    // Integration
    integration: {
        with_out_bot: true,
        with_in_bot: true,
        with_airdrop_bot: true,
        with_wallet_bot: true,
        with_nft_bot: true
    },
    
    // Messages
    messages: {
        welcome: "👋 *Welcome to 8x8org Ecosystem!*\n\nYour personal interface to all services.",
        admin_welcome: "👑 *Admin Panel*\n\nWelcome, FlashTM8!"
    },
    
    // Signature
    signature: '8x8org by FlashTM8 ⚡️'
};
