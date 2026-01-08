module.exports = {
    // Bot identity
    botName: 'Wallet Bot',
    botUsername: '@wallet8x8org_bot',
    description: 'Universal Crypto Wallet Management - Multi-Chain Support',
    
    // Token - using your specific wallet bot token
    token: process.env.WALLET_BOT_TOKEN || '8226094267:AAFjuOpGePzOWu_26KPPp0ZYnpeYfWnVYBo',
    
    // Blockchain networks - FULL SUPPORT
    networks: {
        // EVM Networks
        ethereum: {
            chain_id: 1,
            rpc_url: process.env.ETH_RPC_URL || 'https://mainnet.infura.io/v3/your_key',
            explorer: 'https://etherscan.io',
            symbol: 'ETH',
            type: 'evm'
        },
        polygon: {
            chain_id: 137,
            rpc_url: process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.infura.io/v3/your_key',
            explorer: 'https://polygonscan.com',
            symbol: 'MATIC',
            type: 'evm'
        },
        bsc: {
            chain_id: 56,
            rpc_url: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
            explorer: 'https://bscscan.com',
            symbol: 'BNB',
            type: 'evm'
        },
        arbitrum: {
            chain_id: 42161,
            rpc_url: process.env.ARB_RPC_URL || 'https://arb1.arbitrum.io/rpc',
            explorer: 'https://arbiscan.io',
            symbol: 'ETH',
            type: 'evm'
        },
        optimism: {
            chain_id: 10,
            rpc_url: process.env.OPT_RPC_URL || 'https://mainnet.optimism.io',
            explorer: 'https://optimistic.etherscan.io',
            symbol: 'ETH',
            type: 'evm'
        },
        avalanche: {
            chain_id: 43114,
            rpc_url: process.env.AVAX_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
            explorer: 'https://snowtrace.io',
            symbol: 'AVAX',
            type: 'evm'
        },
        fantom: {
            chain_id: 250,
            rpc_url: process.env.FTM_RPC_URL || 'https://rpc.ftm.tools',
            explorer: 'https://ftmscan.com',
            symbol: 'FTM',
            type: 'evm'
        },
        
        // Layer 1 Networks
        bitcoin: {
            network: 'mainnet',
            explorer: 'https://blockstream.info',
            symbol: 'BTC',
            type: 'bitcoin',
            api_provider: 'blockchain.com' // or blockstream, mempool.space
        },
        solana: {
            rpc_url: process.env.SOL_RPC_URL || 'https://api.mainnet-beta.solana.com',
            explorer: 'https://explorer.solana.com',
            symbol: 'SOL',
            type: 'solana'
        },
        ton: {
            rpc_url: process.env.TON_RPC_URL || 'https://toncenter.com/api/v2/jsonRPC',
            explorer: 'https://tonscan.org',
            symbol: 'TON',
            type: 'ton'
        },
        cardano: {
            network: 'mainnet',
            explorer: 'https://cardanoscan.io',
            symbol: 'ADA',
            type: 'cardano'
        },
        tron: {
            network: 'mainnet',
            explorer: 'https://tronscan.org',
            symbol: 'TRX',
            type: 'tron'
        },
        cosmos: {
            rpc_url: process.env.COSMOS_RPC_URL || 'https://cosmos-rpc.polkachu.com',
            explorer: 'https://www.mintscan.io/cosmos',
            symbol: 'ATOM',
            type: 'cosmos'
        },
        
        // Testnets
        sepolia: {
            chain_id: 11155111,
            rpc_url: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/your_key',
            explorer: 'https://sepolia.etherscan.io',
            symbol: 'ETH',
            type: 'evm',
            testnet: true
        }
    },
    
    // Wallet features
    features: {
        create_wallet: true,
        import_wallet: true,
        check_balance: true,
        send_transactions: true,
        receive_transactions: true,
        transaction_history: true,
        multi_chain: true,
        token_support: true,
        nft_support: true,
        staking_support: true,
        swap_support: false, // Future enhancement
        cross_chain: false,  // Future enhancement
        hardware_wallet: false // Future enhancement
    },
    
    // Supported token standards
    token_standards: {
        evm: ['ERC-20', 'ERC-721', 'ERC-1155'],
        solana: ['SPL', 'Metaplex'],
        ton: ['Jettons', 'NFT'],
        bitcoin: ['Ordinals', 'BRC-20'],
        cardano: ['Native Tokens']
    },
    
    // Security
    security: {
        encrypt_private_keys: true,
        require_confirmation: true,
        transaction_limits: true,
        owner_id: 1950324763,
        backup_encryption: true,
        session_timeout: 3600
    },
    
    // Integration
    integration: {
        with_main_bot: true,
        with_airdrop_bot: true,
        with_nft_bot: true,
        with_tasks: true,
        with_exchanges: false, // Future
        with_defi: false       // Future
    },
    
    // Default settings
    defaults: {
        default_network: 'ethereum',
        currency: 'USD',
        auto_save: true,
        auto_backup: true,
        notification_level: 'important'
    },
    
    // RPC Providers (can be customized)
    rpc_providers: {
        infura: process.env.INFURA_API_KEY,
        alchemy: process.env.ALCHEMY_API_KEY,
        quicknode: process.env.QUICKNODE_API_KEY,
        moralis: process.env.MORALIS_API_KEY
    },
    
    // Signature
    signature: '8x8org by FlashTM8 ⚡️'
};
