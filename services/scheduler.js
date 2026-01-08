const cron = require('cron');
const emailService = require('../utils/email');
const databaseManager = require('../database/db');
const githubService = require('./github');
const logger = require('../utils/logger');

class SchedulerService {
    constructor() {
        this.jobs = [];
        this.isRunning = false;
        this.initialize();
    }

    initialize() {
        logger.startup('Initializing scheduler service...');
        
        // Don't start scheduler in development mode if disabled
        if (process.env.NODE_ENV === 'development' && process.env.ENABLE_SCHEDULER === 'false') {
            logger.info('Scheduler disabled in development mode');
            return;
        }
        
        try {
            this.setupDailyJobs();
            this.setupHourlyJobs();
            this.setupWeeklyJobs();
            this.setupMonthlyJobs();
            
            this.isRunning = true;
            logger.startup('Scheduler service initialized successfully');
            
            // Log all scheduled jobs
            this.logScheduledJobs();
            
        } catch (error) {
            logger.error('Failed to initialize scheduler:', error);
        }
    }

    setupDailyJobs() {
        logger.debug('Setting up daily jobs...');
        
        // Daily report at 8:00 AM UTC
        const dailyReportJob = new cron.CronJob('0 8 * * *', async () => {
            logger.info('Running daily report job...');
            try {
                const result = await emailService.sendDailyReport();
                if (result.success) {
                    logger.info('✅ Daily report sent successfully');
                } else {
                    logger.error('Failed to send daily report:', result.error);
                }
            } catch (error) {
                logger.error('Daily report job failed:', error);
            }
        });

        // Database backup at 2:00 AM UTC
        const backupJob = new cron.CronJob('0 2 * * *', async () => {
            logger.info('Running daily backup job...');
            try {
                const backupFile = await databaseManager.backup();
                if (backupFile) {
                    logger.info(`✅ Daily backup completed: ${backupFile}`);
                    
                    // Send backup notification
                    await emailService.sendSystemAlert(
                        'Daily Backup Completed',
                        `Database backup completed successfully.\nFile: ${backupFile}\nTime: ${new Date().toISOString()}`,
                        'info'
                    );
                }
            } catch (error) {
                logger.error('Backup job failed:', error);
                await emailService.sendSystemAlert(
                    'Backup Failed',
                    `Database backup failed:\n${error.message}\nTime: ${new Date().toISOString()}`,
                    'error'
                );
            }
        });

        // User cleanup at 4:00 AM UTC (mark inactive users)
        const cleanupJob = new cron.CronJob('0 4 * * *', async () => {
            logger.info('Running user cleanup job...');
            try {
                const { User } = require('../database/models');
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                
                const inactiveUsers = await User.findAll({
                    where: {
                        last_active: { $lt: thirtyDaysAgo },
                        is_banned: false
                    },
                    limit: 100
                });
                
                let markedInactive = 0;
                for (const user of inactiveUsers) {
                    const profileData = user.profile_data || {};
                    profileData.last_activity_check = new Date().toISOString();
                    profileData.inactive_notice_sent = true;
                    
                    user.profile_data = JSON.stringify(profileData);
                    await user.save();
                    markedInactive++;
                }
                
                if (markedInactive > 0) {
                    logger.info(`Marked ${markedInactive} users as inactive`);
                }
                
                logger.info(`Cleanup completed: ${inactiveUsers.length} inactive users found`);
            } catch (error) {
                logger.error('Cleanup job failed:', error);
            }
        });

        // GitHub backup at 3:00 AM UTC (if enabled)
        if (process.env.ENABLE_GITHUB_BACKUP === 'true') {
            const githubBackupJob = new cron.CronJob('0 3 * * *', async () => {
                logger.info('Running GitHub backup job...');
                try {
                    const result = await githubService.backupToGit('Daily automatic backup');
                    if (result.success) {
                        logger.info('✅ GitHub backup completed');
                    } else {
                        logger.error('GitHub backup failed:', result.error);
                    }
                } catch (error) {
                    logger.error('GitHub backup job failed:', error);
                }
            });
            this.jobs.push(githubBackupJob);
            githubBackupJob.start();
        }

        this.jobs.push(dailyReportJob, backupJob, cleanupJob);
        dailyReportJob.start();
        backupJob.start();
        cleanupJob.start();
        
        logger.debug('Daily jobs scheduled');
    }

