const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter with Hostinger SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    },
    logger: process.env.ENABLE_EMAIL_LOGS === 'true',
    debug: process.env.NODE_ENV === 'development'
});

// Verify SMTP connection
transporter.verify((error, success) => {
    if (error) {
        console.error('[Email Service] SMTP Connection Error:', error);
    } else {
        console.log('[Email Service] SMTP Server Ready - info@trustfinvest.com');
    }
});

// Email logo (using app logo URL)
const LOGO_URL = 'https://trustfinvest.com/img/download.png';
const BRAND_COLOR_PRIMARY = '#0056D2';
const BRAND_COLOR_ACCENT = '#FF7A00';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://trustfinvest.com';

// Email templates with activity listeners
const emailTemplates = {
    // ... (existing templates) ...
    passwordReset: (userName, resetLink) => ({
        subject: '🔑 Your Password Reset Request',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, ${BRAND_COLOR_PRIMARY}, ${BRAND_COLOR_ACCENT}); padding: 30px; text-align: center; color: white; }
                    .header img { height: 50px; margin-bottom: 10px; }
                    .header h1 { margin: 10px 0; font-size: 28px; }
                    .content { padding: 30px; background: white; }
                    .button { display: inline-block; background: ${BRAND_COLOR_PRIMARY}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
                    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="${LOGO_URL}" alt="TrustFinvest Logo" />
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <p>We received a request to reset your password. Click the button below to choose a new one. If you did not make this request, you can safely ignore this email.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" class="button">Reset Your Password</a>
                        </div>

                        <p>This link will expire in 1 hour.</p>
                        <p>Best regards,<br><strong>The TrustFinvest Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 TrustFinvest. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),
    // ... (rest of the templates)
    newUserRegistration: (userName, email) => ({
        subject: '🎉 Welcome to TrustFinvest - Verify Your Account',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, ${BRAND_COLOR_PRIMARY}, ${BRAND_COLOR_ACCENT}); padding: 30px; text-align: center; color: white; }
                    .header img { height: 50px; margin-bottom: 10px; }
                    .header h1 { margin: 10px 0; font-size: 28px; }
                    .content { padding: 30px; background: white; }
                    .section { margin: 20px 0; }
                    .highlight { background: #f0f4ff; border-left: 4px solid ${BRAND_COLOR_PRIMARY}; padding: 15px; border-radius: 4px; margin: 15px 0; }
                    .button { display: inline-block; background: ${BRAND_COLOR_PRIMARY}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
                    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
                    .feature-list { list-style: none; padding: 0; }
                    .feature-list li { padding: 8px 0; padding-left: 25px; position: relative; }
                    .feature-list li:before { content: "✓"; position: absolute; left: 0; color: ${BRAND_COLOR_ACCENT}; font-weight: bold; }
                    .icon { font-size: 30px; margin-right: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="${LOGO_URL}" alt="TrustFinvest Logo" />
                        <h1>Welcome to TrustFinvest! 🚀</h1>
                    </div>
                    <div class="content">
                        <p>Hi <strong>${userName}</strong>,</p>
                        <p>Thank you for registering with <strong>TrustFinvest</strong>! We're thrilled to have you join our community of smart investors.</p>
                        
                        <div class="highlight">
                            <strong>Your Account is Active!</strong><br>
                            You can now log in and start exploring investment opportunities.
                        </div>

                        <div class="section">
                            <h3>🎯 Get Started in 3 Simple Steps:</h3>
                            <ol>
                                <li><strong>Complete Your Profile</strong> - Add your details for personalized recommendations</li>
                                <li><strong>Make Your First Deposit</strong> - Choose your preferred investment plan (5% - 15% ROI)</li>
                                <li><strong>Start Earning</strong> - Watch your investments grow daily</li>
                            </ol>
                        </div>

                        <div class="section">
                            <h3>💰 Why Choose TrustFinvest?</h3>
                            <ul class="feature-list">
                                <li>Secure and transparent platform</li>
                                <li>Competitive ROI (5% - 15% per investment)</li>
                                <li>Daily earnings tracking</li>
                                <li>Multiple investment plans</li>
                                <li>Free daily tasks for bonus earnings</li>
                                <li>24/7 customer support</li>
                            </ul>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${FRONTEND_URL}/dashboard" class="button">Access Your Dashboard</a>
                        </div>

                        <p><strong>Questions?</strong> Our support team is here to help: <a href="mailto:info@trustfinvest.com">info@trustfinvest.com</a></p>
                        <p>Best regards,<br><strong>The TrustFinvest Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 TrustFinvest. All rights reserved.</p>
                        <p>You received this email because you created an account at TrustFinvest</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    welcomeBack: (userName, email, lastLogin) => ({
        subject: '👋 Welcome Back to TrustFinvest!',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
                    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, ${BRAND_COLOR_PRIMARY}, ${BRAND_COLOR_ACCENT}); padding: 30px; text-align: center; color: white; }
                    .header img { height: 50px; margin-bottom: 10px; }
                    .content { padding: 30px; }
                    .stat-box { background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid ${BRAND_COLOR_PRIMARY}; }
                    .button { display: inline-block; background: ${BRAND_COLOR_PRIMARY}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
                    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="${LOGO_URL}" alt="TrustFinvest Logo" />
                        <h1>Welcome Back, ${userName}! 👋</h1>
                    </div>
                    <div class="content">
                        <p>It's been a while! We're happy to see you again at TrustFinvest.</p>
                        
                        <div class="stat-box">
                            <strong>Last Active:</strong> ${lastLogin || 'Recently'}<br>
                            Your investments continue to work for you!
                        </div>

                        <h3>📊 What's New?</h3>
                        <ul>
                            <li>New high-yield investment plans available</li>
                            <li>Enhanced daily task rewards</li>
                            <li>Improved dashboard analytics</li>
                            <li>Better withdrawal processing</li>
                        </ul>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${FRONTEND_URL}/dashboard" class="button">View Your Dashboard</a>
                        </div>

                        <p>Your investments are growing. Check your portfolio to see the latest updates!</p>
                        <p>Best regards,<br><strong>The TrustFinvest Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 TrustFinvest. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    // Activity Emails
    depositConfirmation: (userName, amount, reference) => ({
        subject: `💰 Deposit Confirmed - ${amount} USD`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
                    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #4CAF50, #45a049); padding: 30px; text-align: center; color: white; }
                    .header img { height: 50px; margin-bottom: 10px; }
                    .content { padding: 30px; }
                    .transaction-box { background: #f0fff4; border: 2px solid #4CAF50; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .transaction-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
                    .transaction-row:last-child { border-bottom: none; }
                    .label { font-weight: bold; color: #666; }
                    .value { color: #333; }
                    .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
                    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="${LOGO_URL}" alt="TrustFinvest Logo" />
                        <h1>Deposit Confirmed! ✅</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <p>Your deposit has been successfully processed. Here are the details:</p>
                        
                        <div class="transaction-box">
                            <div class="transaction-row">
                                <span class="label">Amount:</span>
                                <span class="value"><strong>$${amount}</strong></span>
                            </div>
                            <div class="transaction-row">
                                <span class="label">Status:</span>
                                <span class="value"><strong>✓ Confirmed</strong></span>
                            </div>
                            <div class="transaction-row">
                                <span class="label">Reference:</span>
                                <span class="value"><strong>${reference}</strong></span>
                            </div>
                            <div class="transaction-row">
                                <span class="label">Date:</span>
                                <span class="value"><strong>${new Date().toLocaleDateString()}</strong></span>
                            </div>
                        </div>

                        <h3>💡 Next Steps:</h3>
                        <ol>
                            <li>Choose an investment plan that suits you</li>
                            <li>Start earning daily returns</li>
                            <li>Complete daily tasks for bonus earnings</li>
                            <li>Track your earnings in real-time</li>
                        </ol>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${FRONTEND_URL}/dashboard?tab=invest" class="button">Start Investing Now</a>
                        </div>

                        <p>Thank you for choosing TrustFinvest!</p>
                        <p>Best regards,<br><strong>The TrustFinvest Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 TrustFinvest. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    investmentCreated: (userName, plan, amount, roi, duration) => ({
        subject: `🎯 Investment Confirmed - ${plan} Plan`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
                    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #2196F3, #1976D2); padding: 30px; text-align: center; color: white; }
                    .header img { height: 50px; margin-bottom: 10px; }
                    .content { padding: 30px; }
                    .investment-box { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .investment-row { display: flex; justify-content: space-between; padding: 10px 0; }
                    .label { font-weight: bold; color: #666; }
                    .value { color: #1976D2; font-weight: bold; }
                    .calculator-box { background: #fff3e0; padding: 15px; border-radius: 8px; margin: 15px 0; }
                    .button { display: inline-block; background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
                    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="${LOGO_URL}" alt="TrustFinvest Logo" />
                        <h1>Investment Confirmed! 🎯</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <p>Congratulations! Your investment has been successfully created. Here are your investment details:</p>
                        
                        <div class="investment-box">
                            <div class="investment-row">
                                <span class="label">Plan:</span>
                                <span class="value">${plan}</span>
                            </div>
                            <div class="investment-row">
                                <span class="label">Investment Amount:</span>
                                <span class="value">$${amount}</span>
                            </div>
                            <div class="investment-row">
                                <span class="label">Expected ROI:</span>
                                <span class="value">${roi}% per month</span>
                            </div>
                            <div class="investment-row">
                                <span class="label">Duration:</span>
                                <span class="value">${duration} days</span>
                            </div>
                            <div class="investment-row">
                                <span class="label">Expected Return:</span>
                                <span class="value">$${(amount * roi / 100).toFixed(2)}</span>
                            </div>
                        </div>

                        <div class="calculator-box">
                            <strong>📊 Earnings Estimate:</strong><br>
                            Daily Earnings: $${(amount * roi / 100 / 30).toFixed(2)}<br>
                            Total Expected Return: $${(amount * roi / 100).toFixed(2)}<br>
                            Total Value at Maturity: $${(amount + amount * roi / 100).toFixed(2)}
                        </div>

                        <h3>✨ Track Your Investment:</h3>
                        <p>Watch your investment grow in real-time on your dashboard. You can monitor daily earnings and view detailed analytics.</p>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${FRONTEND_URL}/dashboard?tab=analytics" class="button">View Your Portfolio</a>
                        </div>

                        <p>Thank you for investing with TrustFinvest!</p>
                        <p>Best regards,<br><strong>The TrustFinvest Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 TrustFinvest. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    withdrawalInitiated: (userName, amount, method) => ({
        subject: `⏳ Withdrawal Pending - ${amount} USD`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
                    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #FF9800, #F57C00); padding: 30px; text-align: center; color: white; }
                    .header img { height: 50px; margin-bottom: 10px; }
                    .content { padding: 30px; }
                    .info-box { background: #fff3e0; border-left: 4px solid #FF9800; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
                    .label { font-weight: bold; color: #666; }
                    .value { color: #F57C00; }
                    .timeline { padding: 20px; background: #f9f9f9; border-radius: 8px; margin: 20px 0; }
                    .timeline-item { padding: 10px; display: flex; align-items: center; }
                    .timeline-icon { width: 30px; height: 30px; background: #FF9800; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px; }
                    .button { display: inline-block; background: #FF9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
                    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="${LOGO_URL}" alt="TrustFinvest Logo" />
                        <h1>Withdrawal Initiated ⏳</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <p>Your withdrawal request has been received and is being processed. Here are the details:</p>
                        
                        <div class="info-box">
                            <div class="info-row">
                                <span class="label">Amount:</span>
                                <span class="value"><strong>$${amount}</strong></span>
                            </div>
                            <div class="info-row">
                                <span class="label">Method:</span>
                                <span class="value"><strong>${method}</strong></span>
                            </div>
                            <div class="info-row">
                                <span class="label">Status:</span>
                                <span class="value"><strong>⏳ Processing</strong></span>
                            </div>
                            <div class="info-row">
                                <span class="label">Date:</span>
                                <span class="value"><strong>${new Date().toLocaleDateString()}</strong></span>
                            </div>
                        </div>

                        <h3>📅 Expected Timeline:</h3>
                        <div class="timeline">
                            <div class="timeline-item">
                                <div class="timeline-icon">✓</div>
                                <div>Request Received - Now</div>
                            </div>
                            <div class="timeline-item">
                                <div class="timeline-icon">1</div>
                                <div>Processing - 1-2 hours</div>
                            </div>
                            <div class="timeline-item">
                                <div class="timeline-icon">2</div>
                                <div>Review - 1-2 hours</div>
                            </div>
                            <div class="timeline-item">
                                <div class="timeline-icon">3</div>
                                <div>Approved & Sent - 24 hours</div>
                            </div>
                        </div>

                        <p><strong>📧 You will receive another email once your withdrawal is approved and processed.</strong></p>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${FRONTEND_URL}/dashboard?tab=transactions" class="button">View Withdrawal Status</a>
                        </div>

                        <p>If you have any questions about your withdrawal, please contact our support team at info@trustfinvest.com</p>
                        <p>Best regards,<br><strong>The TrustFinvest Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 TrustFinvest. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    withdrawalApproved: (userName, amount, method) => ({
        subject: `✅ Withdrawal Approved - ${amount} USD`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
                    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #4CAF50, #45a049); padding: 30px; text-align: center; color: white; }
                    .header img { height: 50px; margin-bottom: 10px; }
                    .header h1 { margin: 0; }
                    .content { padding: 30px; }
                    .success-box { background: #f0fff4; border-left: 4px solid #4CAF50; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
                    .label { font-weight: bold; color: #666; }
                    .value { color: #4CAF50; font-weight: bold; }
                    .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
                    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="${LOGO_URL}" alt="TrustFinvest Logo" />
                        <h1>Withdrawal Approved! ✅</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <p>Great news! Your withdrawal has been approved and is on its way to you.</p>
                        
                        <div class="success-box">
                            <div class="info-row">
                                <span class="label">Amount:</span>
                                <span class="value">$${amount}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Payment Method:</span>
                                <span class="value">${method}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Status:</span>
                                <span class="value">✅ Approved</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Expected Arrival:</span>
                                <span class="value">1-3 business days</span>
                            </div>
                        </div>

                        <h3>💡 What's Next?</h3>
                        <ul>
                            <li>You will receive your funds within 1-3 business days</li>
                            <li>Check your email for payment confirmation</li>
                            <li>Return anytime to invest more and earn bigger returns</li>
                        </ul>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${FRONTEND_URL}/dashboard" class="button">Back to Dashboard</a>
                        </div>

                        <p>Thank you for being part of the TrustFinvest community!</p>
                        <p>Best regards,<br><strong>The TrustFinvest Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 TrustFinvest. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    taskCompleted: (userName, taskTitle, reward) => ({
        subject: `🎁 Task Completed - Bonus Earned: ${reward} TF`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
                    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #9C27B0, #7B1FA2); padding: 30px; text-align: center; color: white; }
                    .header img { height: 50px; margin-bottom: 10px; }
                    .content { padding: 30px; }
                    .reward-box { background: #f3e5f5; border-left: 4px solid #9C27B0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
                    .reward-amount { font-size: 36px; font-weight: bold; color: #9C27B0; }
                    .button { display: inline-block; background: #9C27B0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
                    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="${LOGO_URL}" alt="TrustFinvest Logo" />
                        <h1>Excellent Work! 🎉</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <p>You just completed a daily task! Here's your reward:</p>
                        
                        <div class="reward-box">
                            <p><strong>Task:</strong> ${taskTitle}</p>
                            <p class="reward-amount">+ ${reward} TF</p>
                            <p>Added to your account!</p>
                        </div>

                        <h3>🏆 Keep It Up!</h3>
                        <p>Complete more daily tasks to earn bonus tokens. Your consistency helps you build wealth faster!</p>

                        <h3>💰 Today's Earnings Summary:</h3>
                        <ul>
                            <li>Daily Task Reward: ${reward} TF</li>
                            <li>Continue with more tasks to maximize your earnings</li>
                        </ul>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${FRONTEND_URL}/dashboard?tab=tasks" class="button">View More Tasks</a>
                        </div>

                        <p>Best regards,<br><strong>The TrustFinvest Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 TrustFinvest. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    earningsUpdate: (userName, dailyEarnings, totalEarnings, investmentCount) => ({
        subject: `📊 Your Daily Earnings Summary - $${dailyEarnings}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
                    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #0056D2, #FF7A00); padding: 30px; text-align: center; color: white; }
                    .header img { height: 50px; margin-bottom: 10px; }
                    .content { padding: 30px; }
                    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
                    .stat-card { background: #f0f4ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0056D2; }
                    .stat-label { color: #666; font-size: 12px; font-weight: bold; }
                    .stat-value { font-size: 24px; font-weight: bold; color: #0056D2; margin: 5px 0; }
                    .chart-box { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .button { display: inline-block; background: #0056D2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
                    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="${LOGO_URL}" alt="TrustFinvest Logo" />
                        <h1>Your Daily Earnings 📊</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <p>Here's your earnings summary for today:</p>
                        
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-label">TODAY'S EARNINGS</div>
                                <div class="stat-value">$${dailyEarnings}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">TOTAL EARNINGS</div>
                                <div class="stat-value">$${totalEarnings}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">ACTIVE INVESTMENTS</div>
                                <div class="stat-value">${investmentCount}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">STATUS</div>
                                <div class="stat-value">✓ Growing</div>
                            </div>
                        </div>

                        <div class="chart-box">
                            <h3>💡 Pro Tips:</h3>
                            <ul>
                                <li>Your investments are working 24/7 to generate returns</li>
                                <li>Complete daily tasks to earn additional bonuses</li>
                                <li>Reinvest your earnings for compound growth</li>
                                <li>Refer friends and earn referral bonuses</li>
                            </ul>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${FRONTEND_URL}/dashboard?tab=analytics" class="button">View Detailed Analytics</a>
                        </div>

                        <p>Keep investing and watch your wealth grow!</p>
                        <p>Best regards,<br><strong>The TrustFinvest Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 TrustFinvest. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    newsletter: (content, date = new Date().toLocaleDateString()) => ({
        subject: `📰 TrustFinvest Newsletter - ${date}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
                    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #0056D2, #FF7A00); padding: 30px; text-align: center; color: white; }
                    .header img { height: 50px; margin-bottom: 10px; }
                    .content { padding: 30px; }
                    .newsletter-section { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px; border-left: 4px solid #0056D2; }
                    .button { display: inline-block; background: #0056D2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
                    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="${LOGO_URL}" alt="TrustFinvest Logo" />
                        <h1>TrustFinvest Newsletter 📰</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>Here's what's happening in the TrustFinvest community:</p>
                        
                        <div class="newsletter-section">
                            ${content}
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${FRONTEND_URL}/dashboard" class="button">View More Updates</a>
                        </div>

                        <p>Stay tuned for more updates!</p>
                        <p>Best regards,<br><strong>The TrustFinvest Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 TrustFinvest. All rights reserved.</p>
                        <p><a href="${FRONTEND_URL}/unsubscribe" style="color: #0056D2;">Unsubscribe from newsletters</a></p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    activityAlert: (userName, activityType, details) => ({
        subject: `🔔 Activity Alert - ${activityType}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
                    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #0056D2, #FF7A00); padding: 30px; text-align: center; color: white; }
                    .header img { height: 50px; margin-bottom: 10px; }
                    .content { padding: 30px; }
                    .alert-box { background: #fff3e0; border-left: 4px solid #FF9800; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .button { display: inline-block; background: #0056D2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
                    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="${LOGO_URL}" alt="TrustFinvest Logo" />
                        <h1>Activity Alert 🔔</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <p>A new activity has occurred on your account:</p>
                        
                        <div class="alert-box">
                            <strong>Activity Type:</strong> ${activityType}<br>
                            <strong>Details:</strong> ${details}<br>
                            <strong>Time:</strong> ${new Date().toLocaleString()}
                        </div>

                        <p>If this wasn't you or you have questions, please contact our support team immediately.</p>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${FRONTEND_URL}/dashboard?tab=transactions" class="button">View Activity Log</a>
                        </div>

                        <p>Best regards,<br><strong>The TrustFinvest Security Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 TrustFinvest. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    })
};

// Email sending functions
const emailService = {
    // ... (existing functions) ...

    // Send password reset email
    sendPasswordResetEmail: async (email, userName, resetLink) => {
        try {
            const mailOptions = {
                from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
                to: email,
                ...emailTemplates.passwordReset(userName, resetLink)
            };
            
            const result = await transporter.sendMail(mailOptions);
            console.log(`[Email] Password reset email sent to ${email}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`[Email] Failed to send password reset email:`, error.message);
            return { success: false, error: error.message };
        }
    },

    // ... (rest of the functions) ...
    sendNewUserRegistration: async (email, firstName, lastName) => {
        try {
            const userName = firstName || email.split('@')[0];
            const mailOptions = {
                from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
                to: email,
                ...emailTemplates.newUserRegistration(userName, email)
            };
            
            const result = await transporter.sendMail(mailOptions);
            console.log(`[Email] New user registration email sent to ${email}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`[Email] Failed to send registration email:`, error.message);
            return { success: false, error: error.message };
        }
    },

    sendWelcomeBack: async (email, firstName, lastLogin) => {
        try {
            const userName = firstName || email.split('@')[0];
            const mailOptions = {
                from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
                to: email,
                ...emailTemplates.welcomeBack(userName, email, lastLogin)
            };
            
            const result = await transporter.sendMail(mailOptions);
            console.log(`[Email] Welcome back email sent to ${email}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`[Email] Failed to send welcome back email:`, error.message);
            return { success: false, error: error.message };
        }
    },

    sendDepositConfirmation: async (email, userName, amount, reference) => {
        try {
            const mailOptions = {
                from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
                to: email,
                ...emailTemplates.depositConfirmation(userName, amount, reference)
            };
            
            const result = await transporter.sendMail(mailOptions);
            console.log(`[Email] Deposit confirmation sent to ${email}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`[Email] Failed to send deposit email:`, error.message);
            return { success: false, error: error.message };
        }
    },

    sendInvestmentConfirmation: async (email, userName, plan, amount, roi, duration) => {
        try {
            const mailOptions = {
                from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
                to: email,
                ...emailTemplates.investmentCreated(userName, plan, amount, roi, duration)
            };
            
            const result = await transporter.sendMail(mailOptions);
            console.log(`[Email] Investment confirmation sent to ${email}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`[Email] Failed to send investment email:`, error.message);
            return { success: false, error: error.message };
        }
    },

    sendWithdrawalInitiated: async (email, userName, amount, method) => {
        try {
            const mailOptions = {
                from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
                to: email,
                ...emailTemplates.withdrawalInitiated(userName, amount, method)
            };
            
            const result = await transporter.sendMail(mailOptions);
            console.log(`[Email] Withdrawal initiated email sent to ${email}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`[Email] Failed to send withdrawal initiated email:`, error.message);
            return { success: false, error: error.message };
        }
    },

    sendWithdrawalApproved: async (email, userName, amount, method) => {
        try {
            const mailOptions = {
                from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
                to: email,
                ...emailTemplates.withdrawalApproved(userName, amount, method)
            };
            
            const result = await transporter.sendMail(mailOptions);
            console.log(`[Email] Withdrawal approved email sent to ${email}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`[Email] Failed to send withdrawal approved email:`, error.message);
            return { success: false, error: error.message };
        }
    },

    sendTaskCompleted: async (email, userName, taskTitle, reward) => {
        try {
            const mailOptions = {
                from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
                to: email,
                ...emailTemplates.taskCompleted(userName, taskTitle, reward)
            };
            
            const result = await transporter.sendMail(mailOptions);
            console.log(`[Email] Task completion email sent to ${email}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`[Email] Failed to send task completion email:`, error.message);
            return { success: false, error: error.message };
        }
    },

    sendEarningsUpdate: async (email, userName, dailyEarnings, totalEarnings, investmentCount) => {
        try {
            const mailOptions = {
                from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
                to: email,
                ...emailTemplates.earningsUpdate(userName, dailyEarnings, totalEarnings, investmentCount)
            };
            
            const result = await transporter.sendMail(mailOptions);
            console.log(`[Email] Earnings update sent to ${email}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`[Email] Failed to send earnings email:`, error.message);
            return { success: false, error: error.message };
        }
    },

    sendNewsletter: async (email, content) => {
        try {
            const mailOptions = {
                from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
                to: email,
                ...emailTemplates.newsletter(content)
            };
            
            const result = await transporter.sendMail(mailOptions);
            console.log(`[Email] Newsletter sent to ${email}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`[Email] Failed to send newsletter:`, error.message);
            return { success: false, error: error.message };
        }
    },

    sendActivityAlert: async (email, userName, activityType, details) => {
        try {
            const mailOptions = {
                from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
                to: email,
                ...emailTemplates.activityAlert(userName, activityType, details)
            };
            
            const result = await transporter.sendMail(mailOptions);
            console.log(`[Email] Activity alert sent to ${email}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`[Email] Failed to send activity alert:`, error.message);
            return { success: false, error: error.message };
        }
    }
};

module.exports = emailService;
