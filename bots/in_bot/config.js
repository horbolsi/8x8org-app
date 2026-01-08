module.exports = {
    // Bot identity
    botName: 'IN Bot',
    botUsername: '@in8x8org_bot',
    description: 'IN - Tasks for users inside their countries',
    
    // Token - using your specific IN bot token
    token: process.env.IN_BOT_TOKEN || process.env.BOT_TOKEN,
    
    // Task settings for internal/local tasks
    tasks: {
        type: 'internal',
        scope: 'local',
        categories: [
            'local_surveys',
            'store_visits',
            'product_reviews',
            'local_promotions',
            'neighborhood_research',
            'community_events'
        ],
        
        // Rewards
        rewards: {
            currency: 'LOCAL',
            payment_methods: ['local_bank', 'mobile_money', 'cash'],
            min_payout: 5,
            fast_payout: true
        }
    },
    
    // Integration with main ecosystem
    integration: {
        main_bot: '@app8x8org_bot',
        sync_with_out_bot: true,
        combined_stats: true,
        shared_wallet: true
    },
    
    // Admin settings
    admin: {
        owner_id: 1950324763,
        local_moderators: true,
        auto_verification: true,
        local_reporting: true
    },
    
    // Signature
    signature: '8x8org by FlashTM8 ⚡️'
};
