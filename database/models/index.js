const { Sequelize, DataTypes, Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database/8x8org.db'),
    logging: (msg) => logger.debug(msg),
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    retry: {
        max: 3,
        timeout: 10000
    }
});

// Define User model
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    telegram_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true,
        validate: {
            isNumeric: true,
            min: 1
        }
    },
    account_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
        }
    },
    username: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [0, 255]
        }
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 255]
        }
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    profile_data: {
        type: DataTypes.TEXT,
        defaultValue: '{}',
        get() {
            const rawValue = this.getDataValue('profile_data');
            try {
                return JSON.parse(rawValue);
            } catch (error) {
                return {};
            }
        },
        set(value) {
            this.setDataValue('profile_data', 
                typeof value === 'string' ? value : JSON.stringify(value || {})
            );
        }
    },
    digital_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
    },
    label: {
        type: DataTypes.STRING(20),
        defaultValue: '8x8org',
        validate: {
            len: [1, 20]
        }
    },
    score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    level: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
            min: 1
        }
    },
    reputation: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    tasks_completed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    wallet_address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_banned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    verification_code: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    referral_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true
    },
    referred_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    last_active: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: (user) => {
            if (!user.account_number) {
                user.account_number = `8x8org-${user.telegram_id}-${Date.now().toString().slice(-6)}`;
            }
            if (!user.referral_code) {
                user.referral_code = `REF${user.telegram_id.toString().slice(-6)}`;
            }
        },
        beforeUpdate: (user) => {
            user.updated_at = new Date();
        }
    },
    indexes: [
        { fields: ['telegram_id'], unique: true },
        { fields: ['account_number'], unique: true },
        { fields: ['digital_id'], unique: true },
        { fields: ['score'] },
        { fields: ['level'] },
        { fields: ['created_at'] },
        { fields: ['last_active'] },
        { fields: ['is_banned'] },
        { fields: ['referral_code'], unique: true }
    ]
});

// Define Task model
const Task = sequelize.define('Task', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    task_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    bot_type: {
        type: DataTypes.ENUM('IN', 'OUT', 'AIRDROP', 'MAIN'),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    command_number: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    points_reward: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        validate: {
            min: 0
        }
    },
    cooldown_seconds: {
        type: DataTypes.INTEGER,
        defaultValue: 3600,
        validate: {
            min: 0
        }
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    requirements: {
        type: DataTypes.TEXT,
        defaultValue: '{}',
        get() {
            const rawValue = this.getDataValue('requirements');
            try {
                return JSON.parse(rawValue);
            } catch (error) {
                return {};
            }
        },
        set(value) {
            this.setDataValue('requirements', 
                typeof value === 'string' ? value : JSON.stringify(value || {})
            );
        }
    },
    metadata: {
        type: DataTypes.TEXT,
        defaultValue: '{}',
        get() {
            const rawValue = this.getDataValue('metadata');
            try {
                return JSON.parse(rawValue);
            } catch (error) {
                return {};
            }
        },
        set(value) {
            this.setDataValue('metadata', 
                typeof value === 'string' ? value : JSON.stringify(value || {})
            );
        }
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
}, {
    tableName: 'tasks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['task_code'], unique: true },
        { fields: ['bot_type', 'is_active'] },
        { fields: ['points_reward'] },
        { fields: ['created_by'] }
    ]
});

// Define UserTask model
const UserTask = sequelize.define('UserTask', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed', 'expired'),
        defaultValue: 'pending'
    },
    submitted_data: {
        type: DataTypes.TEXT,
        defaultValue: '{}',
        get() {
            const rawValue = this.getDataValue('submitted_data');
            try {
                return JSON.parse(rawValue);
            } catch (error) {
                return {};
            }
        },
        set(value) {
            this.setDataValue('submitted_data', 
                typeof value === 'string' ? value : JSON.stringify(value || {})
            );
        }
    },
    score_earned: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    started_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    reviewed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    review_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    metadata: {
        type: DataTypes.TEXT,
        defaultValue: '{}',
        get() {
            const rawValue = this.getDataValue('metadata');
            try {
                return JSON.parse(rawValue);
            } catch (error) {
                return {};
            }
        },
        set(value) {
            this.setDataValue('metadata', 
                typeof value === 'string' ? value : JSON.stringify(value || {})
            );
        }
    }
}, {
    tableName: 'user_tasks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['user_id', 'status'] },
        { fields: ['task_id', 'status'] },
        { fields: ['completed_at'] },
        { fields: ['user_id', 'task_id'] }
    ]
});

// Define Command model
const Command = sequelize.define('Command', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    command_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        validate: {
            min: 1
        }
    },
    bot_name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    command_text: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    handler_function: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    required_role: {
        type: DataTypes.ENUM('user', 'mod', 'admin', 'owner'),
        defaultValue: 'user'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    cooldown_ms: {
        type: DataTypes.INTEGER,
        defaultValue: 1000,
        validate: {
            min: 0
        }
    },
    usage_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    last_used: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'commands',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['command_number'], unique: true },
        { fields: ['bot_name', 'is_active'] },
        { fields: ['required_role'] },
        { fields: ['last_used'] }
    ]
});

