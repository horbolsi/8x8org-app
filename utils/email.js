const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        try {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
            
            logger.emailEvent('Transporter initialized', process.env.SMTP_USER);
        } catch (error) {
            logger.error('Failed to initialize email transporter:', error);
            this.transporter = null;
        }
    }

    async sendEmail(options) {
        if (!this.transporter) {
            logger.error('Email transporter not initialized');
            return { success: false, error: 'Email service not configured' };
        }

        try {
            const mailOptions = {
                from: `"8x8org System" <${process.env.SMTP_USER}>`,
                to: options.to,
                subject: options.subject || '8x8org System Notification',
                html: options.html || this.createBasicTemplate(options.text || ''),
                text: options.text,
                attachments: options.attachments || []
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            logger.emailEvent('Email sent', options.to, {
                subject: options.subject,
                message_id: info.messageId
            });
            
            return { 
                success: true, 
                messageId: info.messageId,
                response: info.response 
            };
        } catch (error) {
            logger.error('Email sending failed:', error);
            return { 
                success: false, 
                error: error.message,
                code: error.code 
            };
        }
    }

    createBasicTemplate(content) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>8x8org System Notification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #333;
            margin: 0;
        }
        .content {
            padding: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
        .logo {
            text-align: center;
            margin-bottom: 20px;
        }
        .logo span {
            font-size: 24px;
            font-weight: bold;
            color: #4CAF50;
        }
        .highlight {
            background-color: #f9f9f9;
            padding: 15px;
            border-left: 4px solid #4CAF50;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <span>8x8org</span>
        </div>
        <div class="header">
            <h1>8x8org System Notification</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>This is an automated message from 8x8org Telegram Ecosystem</p>
            <p>Please do not reply to this email</p>
            <p>Time: ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    async sendEmailWithExcel(data, filename, recipient, subject) {
        if (!this.transporter) {
            logger.error('Email transporter not initialized');
            return { success: false, error: 'Email service not configured' };
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Data');
            
            // Check if data is an array of objects
            if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
                const headers = Object.keys(data[0]);
                
                // Add headers
                worksheet.columns = headers.map(header => ({
                    header: header.toUpperCase().replace(/_/g, ' '),
                    key: header,
                    width: 20
                }));
                
                // Style headers
                const headerRow = worksheet.getRow(1);
                headerRow.font = { bold: true };
                headerRow.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE0E0E0' }
                };
                
                // Add data rows
                data.forEach(row => {
                    const rowData = {};
                    headers.forEach(header => {
                        rowData[header] = row[header];
                    });
                    worksheet.addRow(rowData);
                });
            } else {
                // Simple data array
                worksheet.addRow(['Data', 'Value']);
                if (Array.isArray(data)) {
                    data.forEach((item, index) => {
                        worksheet.addRow([index + 1, item]);
                    });
                } else {
                    worksheet.addRow([1, data]);
                }
            }
            
            // Auto-fit columns
            worksheet.columns.forEach(column => {
                let maxLength = 0;
                column.eachCell({ includeEmpty: true }, cell => {
                    const cellLength = cell.value ? cell.value.toString().length : 10;
                    if (cellLength > maxLength) {
                        maxLength = cellLength;
                    }
                });
                column.width = Math.min(maxLength + 2, 50);
            });
            
            // Save to buffer
            const buffer = await workbook.xlsx.writeBuffer();
            
            const result = await this.sendEmail({
                to: recipient,
                subject: subject || `8x8org Data Export - ${new Date().toLocaleDateString()}`,
                text: 'Please find the attached data export.',
                attachments: [{
                    filename: `${filename}.xlsx`,
                    content: buffer,
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }]
            });
            
            logger.emailEvent('Excel report sent', recipient, { filename: filename });
            return result;
            
        } catch (error) {
            logger.error('Failed to send Excel report:', error);
            return { success: false, error: error.message };
        }
    }

    async sendDailyReport() {
        if (!process.env.ENABLE_EMAIL_REPORTS || process.env.ENABLE_EMAIL_REPORTS === 'false') {
            logger.debug('Daily reports disabled by configuration');
            return { success: false, error: 'Reports disabled' };
        }

        try {
            const { User, UserTask } = require('../database/models');
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            const newUsers = await User.count({
                where: {
                    created_at: {
                        $gte: yesterday,
                        $lt: today
                    }
                }
            });
            
            const completedTasks = await UserTask.count({
                where: {
                    status: 'completed',
                    completed_at: {
                        $gte: yesterday,
                        $lt: today
                    }
                }
            });
            
            const totalUsers = await User.count();
            const totalTasks = await UserTask.count();
            const activeUsers = await User.count({
                where: {
                    last_active: {
                        $gte: yesterday
                    }
                }
            });
            
            const html = `
                <h2>📊 8x8org Daily Report</h2>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <div class="highlight">
                    <h3>📈 Daily Statistics</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background-color: #f7fafc;">
                            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>New Users (24h)</strong></td>
                            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">${newUsers}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Tasks Completed (24h)</strong></td>
                            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">${completedTasks}</td>
                        </tr>
                        <tr style="background-color: #f7fafc;">
                            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Active Users (24h)</strong></td>
                            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">${activeUsers}</td>
                        </tr>
                    </table>
                </div>
                <div style="margin-top: 20px;">
                    <h3>📊 Overall Statistics</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background-color: #f7fafc;">
                            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Total Users</strong></td>
                            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">${totalUsers}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Total Tasks</strong></td>
                            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">${totalTasks}</td>
                        </tr>
                    </table>
                </div>
                <div style="margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #0ea5e9;">
                    <p><strong>💡 System Status:</strong> All systems operational</p>
                    <p><strong>⏰ Next Backup:</strong> Scheduled for 02:00 UTC</p>
                </div>
            `;
            
            const result = await this.sendEmail({
                to: process.env.ADMIN_EMAIL,
                subject: `8x8org Daily Report - ${new Date().toLocaleDateString()}`,
                html: html
            });
            
            logger.emailEvent('Daily report sent', process.env.ADMIN_EMAIL, {
                new_users: newUsers,
                completed_tasks: completedTasks
            });
            
            return result;
        } catch (error) {
            logger.error('Failed to send daily report:', error);
            return { success: false, error: error.message };
        }
    }

    async sendUserReport(userId, period = 'weekly') {
        try {
            const { User, UserTask } = require('../database/models');
            
            const user = await User.findOne({ where: { telegram_id: userId } });
            if (!user || !user.email) {
                return { success: false, error: 'User not found or no email registered' };
            }
            
            const now = new Date();
            let startDate = new Date();
            let periodName = period;
            
            switch(period) {
                case 'daily':
                    startDate.setDate(now.getDate() - 1);
                    break;
                case 'weekly':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'monthly':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                default:
                    startDate.setDate(now.getDate() - 7);
                    periodName = 'weekly';
            }
            
            const userTasks = await UserTask.findAll({
                where: {
                    user_id: user.id,
                    status: 'completed',
                    completed_at: {
                        $gte: startDate
                    }
                },
                include: ['Task']
            });
            
            const totalPoints = userTasks.reduce((sum, task) => sum + (task.score_earned || 0), 0);
            
            const html = `
                <div style="text-align: center;">
                    <h1 style="color: #4CAF50;">8x8org</h1>
                    <h2>Your ${periodName} Report</h2>
                </div>
                <div class="highlight">
                    <p>Hello <strong>${user.first_name}</strong>!</p>
                    <p>Here's your activity summary for ${startDate.toLocaleDateString()} to ${now.toLocaleDateString()}:</p>
                </div>
                <div style="margin: 20px 0;">
                    <h3>📈 Activity Summary</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tr style="background-color: #f7fafc;">
                            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Tasks Completed</strong></td>
                            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${userTasks.length}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Total Points Earned</strong></td>
                            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${totalPoints}</td>
                        </tr>
                        <tr style="background-color: #f7fafc;">
                            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Current Score</strong></td>
                            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${user.score}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Current Level</strong></td>
                            <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${user.level}</td>
                        </tr>
                    </table>
                </div>
                ${userTasks.length > 0 ? `
                <div style="margin: 20px 0;">
                    <h3>✅ Recent Tasks</h3>
                    <ul style="list-style-type: none; padding-left: 0;">
                        ${userTasks.slice(0, 5).map(task => `
                            <li style="padding: 5px 0; border-bottom: 1px solid #eee;">
                                ${task.Task?.title || 'Task'}: <strong>+${task.score_earned || 0} points</strong>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}
                <div style="margin-top: 30px; padding: 15px; background-color: #f0f9ff; border-radius: 5px;">
                    <p style="margin: 0;">Keep up the great work! 🚀</p>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">- 8x8org Team</p>
                </div>
            `;
            
            const result = await this.sendEmail({
                to: user.email,
                subject: `Your ${periodName} 8x8org Report`,
                html: html
            });
            
            logger.emailEvent('User report sent', user.email, {
                user_id: user.id,
                period: periodName,
                tasks: userTasks.length
            });
            
            return result;
        } catch (error) {
            logger.error('Failed to send user report:', error);
            return { success: false, error: error.message };
        }
    }

    async sendSystemAlert(subject, message, level = 'info') {
        try {
            const html = `
                <div style="padding: 20px; background-color: ${level === 'error' ? '#fee' : level === 'warning' ? '#ffeaa7' : '#f0f9ff'}; border-left: 4px solid ${level === 'error' ? '#dc3545' : level === 'warning' ? '#ffc107' : '#0ea5e9'};">
                    <h2 style="margin-top: 0; color: ${level === 'error' ? '#dc3545' : level === 'warning' ? '#856404' : '#0c5460'};">${subject}</h2>
                    <pre style="white-space: pre-wrap; font-family: monospace; background: white; padding: 15px; border-radius: 5px;">${message}</pre>
                    <p style="margin-bottom: 0; font-size: 12px; color: #666;">
                        System: 8x8org Telegram Ecosystem<br>
                        Time: ${new Date().toLocaleString()}<br>
                        Level: ${level.toUpperCase()}
                    </p>
                </div>
            `;
            
            const result = await this.sendEmail({
                to: process.env.ADMIN_EMAIL,
                subject: `[8x8org ${level.toUpperCase()}] ${subject}`,
                html: html
            });
            
            logger.emailEvent('System alert sent', process.env.ADMIN_EMAIL, {
                subject: subject,
                level: level
            });
            
            return result;
        } catch (error) {
            logger.error('Failed to send system alert:', error);
            return { success: false, error: error.message };
        }
    }

    async verifyConnection() {
        if (!this.transporter) {
            return { success: false, error: 'Transporter not initialized' };
        }

        try {
            await this.transporter.verify();
            return { success: true, message: 'Email connection verified' };
        } catch (error) {
            logger.error('Email connection verification failed:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create singleton instance
const emailService = new EmailService();

// Test connection on startup
setTimeout(async () => {
    const result = await emailService.verifyConnection();
    if (result.success) {
        logger.info('✅ Email service connected successfully');
    } else {
        logger.warn('⚠️ Email service connection failed:', result.error);
    }
}, 5000);

module.exports = emailService;
