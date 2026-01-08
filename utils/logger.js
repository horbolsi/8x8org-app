// Simple logger that works without winston if needed
const fs = require('fs');
const path = require('path');
const logDir = path.join(__dirname, '../logs');

// Create logs directory
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logToFile = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message} ${data ? JSON.stringify(data) : ''}\n`;
  
  // Console output
  console.log(logMessage.trim());
  
  // File output
  const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logMessage);
  
  // Also write to bot-specific log
  const botLogFile = path.join(logDir, `bot_activity.log`);
  fs.appendFileSync(botLogFile, logMessage);
};

const logger = {
  botEvent: (botName, message) => {
    logToFile('BOT', `[${botName}] ${message}`);
  },
  userAction: (userId, action) => {
    logToFile('USER', `User ${userId}: ${action}`);
  },
  error: (message, error = null) => {
    logToFile('ERROR', message, error ? { message: error.message, stack: error.stack } : null);
  },
  warn: (message) => {
    logToFile('WARN', message);
  },
  info: (message) => {
    logToFile('INFO', message);
  },
  taskEvent: (taskId, userId, action, data = null) => {
    logToFile('TASK', `Task ${taskId}, User ${userId}: ${action}`, data);
  }
};

module.exports = logger;
