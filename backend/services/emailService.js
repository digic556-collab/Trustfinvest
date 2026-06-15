const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter with Hostinger SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    },
    logger: process.env.ENABLE_EMAIL_LOGS === 'true',
    debug: process.env.NODE_ENV === 'development'
});

// Verify connection
transporter.verify((error, success) => {
    if (error) {
        console.error('[Email Service] SMTP Connection Error:', error);
    } else {
        console.log('[Email Service] SMTP Server Ready - info@trustfinvest.com');
    }
});

// Email templates
const emailTemplates = {
    welcome: (userName) => ({
        subject: '🎉 Welcome to TrustFinvest - Start Your Investment Journey',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
                    .header { background: linear-gradient(135deg, #0056D2, #FF7A00); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
                    .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
                    .button { display: inline-block; background: #0056D2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome, ${userName}! 🚀</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${userName},</p>
                        <p>Thank you for joining <strong>TrustFinvest</strong> - Your trusted investment platform!</p>
                        <p>We're excited to have you on board. Start your investment journey today:</p>
                        <ul>
                            <li>Explore our investment plans (5.00% - 15.00% ROI)</li>
                            <li>Deposit funds securely</li>
                            <li>Earn daily returns</li>
                            <li>Participate in daily tasks for bonus earnings</li>
                        </ul>
                        <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Start Investing Now</a>
                        <p>If you have any questions, feel free to contact our support team.</p>
                        <p>Best regards,<br><strong>TrustFinvest Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 TrustFinvest. All rights reserved.</p>
                        <p>This email was sent because you registered on TrustFinvest</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    newsletter: (content) => ({
        subject: `📰 TrustFinvest Newsletter - ${new Date().toLocaleDateString()}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
                    .header { background: linear-gradient(135deg, #0056D2, #FF7A00); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
                    .content { background: white; padding: 30px; }
                    .news-item { background: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #0056D2; border-radius: 4px; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; border-radius: 0 0 8px 8px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>📰 TrustFinvest Newsletter</h2>
                    </div>
                    <div class="content">
                        <p>Dear Investor,</p>
                        <p>Here's your latest TrustFinvest newsletter:</p>
                        ${content}
                        <p style="margin-top: 30px; color: #666; font-size: 14px;">
                            <strong>📊 Market Update:</strong> Track your investments in real-time from your dashboard.
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 TrustFinvest. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    activityNotification: (userName, activity) => ({
        subject: `🔔 Activity Alert - ${activity.type} from TrustFinvest`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
                    .header { background: linear-gradient(135deg, #0056D2, #FF7A00); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
                    .content { background: white; padding: 30px; }
                    .activity-card { background: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .activity-card strong { color: #0056D2; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; border-radius: 0 0 8px 8px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🔔 Activity Notification</h2>
                    </div>
                    <div class="content">
                        <p>Hello ${userName},</p>
                        <p>We wanted to notify you about a recent activity on your account:</p>
                        <div class="activity-card">
                            <p><strong>Activity Type:</strong> ${activity.type}</p>
                            <p><strong>Description:</strong> ${activity.description}</p>
                            <p><strong>Amount:</strong> $${activity.amount || 0}</p>
                            <p><strong>Status:</strong> ${activity.status}</p>
                            <p><strong>Date:</strong> ${new Date(activity.date).toLocaleString()}</p>
                        </div>
                        <p>If you didn't authorize this activity, please contact our support team immediately.</p>
                        <p style="color: #666; font-size: 14px; margin-top: 30px;">
                            View your full activity history in the <a href="${process.env.FRONTEND_URL}/dashboard">Dashboard</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 TrustFinvest. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    investmentAlert: (userName, investment) => ({
        subject: `💰 Investment Confirmation - TrustFinvest`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
                    .header { background: linear-gradient(135deg, #0056D2, #FF7A00); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
                    .content { background: white; padding: 30px; }
                    .investment-details { background: #f0f7ff; border-left: 4px solid #0056D2; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .investment-details p { margin: 8px 0; }
                    .investment-details strong { color: #0056D2; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; border-radius: 0 0 8px 8px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>💰 Investment Confirmed</h2>
                    </div>
                    <div class="content">
                        <p>Hello ${userName},</p>
                        <p>Your investment has been successfully processed! Here are the details:</p>
                        <div class="investment-details">
                            <p><strong>Plan:</strong> ${investment.plan}</p>
                            <p><strong>Amount:</strong> $${investment.amount}</p>
                            <p><strong>ROI:</strong> ${investment.roi}%</p>
                            <p><strong>Duration:</strong> ${investment.duration} days</p>
                            <p><strong>Maturity Date:</strong> ${new Date(investment.maturityDate).toLocaleDateString()}</p>
                            <p><strong>Investment ID:</strong> ${investment.id}</p>
                        </div>
                        <p>Congratulations! You're now earning returns on your investment. Check your dashboard for real-time updates.</p>
                        <p style="color: #666; font-size: 14px; margin-top: 30px;">
                            Monitor your investment growth in your <a href="${process.env.FRONTEND_URL}/dashboard">Dashboard</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 TrustFinvest. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    withdrawalAlert: (userName, withdrawal) => ({
        subject: `💳 Withdrawal Request - TrustFinvest`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
                    .header { background: linear-gradient(135deg, #0056D2, #FF7A00); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
                    .content { background: white; padding: 30px; }
                    .withdrawal-details { background: #fff9e6; border-left: 4px solid #FF7A00; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .withdrawal-details p { margin: 8px 0; }
                    .withdrawal-details strong { color: #FF7A00; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; border-radius: 0 0 8px 8px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>💳 Withdrawal Processed</h2>
                    </div>
                    <div class="content">
                        <p>Hello ${userName},</p>
                        <p>Your withdrawal request has been processed. Here are the details:</p>
                        <div class="withdrawal-details">
                            <p><strong>Amount:</strong> $${withdrawal.amount}</p>
                            <p><strong>Method:</strong> ${withdrawal.method}</p>
                            <p><strong>Status:</strong> ${withdrawal.status}</p>
                            <p><strong>Estimated Time:</strong> ${withdrawal.estimatedTime}</p>
                            <p><strong>Transaction ID:</strong> ${withdrawal.id}</p>
                        </div>
                        <p>Your funds should arrive in your account within the estimated time. Transaction fees (if any) have been deducted.</p>
                        <p style="color: #666; font-size: 14px; margin-top: 30px;">
                            Track your withdrawal in your <a href="${process.env.FRONTEND_URL}/dashboard">Dashboard</a>
                        </p>
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

// Send email function
const sendEmail = async (to, template, data = {}) => {
    try {
        const mailOptions = {
            from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
            to: to,
            ...template(data)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Email sent successfully to ${to}:`, info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[Email Service] Error sending email to ${to}:`, error);
        return { success: false, error: error.message };
    }
};

// Export functions
module.exports = {
    sendEmail,
    emailTemplates,
    transporter
};
