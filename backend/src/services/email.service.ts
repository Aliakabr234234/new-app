import nodemailer from 'nodemailer';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'apikey',
    pass: process.env.SMTP_PASS || '',
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  // In development without SMTP credentials, log instead of sending
  if (!process.env.SMTP_PASS || process.env.SMTP_PASS === 'your-sendgrid-api-key-here') {
    logger.info('📧 Email (dev mode - not actually sent):', {
      to: options.to,
      subject: options.subject,
    });
    logger.debug('Email body:', { html: options.html });
    return true;
  }

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@resourceflow.app',
      ...options,
    });
    logger.info(`📧 Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    logger.error('Failed to send email:', error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, name: string, tempPassword: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Welcome to ResourceFlow',
    html: `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #0A0C14; color: #F0F4FF; padding: 40px; border-radius: 16px;">
        <h1 style="color: #6366F1; margin-bottom: 24px;">Welcome to ResourceFlow</h1>
        <p>Hi ${name},</p>
        <p>Your account has been created. Here are your login credentials:</p>
        <div style="background: #161B2E; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 4px 0;"><strong>Temporary Password:</strong> <code style="background: #1E2340; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
        </div>
        <p>Please change your password after your first login.</p>
        <p style="color: #8892A4; font-size: 14px; margin-top: 32px;">— ResourceFlow Team</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  return sendEmail({
    to: email,
    subject: 'Reset your ResourceFlow password',
    html: `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #0A0C14; color: #F0F4FF; padding: 40px; border-radius: 16px;">
        <h1 style="color: #6366F1; margin-bottom: 24px;">Password Reset</h1>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #6366F1; color: white; padding: 12px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
            Reset Password
          </a>
        </div>
        <p style="color: #8892A4; font-size: 14px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        <p style="color: #8892A4; font-size: 14px; margin-top: 32px;">— ResourceFlow Team</p>
      </div>
    `,
  });
}

export async function sendTempPasswordEmail(email: string, name: string, tempPassword: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Your ResourceFlow password has been reset',
    html: `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #0A0C14; color: #F0F4FF; padding: 40px; border-radius: 16px;">
        <h1 style="color: #6366F1; margin-bottom: 24px;">Password Reset</h1>
        <p>Hi ${name},</p>
        <p>Your password has been reset by an administrator. Here is your new temporary password:</p>
        <div style="background: #161B2E; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Temporary Password:</strong> <code style="background: #1E2340; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
        </div>
        <p>Please change your password after logging in.</p>
        <p style="color: #8892A4; font-size: 14px; margin-top: 32px;">— ResourceFlow Team</p>
      </div>
    `,
  });
}
