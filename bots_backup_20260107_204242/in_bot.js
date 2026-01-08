// in_bot placeholder
const logger = require('../utils/logger');

async function startIn_bot() {
    logger.info('Starting in_bot (placeholder)');
    
    // Return a mock bot object
    return {
        name: 'in_bot',
        startTime: new Date(),
        stop: async () => {
            logger.info('Stopping in_bot (placeholder)');
        },
        getStatus: () => ({
            name: 'in_bot',
            status: 'running',
            uptime: Date.now() - this.startTime
        })
    };
}

module.exports = startIn_bot;