// Define Report model
const Report = sequelize.define('Report', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    report_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    report_type: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    period_start: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    period_end: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    generated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    file_path: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    email_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    sent_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    metadata: {
        type: DataTypes.TEXT,
        defaultValue: '{}',
        get() {
            const rawValue = this.getDataValue('metadata');
            try {
                return JSON.parse(rawValue);
            } catch (error) {
                return {};
            }
        },
        set(value) {
            this.setDataValue('metadata', 
                typeof value === 'string' ? value : JSON.stringify(value || {})
            );
        }
    }
}, {
    tableName: 'reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['report_code'], unique: true },
        { fields: ['report_type'] },
        { fields: ['period_start', 'period_end'] },
        { fields: ['created_at'] },
        { fields: ['email_sent'] }
    ]
});

// Define AuditLog model
const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    action: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    entity_type: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    old_values: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('old_values');
            try {
                return JSON.parse(rawValue);
            } catch (error) {
                return null;
            }
        },
        set(value) {
            this.setDataValue('old_values', 
                typeof value === 'string' ? value : JSON.stringify(value)
            );
        }
    },
    new_values: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('new_values');
            try {
                return JSON.parse(rawValue);
            } catch (error) {
                return null;
            }
        },
        set(value) {
            this.setDataValue('new_values', 
                typeof value === 'string' ? value : JSON.stringify(value)
            );
        }
    },
    ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    metadata: {
        type: DataTypes.TEXT,
        defaultValue: '{}',
        get() {
            const rawValue = this.getDataValue('metadata');
            try {
                return JSON.parse(rawValue);
            } catch (error) {
                return {};
            }
        },
        set(value) {
            this.setDataValue('metadata', 
                typeof value === 'string' ? value : JSON.stringify(value || {})
            );
        }
    }
}, {
    tableName: 'audit_log',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        { fields: ['user_id', 'action'] },
        { fields: ['entity_type', 'entity_id'] },
        { fields: ['created_at'] },
        { fields: ['action'] }
    ]
});

// Define relationships
User.hasMany(UserTask, { foreignKey: 'user_id', as: 'tasks' });
UserTask.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Task.hasMany(UserTask, { foreignKey: 'task_id', as: 'userTasks' });
UserTask.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });

User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Report, { foreignKey: 'generated_by', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'generated_by', as: 'generator' });

// Helper functions
async function initializeModels() {
    try {
        // Test connection
        await sequelize.authenticate();
        logger.info('✅ Database connection established');
        
        // Sync all models
        if (process.env.DB_SYNC === 'true') {
            await sequelize.sync({ alter: true });
            logger.info('✅ Database models synchronized');
        }
        
        // Create default commands if they don't exist
        await createDefaultCommands();
        
        return true;
    } catch (error) {
        logger.error('❌ Database initialization failed:', error);
        throw error;
    }
}

async function createDefaultCommands() {
    try {
        const defaultCommands = [
            {
                command_number: 1,
                bot_name: 'main',
                command_text: '/start',
                description: 'Start the bot and create account',
                handler_function: 'handleStart',
                required_role: 'user'
            },
            {
                command_number: 2,
                bot_name: 'main',
                command_text: '/profile',
                description: 'View and manage profile',
                handler_function: 'handleProfile',
                required_role: 'user'
            },
            {
                command_number: 3,
                bot_name: 'main',
                command_text: '/admin',
                description: 'Access admin panel',
                handler_function: 'handleAdmin',
                required_role: 'owner'
            },
            {
                command_number: 4,
                bot_name: 'main',
                command_text: '/features',
                description: 'Manage user features',
                handler_function: 'handleFeatures',
                required_role: 'user'
            },
            {
                command_number: 5,
                bot_name: 'main',
                command_text: '/report',
                description: 'Generate reports',
                handler_function: 'handleReport',
                required_role: 'admin'
            },
            {
                command_number: 100,
                bot_name: 'in',
                command_text: '/task',
                description: 'View available tasks',
                handler_function: 'handleTaskList',
                required_role: 'user'
            },
            {
                command_number: 101,
                bot_name: 'in',
                command_text: '/submit',
                description: 'Submit task response',
                handler_function: 'handleTaskSubmit',
                required_role: 'user'
            },
            {
                command_number: 200,
                bot_name: 'airdrop',
                command_text: '/leaderboard',
                description: 'View leaderboard',
                handler_function: 'handleLeaderboard',
                required_role: 'user'
            },
            {
                command_number: 201,
                bot_name: 'airdrop',
                command_text: '/rank',
                description: 'Check your rank',
                handler_function: 'handleRank',
                required_role: 'user'
            }
        ];

        for (const cmd of defaultCommands) {
            const [command, created] = await Command.findOrCreate({
                where: { command_number: cmd.command_number },
                defaults: cmd
            });
            
            if (created) {
                logger.debug(`Created default command: ${cmd.command_text}`);
            }
        }
        
        logger.info('✅ Default commands initialized');
    } catch (error) {
        logger.error('Failed to create default commands:', error);
    }
}

module.exports = {
    sequelize,
    User,
    Task,
    UserTask,
    Command,
    Report,
    AuditLog,
    initializeModels,
    Op
};
