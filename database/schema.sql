-- ============================================
-- 8x8org Telegram Ecosystem Database Schema
-- ============================================

-- Users table with 8x8org account numbers
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id BIGINT UNIQUE NOT NULL,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    profile_data TEXT DEFAULT '{}',
    digital_id VARCHAR(100) UNIQUE,
    label VARCHAR(20) DEFAULT '8x8org',
    score INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    reputation INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    email VARCHAR(255),
    phone VARCHAR(50),
    wallet_address VARCHAR(255),
    is_verified BOOLEAN DEFAULT 0,
    is_banned BOOLEAN DEFAULT 0,
    verification_code VARCHAR(10),
    referral_code VARCHAR(20),
    referred_by INTEGER,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_telegram_id (telegram_id),
    INDEX idx_account_number (account_number),
    INDEX idx_digital_id (digital_id),
    INDEX idx_score (score DESC),
    INDEX idx_level (level DESC),
    INDEX idx_created_at (created_at DESC)
);

-- User features table (adjustable features)
CREATE TABLE IF NOT EXISTS user_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    feature_key VARCHAR(100) NOT NULL,
    feature_value TEXT,
    is_active BOOLEAN DEFAULT 1,
    metadata TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, feature_key),
    
    INDEX idx_user_features (user_id, feature_key),
    INDEX idx_feature_active (feature_key, is_active)
);

-- Tasks table for all bots
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_code VARCHAR(50) UNIQUE NOT NULL,
    bot_type VARCHAR(20) NOT NULL CHECK(bot_type IN ('IN', 'OUT', 'AIRDROP', 'MAIN')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    command_number INTEGER,
    points_reward INTEGER DEFAULT 10,
    cooldown_seconds INTEGER DEFAULT 3600,
    is_active BOOLEAN DEFAULT 1,
    requirements TEXT DEFAULT '{}',
    metadata TEXT DEFAULT '{}',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_bot_type (bot_type, is_active),
    INDEX idx_task_code (task_code),
    INDEX idx_points (points_reward DESC),
    INDEX idx_created_by (created_by)
);

-- User tasks progress
CREATE TABLE IF NOT EXISTS user_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'failed', 'expired')),
    submitted_data TEXT DEFAULT '{}',
    score_earned INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    reviewed_by INTEGER,
    review_notes TEXT,
    metadata TEXT DEFAULT '{}',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    
    INDEX idx_user_status (user_id, status),
    INDEX idx_task_status (task_id, status),
    INDEX idx_completed_at (completed_at DESC),
    INDEX idx_user_task (user_id, task_id)
);

-- Scores & leaderboard
CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    total_score INTEGER DEFAULT 0,
    weekly_score INTEGER DEFAULT 0,
    monthly_score INTEGER DEFAULT 0,
    yearly_score INTEGER DEFAULT 0,
    rank INTEGER DEFAULT 999999,
    badges TEXT DEFAULT '[]',
    achievements TEXT DEFAULT '[]',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_total_score (total_score DESC),
    INDEX idx_weekly_score (weekly_score DESC),
    INDEX idx_rank (rank),
    INDEX idx_last_updated (last_updated DESC)
);

-- Commands registry for all bots
CREATE TABLE IF NOT EXISTS commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    command_number INTEGER UNIQUE NOT NULL,
    bot_name VARCHAR(50) NOT NULL,
    command_text VARCHAR(100) NOT NULL,
    description TEXT,
    handler_function VARCHAR(100),
    required_role VARCHAR(20) DEFAULT 'user' CHECK(required_role IN ('user', 'mod', 'admin', 'owner')),
    is_active BOOLEAN DEFAULT 1,
    cooldown_ms INTEGER DEFAULT 1000,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_command_number (command_number),
    INDEX idx_bot_name (bot_name, is_active),
    INDEX idx_role (required_role),
    INDEX idx_last_used (last_used DESC)
);

-- Reports & exports
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_code VARCHAR(50) UNIQUE NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    period_start DATE,
    period_end DATE,
    generated_by INTEGER,
    file_path VARCHAR(500),
    email_sent BOOLEAN DEFAULT 0,
    sent_at TIMESTAMP,
    metadata TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (generated_by) REFERENCES users(id),
    
    INDEX idx_report_type (report_type),
    INDEX idx_period (period_start, period_end),
    INDEX idx_created_at (created_at DESC),
    INDEX idx_email_sent (email_sent)
);

-- Blockchain records (future integration)
CREATE TABLE IF NOT EXISTS blockchain_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tx_hash VARCHAR(255) UNIQUE NOT NULL,
    network VARCHAR(50) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    data_hash VARCHAR(255) NOT NULL,
    block_number INTEGER,
    confirmed BOOLEAN DEFAULT 0,
    metadata TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    
    INDEX idx_user_id (user_id),
    INDEX idx_tx_hash (tx_hash),
    INDEX idx_network (network),
    INDEX idx_confirmed (confirmed),
    INDEX idx_created_at (created_at DESC)
);

-- Audit log for all actions
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_action (user_id, action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at DESC),
    INDEX idx_action (action)
);

-- Mod permissions
CREATE TABLE IF NOT EXISTS mod_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mod_id INTEGER NOT NULL,
    bot_name VARCHAR(50) NOT NULL,
    allowed_commands TEXT DEFAULT '[]',
    restrictions TEXT DEFAULT '{}',
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (mod_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(mod_id, bot_name),
    
    INDEX idx_mod_bot (mod_id, bot_name),
    INDEX idx_is_active (is_active)
);

-- Email queue for async processing
CREATE TABLE IF NOT EXISTS email_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    attachments TEXT DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'sent', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_recipient (recipient),
    INDEX idx_scheduled_for (scheduled_for),
    INDEX idx_created_at (created_at DESC)
);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_setting_key (setting_key),
    INDEX idx_is_public (is_public)
);

-- Insert default system settings
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('system_name', '8x8org Telegram Ecosystem', 'string', 'Name of the system', 1),
('system_version', '1.0.0', 'string', 'System version', 1),
('maintenance_mode', '0', 'boolean', 'Maintenance mode flag', 1),
('registration_open', '1', 'boolean', 'User registration status', 1),
('max_users_per_day', '1000', 'number', 'Maximum new users per day', 0),
('score_multiplier', '1.0', 'number', 'Global score multiplier', 0),
('leaderboard_update_frequency', '3600', 'number', 'How often to update leaderboard (seconds)', 0),
('report_retention_days', '90', 'number', 'How long to keep reports', 0),
('backup_retention_days', '30', 'number', 'How long to keep backups', 0),
('email_daily_limit', '1000', 'number', 'Daily email sending limit', 0),
('telegram_api_timeout', '30', 'number', 'Telegram API timeout in seconds', 0);
