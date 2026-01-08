const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class GitHubService {
    constructor() {
        this.git = simpleGit();
        this.repoUrl = process.env.GITHUB_REPO 
            ? `https://${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_REPO}.git`
            : null;
        this.initialized = false;
        this.initialize();
    }

    async initialize() {
        if (!process.env.ENABLE_GITHUB_BACKUP || process.env.ENABLE_GITHUB_BACKUP === 'false') {
            logger.warn('GitHub backup disabled by configuration');
            return;
        }

        if (!this.repoUrl) {
            logger.warn('GitHub repository URL not configured');
            return;
        }

        try {
            // Check if .git directory exists
            if (fs.existsSync('.git')) {
                // Already initialized
                this.initialized = true;
                logger.githubEvent('Repository already initialized');
                return true;
            }

            // Initialize git repo
            await this.git.init();
            
            // Check remotes
            const remotes = await this.git.getRemotes();
            if (!remotes.some(r => r.name === 'origin')) {
                await this.git.addRemote('origin', this.repoUrl);
                logger.githubEvent('Added remote origin');
            }
            
            // Set git config
            await this.git.addConfig('user.name', '8x8org Bot');
            await this.git.addConfig('user.email', 'bot@8x8org.io');
            
            this.initialized = true;
            logger.githubEvent('GitHub repository initialized successfully');
            return true;
        } catch (error) {
            logger.error('Failed to initialize GitHub:', error);
            this.initialized = false;
            return false;
        }
    }

    async commitAndPush(message = null) {
        if (!this.initialized) {
            await this.initialize();
            if (!this.initialized) {
                logger.error('GitHub not initialized');
                return { success: false, error: 'GitHub not initialized' };
            }
        }

        try {
            const commitMsg = message || `Auto-commit: ${new Date().toISOString()}`;
            
            // Add all files except those in .gitignore
            await this.git.add('./*');
            
            // Check if there are any changes
            const status = await this.git.status();
            if (status.files.length === 0) {
                logger.githubEvent('No changes to commit');
                return { success: true, message: 'No changes to commit' };
            }
            
            // Commit
            await this.git.commit(commitMsg);
            logger.githubEvent('Committed changes', { message: commitMsg, files: status.files.length });
            
            // Push to main branch
            await this.git.push('origin', 'main');
            logger.githubEvent('Pushed to GitHub');
            
            return { 
                success: true, 
                message: commitMsg,
                files: status.files.length 
            };
        } catch (error) {
            logger.error('GitHub push failed:', error);
            return { 
                success: false, 
                error: error.message,
                code: error.code 
            };
        }
    }

    async backupToGit(description = 'Database backup') {
        if (!this.initialized) {
            await this.initialize();
            if (!this.initialized) {
                return { success: false, error: 'GitHub not initialized' };
            }
        }

        try {
            // Create backup directory if it doesn't exist
            const backupDir = path.join(__dirname, '../database/backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            // Create backup file with metadata
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(backupDir, `backup_${timestamp}.json`);
            
            // Get system data to backup
            const { User, Task, UserTask } = require('../database/models');
            
            const backupData = {
                metadata: {
                    timestamp: new Date().toISOString(),
                    system: '8x8org Telegram Ecosystem',
                    version: '1.0.0',
                    description: description,
                    generated_by: 'scheduled_backup'
                },
                statistics: {
                    users: await User.count(),
                    tasks: await Task.count({ where: { is_active: true } }),
                    user_tasks: await UserTask.count(),
                    completed_tasks: await UserTask.count({ where: { status: 'completed' } })
                },
                // Don't backup actual user data for privacy
                // Only backup metadata and statistics
                summary: 'This backup contains system statistics only. User data is stored in the main database file.'
            };
            
            // Write backup file
            fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
            
            // Add and commit backup
            await this.git.add(backupFile);
            await this.git.commit(`Backup: ${description} - ${timestamp}`);
            await this.git.push('origin', 'main');
            
            logger.githubEvent('Backup saved and pushed', { file: backupFile });
            
            // Cleanup - keep only last 5 backup files
            const files = fs.readdirSync(backupDir)
                .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
                .sort()
                .reverse();
            
            if (files.length > 5) {
                files.slice(5).forEach(oldFile => {
                    fs.unlinkSync(path.join(backupDir, oldFile));
                    logger.debug(`Removed old backup file: ${oldFile}`);
                });
            }
            
            return { 
                success: true, 
                file: backupFile,
                statistics: backupData.statistics 
            };
        } catch (error) {
            logger.error('GitHub backup failed:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async getStatus() {
        try {
            const status = await this.git.status();
            return {
                initialized: this.initialized,
                currentBranch: status.current,
                hasChanges: !status.isClean(),
                filesChanged: status.files.length,
                files: status.files,
                ahead: status.ahead,
                behind: status.behind
            };
        } catch (error) {
            return {
                initialized: this.initialized,
                error: error.message
            };
        }
    }

    async pullUpdates() {
        if (!this.initialized) {
            await this.initialize();
            if (!this.initialized) {
                return { success: false, error: 'GitHub not initialized' };
            }
        }

        try {
            await this.git.pull('origin', 'main');
            logger.githubEvent('GitHub updates pulled successfully');
            return { success: true };
        } catch (error) {
            logger.error('GitHub pull failed:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async createTag(version, message = '') {
        if (!this.initialized) {
            return { success: false, error: 'GitHub not initialized' };
        }

        try {
            await this.git.addTag(version);
            if (message) {
                await this.git.tag(['-a', version, '-m', message]);
            }
            await this.git.pushTags('origin');
            
            logger.githubEvent('Tag created', { version: version, message: message });
            return { success: true, version: version };
        } catch (error) {
            logger.error('Tag creation failed:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async getCommitHistory(limit = 10) {
        try {
            const log = await this.git.log({ maxCount: limit });
            return {
                success: true,
                commits: log.all.map(commit => ({
                    hash: commit.hash,
                    date: commit.date,
                    message: commit.message,
                    author: commit.author_name,
                    email: commit.author_email
                }))
            };
        } catch (error) {
            logger.error('Failed to get commit history:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async syncFromCommand(command, adminId) {
        // This would be called from a bot command
        try {
            logger.githubEvent('Manual sync requested', { admin_id: adminId });
            
            const result = await this.commitAndPush(`Manual sync by admin ${adminId}`);
            
            if (result.success) {
                return {
                    success: true,
                    message: `✅ GitHub sync completed\nFiles: ${result.files || 0}\nMessage: ${result.message}`
                };
            } else {
                return {
                    success: false,
                    message: `❌ GitHub sync failed\nError: ${result.error}`
                };
            }
        } catch (error) {
            logger.error('Manual sync failed:', error);
            return {
                success: false,
                message: `❌ GitHub sync failed\nError: ${error.message}`
            };
        }
    }
}

// Create singleton instance
const githubService = new GitHubService();

// Export for use
module.exports = githubService;
