module.exports = {
    // Bot identity
    botName: 'Airdrop Bot',
    botUsername: '@airdrop8x8org_bot',
    description: 'Reward Distribution System',
    
    // Token - using your specific Airdrop bot token
    token: process.env.AIRDROP_BOT_TOKEN || process.env.BOT_TOKEN,
    
    // Airdrop settings
    airdrops: {
        types: [
            'task_rewards',
            'referral_bonuses',
            'loyalty_rewards',
            'special_campaigns',
            'community_rewards'
        ],
        
        // Tokens supported
        tokens: [
            { symbol: 'USDT', network: ['ERC20', 'TRC20', 'BEP20'] },
            { symbol: 'ETH', network: ['Ethereum'] },
            { symbol: 'BNB', network: ['BSC'] },
            { symbol: 'MATIC', network: 'Polygon' }
        ]
    },
    
    // Integration
    integration: {
        with_tasks: true,
        with_wallet: true,
        with_main_bot: true,
        cross_bot_rewards: true
    },
    
    // Admin controls
    admin: {
        owner_id: 1950324763,
        create_campaigns: true,
        modify_rewards: true,
        pause_distributions: true,
        view_statistics: true,
        export_reports: true
    },
    
    // Signature
    signature: '8x8org by FlashTM8 ⚡️'
};
