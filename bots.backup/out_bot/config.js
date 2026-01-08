module.exports = {
    // Bot identity
    botName: 'xorgbytm8_bot',
    botUsername: '@xorgbytm8_bot',
    description: 'OUT - Tasks for users outside their countries',
    
    // Token - using your specific OUT bot token
    token: process.env.OUT_BOT_TOKEN || process.env.BOT_TOKEN,
    
    // Task settings for external/global tasks
    tasks: {
        type: 'external',
        scope: 'global',
        categories: [
            'social_media',
            'content_creation',
            'community_engagement',
            'market_research',
            'translation',
            'international_surveys'
        ],
        
        // Rewards
        rewards: {
            currency: 'USD',
            payment_methods: ['crypto', 'paypal', 'bank_transfer'],
            min_payout: 10,
            auto_approval: false
        }
    },
    
    // Integration with main ecosystem
    integration: {
        main_bot: '@app8x8org_bot',
        sync_user_data: true,
        share_progress: true,
        unified_wallet: true
    },
    
    // Admin settings
    admin: {
        owner_id: 1950324763,
        approval_required: true,
        auto_assign: false,
        quality_control: true
    },
    
    // Signature
    signature: '8x8org by FlashTM8 ⚡️'
};
