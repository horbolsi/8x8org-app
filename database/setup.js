const { Sequelize } = require('sequelize');
const path = require('path');

// Create SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'bot_database.sqlite'),
  logging: false
});

async function setupDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Create simple models
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT UNIQUE,
        username TEXT,
        score INTEGER DEFAULT 0,
        tasks_completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        bot_type TEXT,
        points_reward INTEGER DEFAULT 10,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS user_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        task_id INTEGER,
        status TEXT DEFAULT 'in_progress',
        score_earned INTEGER DEFAULT 0,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (task_id) REFERENCES tasks(id)
      );
    `);
    
    console.log('✅ Database tables created.');
    
    // Add some test data
    await sequelize.query(`
      INSERT OR IGNORE INTO tasks (title, description, bot_type, points_reward) VALUES
      ('Join Telegram Group', 'Join our official Telegram group', 'OUT', 50),
      ('Follow on Twitter', 'Follow our Twitter account', 'OUT', 30),
      ('Retweet Announcement', 'Retweet our latest announcement', 'OUT', 25);
    `);
    
    console.log('✅ Added sample tasks.');
  } catch (error) {
    console.error('Database setup error:', error);
  } finally {
    await sequelize.close();
  }
}

setupDatabase();