    setupHourlyJobs() {
        logger.debug('Setting up hourly jobs...');
        
        // Hourly stats update and health check
        const hourlyJob = new cron.CronJob('0 * * * *', async () => {
            logger.debug('Running hourly stats update...');
            try {
                const { User, UserTask } = require('../database/models');
                
                const userCount = await User.count();
                const activeTasks = await UserTask.count({
                    where: { status: 'in_progress' }
                });
                
                // Log system health
                const healthCheck = {
                    timestamp: new Date().toISOString(),
                    users: userCount,
                    active_tasks: activeTasks,
                    memory_usage: process.memoryUsage(),
                    uptime: process.uptime()
                };
                
                logger.debug('Hourly health check:', healthCheck);
                
                // Send alert if system load is high
                const memUsage = process.memoryUsage();
                const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
                const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
                const memoryPercentage = (heapUsedMB / heapTotalMB) * 100;
                
                if (memoryPercentage > 80) {
                    logger.warn(`High memory usage: ${memoryPercentage.toFixed(1)}%`);
                    await emailService.sendSystemAlert(
                        'High Memory Usage',
                        `Memory usage is at ${memoryPercentage.toFixed(1)}%\n` +
                        `Used: ${heapUsedMB.toFixed(1)}MB / ${heapTotalMB.toFixed(1)}MB\n` +
                        `Time: ${new Date().toISOString()}`,
                        'warning'
                    );
                }
                
            } catch (error) {
                logger.error('Hourly job failed:', error);
            }
        });

        this.jobs.push(hourlyJob);
        hourlyJob.start();
        
        logger.debug('Hourly jobs scheduled');
    }

