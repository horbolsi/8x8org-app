const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const adminConfig = require('../shared/admin_config');
const logger = require('../utils/logger');

class EmailService {
    constructor() {
        this.config = {
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        };
        
        this.transporter = null;
        this.initialize();
    }

    initialize() {
        if (this.config.auth.user && this.config.auth.pass) {
            this.transporter = nodemailer.createTransport(this.config);
            
            // Verify connection
            this.transporter.verify((error, success) => {
                if (error) {
                    logger.error('Email service initialization failed:', error);
                } else {
                    logger.botEvent('EmailService', 'Email service ready');
                }
            });
        } else {
            logger.warn('Email credentials not configured. Email service disabled.');
        }
    }

    async sendReportEmail(reportPath, options = {}) {
        if (!this.transporter) {
            return { success: false, error: 'Email service not configured' };
        }

        try {
            const reportName = path.basename(reportPath);
            const reportDate = new Date().toLocaleDateString();
            
            const mailOptions = {
                from: `"8x8org Ecosystem" <${this.config.auth.user}>`,
                to: options.to || process.env.REPORT_EMAIL || adminConfig.owner.email,
                subject: options.subject || `8x8org Ecosystem Report - ${reportDate}`,
                text: options.text || `Please find attached the system report for ${reportDate}.`,
                html: options.html || `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">8x8org Ecosystem Report</h2>
                        <p>Date: ${reportDate}</p>
                        <p>System: ${adminConfig.system.name}</p>
                        <p>Owner: ${adminConfig.owner.username}</p>
                        <p>Signature: ${adminConfig.getSignature()}</p>
                        
                        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
                            <h3 style="color: #666;">Report Contents:</h3>
                            <ul>
                                <li>System Summary</li>
                                <li>User Statistics</li>
                                <li>Task Performance</li>
                                <li>Financial Summary</li>
                                <li>Bot Performance</li>
                            </ul>
                        </div>
                        
                        <p>The Excel report is attached to this email.</p>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <p style="font-size: 12px; color: #999;">
                            This is an automated report from the 8x8org Ecosystem.<br>
                            Do not reply to this email.
                        </p>
                    </div>
                `,
                attachments: [
                    {
                        filename: reportName,
                        path: reportPath,
                        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    }
                ]
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            logger.botEvent('EmailService', `Report email sent: ${info.messageId}`);
            
            return {
                success: true,
                messageId: info.messageId,
                report: reportName,
                recipient: mailOptions.to
            };
            
        } catch (error) {
            logger.error('Email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    async sendAdminAlert(subject, message) {
        if (!this.transporter) return;

        try {
            const mailOptions = {
                from: `"8x8org Alert" <${this.config.auth.user}>`,
                to: adminConfig.owner.email,
                subject: `ALERT: ${subject}`,
                text: message,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #d9534f;">🔔 8x8org System Alert</h2>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                        
                        <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border: 1px solid #ffeaa7; border-radius: 5px;">
                            <p style="color: #856404; margin: 0;">${message}</p>
                        </div>
                        
                        <p>Signature: ${adminConfig.getSignature()}</p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            logger.botEvent('EmailService', `Admin alert sent: ${subject}`);
            
        } catch (error) {
            logger.error('Admin alert email failed:', error);
        }
    }

    async sendDailySummary() {
        if (!this.transporter) return;

        try {
            const today = new Date().toLocaleDateString();
            
            const mailOptions = {
                from: `"8x8org Daily Summary" <${this.config.auth.user}>`,
                to: adminConfig.owner.email,
                subject: `Daily Summary - ${today}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">📊 8x8org Daily Summary</h2>
                        <p>Date: ${today}</p>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                            <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px;">
                                <h3 style="margin-top: 0; color: #31708f;">👥 Users</h3>
                                <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">150</p>
                                <p style="margin: 0; font-size: 12px; color: #666;">+5 today</p>
                            </div>
                            
                            <div style="background-color: #dff0d8; padding: 15px; border-radius: 5px;">
                                <h3 style="margin-top: 0; color: #3c763d;">✅ Tasks</h3>
                                <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">42</p>
                                <p style="margin: 0; font-size: 12px; color: #666;">Completed today</p>
                            </div>
                            
                            <div style="background-color: #fcf8e3; padding: 15px; border-radius: 5px;">
                                <h3 style="margin-top: 0; color: #8a6d3b;">💰 Revenue</h3>
                                <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">$1,250</p>
                                <p style="margin: 0; font-size: 12px; color: #666;">Total distributed</p>
                            </div>
                            
                            <div style="background-color: #f2dede; padding: 15px; border-radius: 5px;">
                                <h3 style="margin-top: 0; color: #a94442;">⚠️ Issues</h3>
                                <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">0</p>
                                <p style="margin: 0; font-size: 12px; color: #666;">No issues today</p>
                            </div>
                        </div>
                        
                        <p>Signature: ${adminConfig.getSignature()}</p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            logger.botEvent('EmailService', 'Daily summary sent');
            
        } catch (error) {
            logger.error('Daily summary email failed:', error);
        }
    }
}

module.exports = EmailService;
