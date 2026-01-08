// In Bot - Fixed Version
console.log('📥 In Bot Starting...');

class InBot {
    constructor() {
        console.log('In Bot initialized');
    }
    
    start() {
        console.log('✅ In Bot Started');
        
        // Simple interval
        setInterval(() => {
            console.log('📥 In Bot: Checking for incoming...');
        }, 30000);
        
        return this;
    }
    
    async processIncoming(data) {
        console.log('Processing incoming data:', data);
        return { processed: true, data };
    }
}

module.exports = InBot;

if (require.main === module) {
    const bot = new InBot();
    bot.start();
}