    setupWeeklyJobs() {
        logger.debug('Setting up weekly jobs...');
        
        // Weekly summary every Monday at 9:00 AM UTC
        const weeklyJob = new cron.CronJob('0 9 * * 1', async () => {
            logger.info('Running weekly summary job...');
            try {
                const { User } = require('../database/models');
                
                const topUsers = await User.findAll({
                    where: { is_banned: false },
                    order: [['score', 'DESC']],
                    limit: 10
                });
                
                // Create weekly report
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - 7);
                
                const html = `
                    <div style="text-align: center;">
                        <h1 style="color: #4CAF50;">8x8org</h1>
                        <h2>Weekly Summary Report</h2>
                        <p><strong>Week of:</strong> ${weekStart.toLocaleDateString()} to ${new Date().toLocaleDateString()}</p>
                    </div>
                    <div style="margin: 30px 0;">
                        <h3>🏆 Top 10 Users This Week</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                            <thead>
                                <tr style="background-color: #4CAF50; color: white;">
                                    <th style="padding: 12px; text-align: left;">Rank</th>
                                    <th style="padding: 12px; text-align: left;">User</th>
                                    <th style="padding: 12px; text-align: left;">Score</th>
                                    <th style="padding: 12px; text-align: left;">Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${topUsers.map((user, index) => `
                                    <tr style="${index % 2 === 0 ? 'background-color: #f9f9f9;' : ''}">
                                        <td style="padding: 10px; border: 1px solid #ddd;">${index + 1}</td>
                                        <td style="padding: 10px; border: 1px solid #ddd;">
                                            ${user.first_name} ${user.last_name || ''}<br>
                                            <small style="color: #666;">${user.account_number}</small>
                                        </td>
                                        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${user.score}</td>
                                        <td style="padding: 10px; border: 1px solid #ddd;">${user.level}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div style="margin-top: 30px; padding: 20px; background-color: #f0f9ff; border-radius: 5px;">
                        <h4>📊 Weekly Insights</h4>
                        <p>Total active users: ${topUsers.length}</p>
                        <p>Average score: ${topUsers.length > 0 ? Math.round(topUsers.reduce((sum, u) => sum + u.score, 0) / topUsers.length) : 0}</p>
                        <p>Highest score: ${topUsers.length > 0 ? topUsers[0].score : 0}</p>
                    </div>
                `;
                
                await emailService.sendEmail({
                    to: process.env.ADMIN_EMAIL,
                    subject: `8x8org Weekly Summary - ${new Date().toLocaleDateString()}`,
                    html: html
                });
                
                logger.info('✅ Weekly summary sent');
                
            } catch (error) {
                logger.error('Weekly job failed:', error);
                await emailService.sendSystemAlert(
                    'Weekly Summary Failed',
                    `Weekly summary job failed:\n${error.message}\nTime: ${new Date().toISOString()}`,
                    'error'
                );
            }
        });

        // Weekly user reports (send to users who opted in)
        const userReportsJob = new cron.CronJob('0 10 * * 1', async () => {
            logger.info('Running weekly user reports job...');
            try {
                const { User } = require('../database/models');
                
                // Get users who opted in for weekly reports
                const users = await User.findAll({
                    where: {
                        email: { $not: null },
                        is_banned: false
                    },
                    limit: 100 // Limit to prevent email flooding
                });
                
                let sentCount = 0;
                let failedCount = 0;
                
                for (const user of users) {
                    try {
                        const profileData = user.profile_data || {};
                        const settings = profileData.settings || {};
                        
                        // Check if user wants weekly reports
                        if (settings.weekly_reports !== false) {
                            const result = await emailService.sendUserReport(user.telegram_id, 'weekly');
                            if (result.success) {
                                sentCount++;
                            } else {
                                failedCount++;
                                logger.warn(`Failed to send weekly report to ${user.email}:`, result.error);
                            }
                            
                            // Delay to prevent rate limiting
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    } catch (error) {
                        failedCount++;
                        logger.error(`Error sending report to user ${user.id}:`, error);
                    }
                }
                
                logger.info(`Weekly user reports: ${sentCount} sent, ${failedCount} failed`);
                
            } catch (error) {
                logger.error('Weekly user reports job failed:', error);
            }
        });

        this.jobs.push(weeklyJob, userReportsJob);
        weeklyJob.start();
        userReportsJob.start();
        
        logger.debug('Weekly jobs scheduled');
    }

    setupMonthlyJobs() {
        logger.debug('Setting up monthly jobs...');
        
        // Monthly report on 1st of month at 6:00 AM UTC
        const monthlyJob = new cron.CronJob('0 6 1 * *', async () => {
            logger.info('Running monthly report job...');
            try {
                const { User } = require('../database/models');
                
                const monthStart = new Date();
                monthStart.setDate(1);
                monthStart.setMonth(monthStart.getMonth() - 1);
                
                const newUsersThisMonth = await User.count({
                    where: {
                        created_at: { $gte: monthStart }
                    }
                });
                
                const totalUsers = await User.count();
                
                const html = `
                    <div style="text-align: center;">
                        <h1 style="color: #4CAF50;">8x8org</h1>
                        <h2>Monthly Report</h2>
                        <p><strong>Month:</strong> ${monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div style="margin: 30px 0;">
                        <h3>📈 Monthly Statistics</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                            <tr style="background-color: #f7fafc;">
                                <td style="padding: 12px; border: 1px solid #e2e8f0;"><strong>New Users</strong></td>
                                <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">${newUsersThisMonth}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border: 1px solid #e2e8f0;"><strong>Total Users</strong></td>
                                <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">${totalUsers}</td>
                            </tr>
                            <tr style="background-color: #f7fafc;">
                                <td style="padding: 12px; border: 1px solid #e2e8f0;"><strong>Growth Rate</strong></td>
                                <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">${totalUsers > 0 ? ((newUsersThisMonth / totalUsers) * 100).toFixed(1) : 0}%</td>
                            </tr>
                        </table>
                    </div>
                    <div style="margin-top: 30px; padding: 20px; background-color: #e8f5e9; border-radius: 5px;">
                        <h4>🎯 Monthly Goals</h4>
                        <p>Continue growing user base</p>
                        <p>Improve user engagement</p>
                        <p>Add new features and tasks</p>
                    </div>
                `;
                
                await emailService.sendEmail({
                    to: process.env.ADMIN_EMAIL,
                    subject: `8x8org Monthly Report - ${monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
                    html: html
                });
                
                logger.info('✅ Monthly report sent');
                
            } catch (error) {
                logger.error('Monthly job failed:', error);
            }
        });

