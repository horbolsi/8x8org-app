const axios = require('axios');
require('dotenv').config();

class NFTMarketplaceBot {
    constructor() {
        console.log('🖼️ NFT Marketplace Bot Initializing...');
        this.apiKey = process.env.OPENSEA_API_KEY || '';
    }

    async getCollectionStats(collectionSlug) {
        try {
            const url = `https://api.opensea.io/api/v1/collection/${collectionSlug}`;
            const headers = this.apiKey ? {'X-API-KEY': this.apiKey} : {};
            
            const response = await axios.get(url, { headers });
            return {
                name: response.data.collection?.name || collectionSlug,
                floor_price: response.data.collection?.stats?.floor_price || 0,
                total_volume: response.data.collection?.stats?.total_volume || 0,
                total_supply: response.data.collection?.stats?.total_supply || 0
            };
        } catch (error) {
            console.log('⚠️ NFT API error - try with API key for full access');
            return {
                name: collectionSlug,
                floor_price: 0,
                total_volume: 0,
                error: 'Add OPENSEA_API_KEY to .env'
            };
        }
    }

    async getWalletNFTs(walletAddress) {
        try {
            const url = `https://api.opensea.io/api/v1/assets?owner=${walletAddress}&limit=5`;
            const headers = this.apiKey ? {'X-API-KEY': this.apiKey} : {};
            
            const response = await axios.get(url, { headers });
            return response.data.assets || [];
        } catch (error) {
            console.log('⚠️ Could not fetch NFTs');
            return [];
        }
    }

    start() {
        console.log('🚀 NFT Marketplace Bot Started');
        console.log('💡 Add OPENSEA_API_KEY to .env for full access');
        return this;
    }
}

module.exports = NFTMarketplaceBot;

if (require.main === module) {
    const bot = new NFTMarketplaceBot();
    bot.start();
}
