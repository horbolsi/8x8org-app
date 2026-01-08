require('dotenv').config();
const logger = require('./utils/logger');
const db = require('./database/db');

// Import bot starters
const startMainBot = require('./bots/main_bot');
// const startInBot = require('./bots/in_bot');
// const startOutBot = require('./bots/out_bot');
// const startAirdropBot = require('./bots/airdrop_bot');

class BotEcosystem {
    constructor() {
        this.bots = {};
        this.isRunning = false;
        this.startTime = null;
    }

    async initialize() {
        try {
            this.startTime = new Date();
            logger.startup('🚀 Initializing 8x8org Telegram Ecosystem');
            logger.info(`Start Time: ${this.startTime.toISOString()}`);
            logger.info(`Owner ID: ${process.env.OWNER_ID}`);
            logger.info(`Organization: ${process.env.ORGANIZATION_NAME}`);

            // Initialize database
            logger.info('Initializing database...');
            await db.initialize();
            logger.info('Database initialized successfully');

            // Start all bots with error handling
            logger.info('Starting Telegram bots...');

            try {
                this.bots.main = await startMainBot();
                logger.info('Main bot started');
            } catch (error) {
                logger.error('Failed to start Main bot:', error);
                // Continue with other bots even if one fails
            }

            // Start HTTP server for health checks
            await this.startHttpServer();

            this.isRunning = true;
            logger.startup('🎉 8x8org Ecosystem started successfully!');
            
            console.log('\n========================================');
            console.log('🚀 8x8org TELEGRAM ECOSYSTEM READY!');
            console.log('========================================');
            console.log('📱 Go to Telegram and message your bot!');
            console.log('🏥 Health: http://localhost:3006/health');
            console.log('========================================\n');

        } catch (error) {
            logger.error('Ecosystem initialization failed:', error);
            throw error;
        }
    }

    async startHttpServer() {
        const http = require('http');
        const server = http.createServer((req, res) => {
            if (req.url === '/health' && req.method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'healthy',
                    service: '8x8org-telegram-ecosystem',
                    version: '1.0.0',
                    timestamp: new Date().toISOString(),
                    bots: Object.keys(this.bots),
                    database: 'connected',
                    uptime: process.uptime()
                }));
                return;
            }
            
            if (req.url === '/' && req.method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>8x8org Telegram Ecosystem</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 40px; }
                            .container { max-width: 800px; margin: 0 auto; }
                            .status { padding: 20px; background: #f0f0f0; border-radius: 5px; }
                            .bot-status { margin: 10px 0; padding: 10px; background: white; border-radius: 3px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>8x8org Telegram Ecosystem</h1>
                            <div class="status">
                                <h2 style="color: green;">✅ System Running</h2>
                                <p><strong>Main Bot:</strong> ${this.bots.main ? '✅ Online' : '❌ Offline'}</p>
                                <p><strong>Database:</strong> ✅ Connected</p>
                                <p><a href="/health">Health Check</a></p>
                            </div>
                        </div>
                    </body>
                    </html>
                `);
                return;
            }
            
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not Found' }));
        });

        const PORT = process.env.PORT || 3006;
        server.listen(PORT, () => {
            logger.info(`HTTP server listening on port ${PORT}`);
        });
    }

    async shutdown() {
        logger.shutdown('Shutting down ecosystem...');
        
        // Stop all bots
        for (const [name, bot] of Object.entries(this.bots)) {
            try {
                if (bot && typeof bot.stop === 'function') {
                    await bot.stop();
                    logger.info(`Stopped ${name} bot`);
                }
            } catch (error) {
                logger.error(`Error stopping ${name} bot:`, error);
            }
        }
        
        this.isRunning = false;
        logger.shutdown('Ecosystem shutdown complete');
    }
}

// Create and start ecosystem
const ecosystem = new BotEcosystem();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM signal');
    await ecosystem.shutdown();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('Received SIGINT signal');
    await ecosystem.shutdown();
    process.exit(0);
});

// Start the ecosystem
ecosystem.initialize().catch((error) => {
    logger.error('Failed to start ecosystem:', error);
    process.exit(1);
});
