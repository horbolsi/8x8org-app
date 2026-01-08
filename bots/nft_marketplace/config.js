module.exports = {
    // Bot identity
    botName: 'NFT Bot',
    botUsername: '@nft_bot',
    description: 'NFT Marketplace Integration',
    
    // Marketplaces
    marketplaces: {
        opensea: {
            api_key: process.env.OPENSEA_API_KEY,
            api_url: 'https://api.opensea.io/api/v1'
        },
        rarible: {
            api_url: 'https://api.rarible.org/v0.1'
        }
    },
    
    // Features
    features: {
        browse_collections: true,
        view_nfts: true,
        buy_nfts: false,  // Set to true when ready
        sell_nfts: false, // Set to true when ready
        portfolio: true
    },
    
    // Supported chains
    chains: ['ethereum', 'polygon'],
    
    // Integration
    integration: {
        with_wallet_bot: true,
        with_main_bot: true
    },
    
    // Messages
    messages: {
        welcome: "🎨 *NFT Marketplace*\n\nBrowse and explore NFT collections.",
        collection_list: "📚 *Available Collections*"
    },
    
    // Signature
    signature: '8x8org by FlashTM8 ⚡️'
};
