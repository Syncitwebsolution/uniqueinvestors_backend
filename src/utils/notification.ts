import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from './logger.js';

// Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp.ethereal.email', // Fallback for testing if missing
  port: env.SMTP_PORT || 587,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

/**
 * Send an email containing the new user's credentials
 */
export const sendWelcomeEmail = async (toEmail: string, name: string, userId: string, rawPassword: string): Promise<boolean> => {
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    logger.warn(`[Notification] SMTP not fully configured. MOCK EMAIL SENT.
    To: ${toEmail}
    Credentials: SystemID=${userId} | Password=${rawPassword}`);
    return true; // We return true to not break flow during dev
  }

  try {
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #2b74b1;">Welcome to Unique Investors Platform</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>An administrator has successfully enrolled you in the Unique Investors system. You can now login using the credentials below:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px;"><strong>System User ID:</strong> ${userId}</p>
          <p style="margin: 10px 0 0; font-size: 16px;"><strong>Temporary Password:</strong> ${rawPassword}</p>
        </div>
        
        <p><em>Please make sure to change your password immediately upon your first login for security reasons.</em></p>
        
        <p style="margin-top: 30px; font-size: 14px; color: #777;">Regards,<br>Unique Investors Team</p>
      </div>
    `;

    await transporter.sendMail({
      from: env.SMTP_FROM_EMAIL || '"Unique Investors" <noreply@uniqueinvestors.com>',
      to: toEmail,
      subject: 'Your Account Credentials - Unique Investors',
      html: htmlTemplate,
    });

    logger.info(`[Notification] Welcome email successfully sent to ${toEmail}`);
    return true;
  } catch (error) {
    logger.error(`[Notification] Failed to send welcome email to ${toEmail}:`, error);
    return false;
  }
};

/**
 * Send a welcome SMS. Uses a mock logger if real API is not configured.
 * @param mobile - The mobile number
 * @param name - First name of the user
 */
export const sendWelcomeSMS = async (mobile: string, name: string): Promise<boolean> => {
  const messageBody = `Welcome ${name}! You have been registered on Unique Investors. Your joining details have been sent to your email. Please login using your portal ID.`;

  if (!env.SMS_API_KEY) {
    logger.warn(`[Notification] SMS_API_KEY is missing. MOCK SMS SENT.
    To: ${mobile}
    Message: ${messageBody}`);
    return true;
  }

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': env.SMS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: 'q',
        message: messageBody,
        numbers: mobile,
        flash: 0
      })
    });

    const data = await response.json();
    if (!response.ok || !data.return) {
      throw new Error(data.message || 'SMS API rejected the request');
    }

    logger.info(`[Notification] Welcome SMS successfully dispatched to ${mobile} via Fast2SMS.`);
    return true;
  } catch (error) {
    logger.error(`[Notification] Failed to send SMS to ${mobile}:`, error);
    return false;
  }
};
