import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP connection
export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✓ Gmail SMTP connection verified');
    return true;
  } catch (error) {
    console.error('✗ Gmail SMTP connection failed:', error.message);
    return false;
  }
};

/**
 * Send OTP email for registration
 */
export const sendSignupOTP = async (email, fullName, otp) => {
  const mailOptions = {
    from: `"RAS Currys" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Email - RAS Currys Registration',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍛 RAS Currys</h1>
            <p>Welcome to Our Platform!</p>
          </div>
          <div class="content">
            <h2>Hello ${fullName}! 👋</h2>
            <p>Thank you for registering with RAS Currys. To complete your registration, please verify your email address using the OTP below:</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your OTP Code</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Valid for 10 minutes</p>
            </div>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0;">
                <li>Never share this OTP with anyone</li>
                <li>RAS Currys will never ask for your OTP via phone or email</li>
                <li>This code expires in 10 minutes</li>
              </ul>
            </div>

            <p>If you didn't request this registration, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 RAS Currys. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Signup OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Failed to send signup OTP email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP email for password reset
 */
export const sendPasswordResetOTP = async (email, fullName, otp) => {
  const mailOptions = {
    from: `"RAS Currys Security" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Reset Request - RAS Currys',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #f5576c; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #f5576c; letter-spacing: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .alert { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
            <p>RAS Currys Security</p>
          </div>
          <div class="content">
            <h2>Hello ${fullName},</h2>
            <p>We received a request to reset your password. Use the OTP below to proceed:</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Password Reset OTP</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Expires in 10 minutes</p>
            </div>

            <div class="alert">
              <strong>🚨 Important:</strong>
              <ul style="margin: 10px 0;">
                <li>If you didn't request this, please ignore this email and secure your account</li>
                <li>Never share this OTP with anyone</li>
                <li>Change your password immediately after reset</li>
              </ul>
            </div>

            <p>After using this OTP, you'll be able to set a new password for your account.</p>
          </div>
          <div class="footer">
            <p>© 2024 RAS Currys. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Password reset OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Failed to send password reset OTP email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email after successful verification
 */
export const sendWelcomeEmail = async (email, fullName) => {
  const mailOptions = {
    from: `"RAS Currys" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Welcome to RAS Currys! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍛 Welcome to RAS Currys!</h1>
          </div>
          <div class="content">
            <h2>Hello ${fullName}! 🎉</h2>
            <p>Your email has been successfully verified. Welcome to the RAS Currys family!</p>
            <p>You can now enjoy:</p>
            <ul>
              <li>✓ Browse our authentic Indian curry selection</li>
              <li>✓ Place orders with secure payment</li>
              <li>✓ Track your deliveries in real-time</li>
              <li>✓ Exclusive member offers and discounts</li>
            </ul>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}" class="button">Start Shopping</a>
            </div>
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
          <div class="footer">
            <p>© 2024 RAS Currys. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
};

export default transporter;
