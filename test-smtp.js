// ==================== HOSTINGER SMTP TEST ====================
// Use this file to verify SMTP connection is working

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testSMTPConnection() {
    console.log('🔍 Testing Hostinger SMTP Configuration...\n');

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_SECURE !== 'false',
        auth: {
            user: process.env.SMTP_USER || 'info@trustfinvest.com',
            pass: process.env.SMTP_PASSWORD || 'Beesystem1#'
        }
    });

    try {
        console.log('📍 SMTP Configuration:');
        console.log(`   Host: ${process.env.SMTP_HOST}`);
        console.log(`   Port: ${process.env.SMTP_PORT}`);
        console.log(`   User: ${process.env.SMTP_USER}`);
        console.log(`   Secure: ${process.env.SMTP_SECURE}`);
        console.log('');

        console.log('⏳ Verifying connection...');
        await transporter.verify();
        
        console.log('✅ SMTP Connection Successful!');
        console.log('');

        // Send test email
        console.log('📧 Sending test email...');
        const testEmail = process.env.SMTP_USER; // Send to same email
        
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
            to: testEmail,
            subject: 'TrustFinvest SMTP Test - Success ✅',
            html: `
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; font-family: Arial;">
                    <h2 style="color: #0056D2;">✅ SMTP Connection Test</h2>
                    <p>Hello,</p>
                    <p>This is a test email to verify that your Hostinger SMTP configuration is working correctly.</p>
                    <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0056D2;">
                        <strong>Configuration Details:</strong>
                        <ul>
                            <li>Host: ${process.env.SMTP_HOST}</li>
                            <li>Port: ${process.env.SMTP_PORT}</li>
                            <li>Email: ${process.env.SMTP_USER}</li>
                            <li>Timestamp: ${new Date().toISOString()}</li>
                        </ul>
                    </div>
                    <p>If you received this email, your backend is ready to send notifications!</p>
                    <p style="color: #666; font-size: 12px;">
                        TrustFinvest Backend © 2024
                    </p>
                </div>
            `
        });

        console.log(`✅ Test email sent!`);
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   To: ${testEmail}`);
        console.log('');
        console.log('🎉 Everything is working correctly!');
        console.log('');
        console.log('Next steps:');
        console.log('  1. npm install');
        console.log('  2. npm run dev');
        console.log('  3. Your backend is ready!');
        
    } catch (error) {
        console.error('❌ SMTP Connection Failed!');
        console.error('');
        console.error('Error:', error.message);
        console.error('');
        console.error('Troubleshooting:');
        console.error('  1. Check that SMTP credentials are correct in .env');
        console.error('  2. Verify internet connection');
        console.error('  3. Try using port 587 instead of 465');
        console.error('  4. Check that info@trustfinvest.com is an active email');
        console.error('');
        process.exit(1);
    }
}

// Run test
testSMTPConnection();
