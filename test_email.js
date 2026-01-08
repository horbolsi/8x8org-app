const nodemailer = require('nodemailer');

console.log('Testing email configuration for 8x8org Ecosystem...\n');

// Load environment
require('dotenv').config();

// Handle password with spaces
let emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
if (emailPass) {
    // Remove quotes if present
    emailPass = emailPass.replace(/^["']|["']$/g, '');
}

const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER,
        pass: emailPass
    }
};

console.log('Configuration:');
console.log(`- Host: ${config.host}`);
console.log(`- Port: ${config.port}`);
console.log(`- User: ${config.auth.user || 'NOT SET'}`);
console.log(`- Password set: ${config.auth.pass ? 'Yes (masked)' : 'No'}`);
console.log(`- Report email: ${process.env.REPORT_EMAIL || 'NOT SET'}`);
console.log(`- Owner email: ${process.env.OWNER_EMAIL || 'NOT SET'}`);

if (!config.auth.user || !config.auth.pass) {
    console.error('\n❌ Email credentials not set in .env file');
    console.log('Current EMAIL_USER:', process.env.EMAIL_USER);
    console.log('Current EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set (masked)' : 'Not set');
    console.log('\nPlease check your .env file:');
    console.log('1. EMAIL_USER=xorgbytm8@gmail.com');
    console.log('2. EMAIL_PASS="milt wavx rmbm ctue" (with quotes)');
    process.exit(1);
}

console.log('\nCreating transporter...');
const transporter = nodemailer.createTransport(config);

console.log('Testing connection to Gmail...');
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('\nCommon Gmail issues:');
        console.log('1. Enable 2-Step Verification at: https://myaccount.google.com/security');
        console.log('2. Create App Password at: https://myaccount.google.com/apppasswords');
        console.log('3. Select "Mail" and "Other" (name it "8x8org Bot")');
        console.log('4. Use the 16-character password (no spaces in the generated password)');
        console.log('5. If password has spaces, wrap it in quotes in .env: EMAIL_PASS="your password"');
    } else {
        console.log('✅ Connection successful! Gmail SMTP is ready.');
        
        // Send test email
        console.log('\nSending test email to:', process.env.REPORT_EMAIL);
        const mailOptions = {
            from: `"8x8org Bot System" <${config.auth.user}>`,
            to: process.env.REPORT_EMAIL,
            subject: '✅ 8x8org Email Test Successful',
            text: `Test email sent successfully on ${new Date().toLocaleString()}\n\nIf you received this, email reports will work.\n\n8x8org by FlashTM8 ⚡️`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #28a745; text-align: center;">✅ 8x8org Email Test Successful</h2>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>System:</strong> 8x8org Bot Ecosystem</p>
                    <p><strong>Owner:</strong> FlashTM8 (Telegram ID: 1950324763)</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <h3 style="color: #666; margin-top: 0;">What this means:</h3>
                        <p>✅ Your email configuration is correct</p>
                        <p>✅ Excel reports will be sent to this address</p>
                        <p>✅ Daily summaries and alerts will work</p>
                        <p>✅ System notifications are enabled</p>
                    </div>
                    
                    <p>If you received this email, your 8x8org ecosystem is ready for automated reporting.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="font-size: 12px; color: #999; text-align: center;">
                        This is an automated test from the 8x8org Bot Ecosystem.<br>
                        Do not reply to this email.<br><br>
                        8x8org by FlashTM8 ⚡️
                    </p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('❌ Test email failed:', error.message);
            } else {
                console.log('✅ Test email sent successfully!');
                console.log(`📧 Message ID: ${info.messageId}`);
                console.log(`📨 Sent to: ${mailOptions.to}`);
                console.log('\n📋 Please check your:');
                console.log('   • Inbox (primary tab)');
                console.log('   • Promotions tab');
                console.log('   • Spam folder (mark as not spam if found)');
                console.log('\n⏱️  Delivery usually takes 1-2 minutes.');
            }
            process.exit(error ? 1 : 0);
        });
    }
});
