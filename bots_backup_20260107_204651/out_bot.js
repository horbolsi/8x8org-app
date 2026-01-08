// out_bot placeholder
const logger = require('../utils/logger');

async function startOut_bot() {
    logger.info('Starting out_bot (placeholder)');
    
    // Return a mock bot object
    return {
        name: 'out_bot',
        startTime: new Date(),
        stop: async () => {
            logger.info('Stopping out_bot (placeholder)');
        },
        getStatus: () => ({
            name: 'out_bot',
            status: 'running',
            uptime: Date.now() - this.startTime
        })
    };
}

module.exports = startOut_bot;