        // Monthly cleanup of old backups and reports
        const monthlyCleanupJob = new cron.CronJob('0 5 1 * *', async () => {
            logger.info('Running monthly cleanup job...');
            try {
                const fs = require('fs');
                const path = require('path');
                
                // Cleanup old backup files (keep last 30 days)
                const backupDir = path.join(__dirname, '../database/backups');
                if (fs.existsSync(backupDir)) {
                    const files = fs.readdirSync(backupDir);
                    const now = Date.now();
                    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
                    
                    files.forEach(file => {
                        const filePath = path.join(backupDir, file);
                        const stats = fs.statSync(filePath);
                        
                        if (stats.mtimeMs < thirtyDaysAgo && file.startsWith('backup_')) {
                            fs.unlinkSync(filePath);
                            logger.debug(`Removed old backup: ${file}`);
                        }
                    });
                }
                
                // Cleanup old report files (keep last 90 days)
                const reportsDir = path.join(__dirname, '../reports/exports');
                if (fs.existsSync(reportsDir)) {
                    const files = fs.readdirSync(reportsDir);
                    const now = Date.now();
                    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
                    
                    files.forEach(file => {
                        const filePath = path.join(reportsDir, file);
                        const stats = fs.statSync(filePath);
                        
                        if (stats.mtimeMs < ninetyDaysAgo && (file.endsWith('.xlsx') || file.endsWith('.csv'))) {
                            fs.unlinkSync(filePath);
                            logger.debug(`Removed old report: ${file}`);
                        }
                    });
                }
                
                logger.info('✅ Monthly cleanup completed');
                
            } catch (error) {
                logger.error('Monthly cleanup job failed:', error);
            }
        });

        this.jobs.push(monthlyJob, monthlyCleanupJob);
        monthlyJob.start();
        monthlyCleanupJob.start();
        
        logger.debug('Monthly jobs scheduled');
    }

    logScheduledJobs() {
        logger.info('📅 Scheduled Jobs Summary:');
        this.jobs.forEach((job, index) => {
            if (job.running) {
                logger.info(`  ${index + 1}. ${job.cronTime.source} - ${job.nextDates().toISOString()}`);
            }
        });
    }

    stopAllJobs() {
        logger.info('Stopping all scheduler jobs...');
        this.jobs.forEach(job => {
            if (job.running) {
                job.stop();
                logger.debug(`Stopped job: ${job.cronTime.source}`);
            }
        });
        this.jobs = [];
        this.isRunning = false;
        logger.info('All scheduler jobs stopped');
    }

    getStatus() {
        return {
            running: this.isRunning,
            jobCount: this.jobs.length,
            activeJobs: this.jobs.filter(j => j.running).length,
            nextExecutions: this.jobs
                .filter(j => j.running)
                .map(j => ({
                    pattern: j.cronTime.source,
                    next: j.nextDates().toISOString()
                }))
        };
    }
}

function startScheduler() {
    try {
        const scheduler = new SchedulerService();
        logger.startup('Scheduler service started');
        return scheduler;
    } catch (error) {
        logger.error('Failed to start scheduler:', error);
        return null;
    }
}

module.exports = {
    SchedulerService,
    startScheduler
};
