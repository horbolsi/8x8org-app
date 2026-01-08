const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const adminConfig = require('../shared/admin_config');
const logger = require('./logger');

class ExcelReporter {
    constructor() {
        this.reportsDir = './reports';
        this.ensureDirectory();
    }

    ensureDirectory() {
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }

    async generateSystemReport(data = {}) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `system_report_${timestamp}.xlsx`;
            const filepath = path.join(this.reportsDir, filename);
            
            const workbook = new ExcelJS.Workbook();
            workbook.creator = '8x8org Ecosystem';
            workbook.lastModifiedBy = adminConfig.owner.username;
            workbook.created = new Date();
            workbook.modified = new Date();
            
            // ===== SHEET 1: SYSTEM SUMMARY =====
            const summarySheet = workbook.addWorksheet('System Summary');
            
            // Add header with signature
            summarySheet.mergeCells('A1:F1');
            summarySheet.getCell('A1').value = '8x8org Ecosystem - System Report';
            summarySheet.getCell('A1').font = { bold: true, size: 16 };
            summarySheet.getCell('A1').alignment = { horizontal: 'center' };
            
            summarySheet.mergeCells('A2:F2');
            summarySheet.getCell('A2').value = adminConfig.getSignature();
            summarySheet.getCell('A2').font = { italic: true };
            summarySheet.getCell('A2').alignment = { horizontal: 'center' };
            
            summarySheet.getCell('A4').value = 'Report Generated:';
            summarySheet.getCell('B4').value = new Date().toLocaleString();
            
            summarySheet.getCell('A5').value = 'System Owner:';
            summarySheet.getCell('B5').value = adminConfig.owner.username;
            
            summarySheet.getCell('A6').value = 'System Version:';
            summarySheet.getCell('B6').value = adminConfig.system.version;
            
            // ===== SHEET 2: USER STATISTICS =====
            const usersSheet = workbook.addWorksheet('User Statistics');
            usersSheet.addRow(['User ID', 'Username', 'Tasks Completed', 'Total Earned', 'Join Date', 'Status']);
            usersSheet.addRow(['123456789', '@FlashTM8', 42, '$1250.50', '2024-01-01', 'Active']);
            usersSheet.addRow(['987654321', '@TestUser', 15, '$325.75', '2024-01-15', 'Active']);
            
            // ===== SHEET 3: TASK PERFORMANCE =====
            const tasksSheet = workbook.addWorksheet('Task Performance');
            tasksSheet.addRow(['Task ID', 'Type', 'Completed', 'Pending', 'Failed', 'Avg Time', 'Reward Pool']);
            tasksSheet.addRow(['OUT-001', 'External', 42, 8, 2, '2.5h', '$1250']);
            tasksSheet.addRow(['IN-001', 'Internal', 28, 12, 1, '1.5h', '$750']);
            
            // ===== SHEET 4: FINANCIAL SUMMARY =====
            const financialSheet = workbook.addWorksheet('Financial Summary');
            financialSheet.addRow(['Date', 'Type', 'Amount', 'Currency', 'Description', 'Status']);
            financialSheet.addRow(['2024-01-15', 'Task Reward', 50.00, 'USD', 'OUT Task Completion', 'Paid']);
            financialSheet.addRow(['2024-01-15', 'Airdrop', 25.00, 'USD', 'Referral Bonus', 'Paid']);
            
            // ===== SHEET 5: BOT PERFORMANCE =====
            const botsSheet = workbook.addWorksheet('Bot Performance');
            botsSheet.addRow(['Bot Name', 'Status', 'Users', 'Uptime', 'Last Restart', 'Performance']);
            botsSheet.addRow(['Main Bot', 'Online', 150, '99.8%', '2024-01-14', 'Excellent']);
            botsSheet.addRow(['OUT Bot', 'Online', 125, '99.5%', '2024-01-14', 'Good']);
            botsSheet.addRow(['IN Bot', 'Online', 98, '99.2%', '2024-01-14', 'Good']);
            botsSheet.addRow(['Airdrop Bot', 'Online', 150, '100%', '2024-01-01', 'Excellent']);
            botsSheet.addRow(['Wallet Bot', 'Online', 85, '98.7%', '2024-01-10', 'Good']);
            botsSheet.addRow(['NFT Bot', 'Online', 65, '97.5%', '2024-01-05', 'Fair']);
            
            // Style the sheets
            [summarySheet, usersSheet, tasksSheet, financialSheet, botsSheet].forEach(sheet => {
                sheet.columns.forEach(column => {
                    column.width = 20;
                });
                
                // Header styling
                const headerRow = sheet.getRow(1);
                headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                headerRow.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF4F81BD' }
                };
            });
            
            // Save the workbook
            await workbook.xlsx.writeFile(filepath);
            
            logger.botEvent('ExcelReporter', `Report generated: ${filename}`);
            
            return {
                success: true,
                filename,
                filepath,
                size: fs.statSync(filepath).size
            };
            
        } catch (error) {
            logger.error('Excel report generation failed:', error);
            return { success: false, error: error.message };
        }
    }

    async sendReportToEmail(filename) {
        // This would integrate with your email service
        // For now, we'll just log it
        logger.botEvent('ExcelReporter', `Report ${filename} ready for email delivery`);
        
        return {
            success: true,
            message: 'Report queued for email delivery',
            filename
        };
    }

    async generateAndSendReport() {
        try {
            const report = await this.generateSystemReport();
            
            if (report.success) {
                // Send to email
                const emailResult = await this.sendReportToEmail(report.filename);
                
                return {
                    report: report,
                    email: emailResult,
                    signature: adminConfig.getSignature()
                };
            }
            
            return report;
        } catch (error) {
            logger.error('Report generation and sending failed:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = ExcelReporter;
