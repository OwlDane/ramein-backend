import nodemailer from 'nodemailer';
import { AppError } from './errorService';
import { google } from 'googleapis';

// Build transporter with either OAuth2 or basic SMTP based on env
function createTransporter() {
  const useOAuth2 = String(process.env.SMTP_USE_OAUTH2 || 'false').toLowerCase() === 'true';

  if (useOAuth2) {
    const clientId = process.env.SMTP_OAUTH_CLIENT_ID || '';
    const clientSecret = process.env.SMTP_OAUTH_CLIENT_SECRET || '';
    const refreshToken = process.env.SMTP_OAUTH_REFRESH_TOKEN || '';
    const userEmail = process.env.SMTP_USER || process.env.EMAIL_USER || '';

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: userEmail,
        clientId,
        clientSecret,
        refreshToken,
        // accessToken will be fetched dynamically per send using getAccessToken
      },
    } as any);
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const basicUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const basicPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  // If explicit SMTP host provided, use it.
  if (smtpHost) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: basicUser && basicPass ? { user: basicUser, pass: basicPass } : undefined,
    } as any);
  }

  // Simple mode: fall back to Gmail service using EMAIL_USER/EMAIL_PASS
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: basicUser,
      pass: basicPass,
    },
  } as any);
}

const transporter = createTransporter();

// Optional: verify transporter on startup
(async () => {
  try {
    await transporter.verify();
    // eslint-disable-next-line no-console
    console.log('[mail] transporter verified (OAuth2:', String(process.env.SMTP_USE_OAUTH2 || 'false'), ')');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[mail] transporter verify failed:', err);
  }
})();

export const sendVerificationEmail = async (email: string, token: string) => {
  try {
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Verifikasi Email Anda',
      html: `
        <h1>Verifikasi Email</h1>
        <p>Silakan klik link di bawah ini untuk memverifikasi email Anda:</p>
        <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}">
          Verifikasi Email
        </a>
        <p>Link ini akan kadaluarsa dalam 5 menit.</p>
      `,
    };
    // For OAuth2, fetch an access token implicitly via nodemailer
    await transporter.sendMail(mailOptions);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('SMTP error sendVerificationEmail:', error);
    throw new AppError('Gagal mengirim email verifikasi', 500);
  }
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  try {
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Reset Password',
      html: `
        <h1>Reset Password</h1>
        <p>Silakan klik link di bawah ini untuk mereset password Anda:</p>
        <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}">
          Reset Password
        </a>
        <p>Link ini akan kadaluarsa dalam 5 menit.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new AppError('Gagal mengirim email reset password', 500);
  }
};

export const sendEventRegistrationEmail = async (
  email: string,
  eventTitle: string,
  tokenNumber: string
) => {
  try {
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: `Pendaftaran Event: ${eventTitle}`,
      html: `
        <h1>Pendaftaran Event Berhasil</h1>
        <p>Terima kasih telah mendaftar untuk event "${eventTitle}".</p>
        <p>Berikut adalah token kehadiran Anda:</p>
        <h2>${tokenNumber}</h2>
        <p>Simpan token ini baik-baik, Anda akan membutuhkannya untuk mengisi daftar hadir saat event berlangsung.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new AppError('Gagal mengirim email konfirmasi pendaftaran', 500);
  }

};

// src/services/emailService.ts
export const sendOTPEmail = async (email: string, otp: string) => {
  try {
    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Your Verification Code',
      html: `
        <h1>Verification Code</h1>
        <p>Your verification code is:</p>
        <h2>${otp}</h2>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };
    await transporter.sendMail(mailOptions);
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[mail][dev] OTP sent (fallback log):', email, otp);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('SMTP error sendOTPEmail:', error);
    throw new AppError('Failed to send OTP email', 500);
  }
};
