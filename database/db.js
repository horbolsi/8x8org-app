const { sequelize, initializeModels } = require('./models');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class DatabaseManager {
    constructor() {
        this.initialized = false;
        this.dbPath = path.join(__dirname, '../database/8x8org.db');
    }

    async initialize() {
        try {
            logger.info('🗄️ Initializing database...');
            
            // Create database directory if it doesn't exist
            const dbDir = path.join(__dirname, '../database');
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
                logger.info('Created database directory');
            }
            
            // Check if database file exists
            const dbExists = fs.existsSync(this.dbPath);
            
            // Initialize models and sync database
            await initializeModels();
            
            if (!dbExists) {
                logger.info('🆕 New database created');
                await this.createDefaultData();
            } else {
                logger.info('✅ Existing database loaded');
            }
            
            // Create backup directory
            const backupDir = path.join(__dirname, '../database/backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
                logger.info('Created backups directory');
            }
            
            this.initialized = true;
            logger.info('🎉 Database initialization complete');
            
            return true;
        } catch (error) {
            logger.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    async createDefaultData() {
        try {
            const { User, Task, Command } = require('./models');
            
            // Create default admin user (owner)
            const [adminUser, adminCreated] = await User.findOrCreate({
                where: { telegram_id: process.env.OWNER_ID },
                defaults: {
                    telegram_id: process.env.OWNER_ID,
                    account_number: `8x8org-${process.env.OWNER_ID}-000000`,
                    username: 'owner',
                    first_name: 'System',
                    last_name: 'Owner',
                    digital_id: `8x8-OWNER-${Date.now()}`,
                    is_verified: true,
                    profile_data: JSON.stringify({
                        role: 'owner',
                        permissions: ['all'],
                        join_date: new Date().toISOString()
                    })
                }
            });
            
            if (adminCreated) {
                logger.info(`👑 Created default admin user: ${adminUser.account_number}`);
            }
            
            // Create default tasks
            const defaultTasks = [
                {
                    task_code: 'IN-001',
                    bot_type: 'IN',
                    title: 'Introduction Task',
                    description: 'Complete your profile introduction',
                    command_number: 1001,
                    points_reward: 50,
                    cooldown_seconds: 0,
                    is_active: true,
                    created_by: adminUser.id
                },
                {
                    task_code: 'OUT-001',
                    bot_type: 'OUT',
                    title: 'Feedback Submission',
                    description: 'Submit feedback about the system',
                    command_number: 2001,
                    points_reward: 30,
                    cooldown_seconds: 86400,
                    is_active: true,
                    created_by: adminUser.id
                },
                {
                    task_code: 'AIRDROP-001',
                    bot_type: 'AIRDROP',
                    title: 'Leaderboard Participation',
                    description: 'Appear on the leaderboard for the first time',
                    command_number: 3001,
                    points_reward: 100,
                    cooldown_seconds: 0,
                    is_active: true,
                    created_by: adminUser.id
                }
            ];
            
            for (const taskData of defaultTasks) {
                const [task, created] = await Task.findOrCreate({
                    where: { task_code: taskData.task_code },
                    defaults: taskData
                });
                
                if (created) {
                    logger.info(`✅ Created default task: ${task.title}`);
                }
            }
            
            logger.info('✅ Default data created successfully');
            
        } catch (error) {
            logger.error('Failed to create default data:', error);
        }
    }

    async backup() {
        try {
            const backupDir = path.join(__dirname, '../database/backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const timestamp = new Date().toISOString()
                .replace(/[:.]/g, '-')
                .replace('T', '_')
                .slice(0, 19);
            
            const backupFile = path.join(backupDir, `backup_${timestamp}.db`);
            
            // Simple file copy for SQLite
            if (fs.existsSync(this.dbPath)) {
                fs.copyFileSync(this.dbPath, backupFile);
                
                // Keep only last 7 backups
                const backups = fs.readdirSync(backupDir)
                    .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
                    .sort()
                    .reverse();
                
                if (backups.length > 7) {
                    backups.slice(7).forEach(oldBackup => {
                        fs.unlinkSync(path.join(backupDir, oldBackup));
                        logger.debug(`Removed old backup: ${oldBackup}`);
                    });
                }
                
                logger.info(`✅ Database backed up to: ${backupFile}`);
                return backupFile;
            }
            
            return null;
        } catch (error) {
            logger.error('Backup failed:', error);
            throw error;
        }
    }

    async query(sql, params = []) {
        try {
            const [results] = await sequelize.query(sql, { replacements: params });
            return results;
        } catch (error) {
            logger.error('Database query failed:', error);
            throw error;
        }
    }

    async getStats() {
        try {
            const { User, Task, UserTask, Command } = require('./models');
            
            const [
                userCount,
                taskCount,
                completedTaskCount,
                commandCount
            ] = await Promise.all([
                User.count(),
                Task.count({ where: { is_active: true } }),
                UserTask.count({ where: { status: 'completed' } }),
                Command.count({ where: { is_active: true } })
            ]);
            
            // Get database file size
            let dbSize = 'N/A';
            if (fs.existsSync(this.dbPath)) {
                const stats = fs.statSync(this.dbPath);
                dbSize = `${(stats.size / 1024 / 1024).toFixed(2)} MB`;
            }
            
            return {
                users: userCount,
                active_tasks: taskCount,
                completed_tasks: completedTaskCount,
                commands: commandCount,
                database_size: dbSize,
                initialized: this.initialized,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Failed to get database stats:', error);
            return {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async close() {
        try {
            await sequelize.close();
            logger.info('✅ Database connection closed');
            this.initialized = false;
        } catch (error) {
            logger.error('Error closing database:', error);
        }
    }
}

module.exports = new DatabaseManager();
module.exports.initializeDatabase = () => new DatabaseManager().initialize();
