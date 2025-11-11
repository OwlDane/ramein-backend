"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendContactFormEmail = exports.sendOTPEmail = exports.sendEventRegistrationEmail = exports.sendResetPasswordEmail = exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const errorService_1 = require("./errorService");
const googleapis_1 = require("googleapis");
function createTransporter() {
    const useOAuth2 = String(process.env.SMTP_USE_OAUTH2 || 'false').toLowerCase() === 'true';
    if (useOAuth2) {
        const clientId = process.env.SMTP_OAUTH_CLIENT_ID || '';
        const clientSecret = process.env.SMTP_OAUTH_CLIENT_SECRET || '';
        const refreshToken = process.env.SMTP_OAUTH_REFRESH_TOKEN || '';
        const userEmail = process.env.SMTP_USER || process.env.EMAIL_USER || '';
        const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        return nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: userEmail,
                clientId,
                clientSecret,
                refreshToken,
            },
        });
    }
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const basicUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const basicPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    if (smtpHost) {
        return nodemailer_1.default.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: false,
            auth: basicUser && basicPass ? { user: basicUser, pass: basicPass } : undefined,
        });
    }
    return nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: basicUser,
            pass: basicPass,
        },
    });
}
const transporter = createTransporter();
(async () => {
    try {
        await transporter.verify();
        console.log('[mail] transporter verified (OAuth2:', String(process.env.SMTP_USE_OAUTH2 || 'false'), ')');
    }
    catch (err) {
        console.error('[mail] transporter verify failed:', err);
    }
})();
const sendVerificationEmail = async (email, token) => {
    try {
        const mailOptions = {
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
        await transporter.sendMail(mailOptions);
    }
    catch (error) {
        console.error('SMTP error sendVerificationEmail:', error);
        throw new errorService_1.AppError('Gagal mengirim email verifikasi', 500);
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendResetPasswordEmail = async (email, token) => {
    try {
        const mailOptions = {
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
    }
    catch (error) {
        throw new errorService_1.AppError('Gagal mengirim email reset password', 500);
    }
};
exports.sendResetPasswordEmail = sendResetPasswordEmail;
const sendEventRegistrationEmail = async (email, eventTitle, tokenNumber) => {
    try {
        const mailOptions = {
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
    }
    catch (error) {
        throw new errorService_1.AppError('Gagal mengirim email konfirmasi pendaftaran', 500);
    }
};
exports.sendEventRegistrationEmail = sendEventRegistrationEmail;
const sendOTPEmail = async (email, otp) => {
    try {
        const mailOptions = {
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
            console.log('[mail][dev] OTP sent (fallback log):', email, otp);
        }
    }
    catch (error) {
        console.error('SMTP error sendOTPEmail:', error);
        throw new errorService_1.AppError('Failed to send OTP email', 500);
    }
};
exports.sendOTPEmail = sendOTPEmail;
const sendContactFormEmail = async (name, email, subject, message) => {
    try {
        const adminEmail = process.env.EMAIL_USER;
        const adminMailOptions = {
            from: process.env.SMTP_USER,
            to: adminEmail,
            replyTo: email,
            subject: `[Contact Form] ${subject}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">Pesan Baru dari Contact Form</h2>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
            <p style="margin: 8px 0;"><strong>Dari:</strong> ${name}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #4F46E5;">${email}</a></p>
            <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #ffffff; border-left: 4px solid #4F46E5;">
            <h3 style="color: #333; margin-top: 0;">Pesan:</h3>
            <p style="color: #555; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px;">
            <p>Email ini dikirim otomatis dari website Ramein pada ${new Date().toLocaleString('id-ID')}</p>
            <p>Untuk membalas pesan ini, klik reply atau kirim email langsung ke: ${email}</p>
          </div>
        </div>
      `,
        };
        const userMailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Terima kasih telah menghubungi Ramein',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">Terima Kasih telah Menghubungi Kami!</h2>
          
          <p style="color: #555; line-height: 1.6;">Halo <strong>${name}</strong>,</p>
          
          <p style="color: #555; line-height: 1.6;">
            Terima kasih telah menghubungi Ramein. Kami telah menerima pesan Anda dan akan segera merespons dalam waktu 1x24 jam.
          </p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
            <h3 style="color: #333; margin-top: 0;">Ringkasan Pesan Anda:</h3>
            <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 8px 0;"><strong>Pesan:</strong></p>
            <p style="color: #555; line-height: 1.6; white-space: pre-wrap; padding: 10px; background-color: #fff; border-left: 3px solid #4F46E5;">${message}</p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Jika Anda memiliki pertanyaan lebih lanjut, jangan ragu untuk menghubungi kami kembali.
          </p>
          
          <div style="margin-top: 30px; padding: 20px; background-color: #f0f4ff; border-radius: 6px; text-align: center;">
            <p style="margin: 0; color: #4F46E5; font-weight: bold;">Tim Ramein</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">Event Management System</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px; text-align: center;">
            <p>Email ini dikirim otomatis, mohon tidak membalas email ini.</p>
          </div>
        </div>
      `,
        };
        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(userMailOptions);
        if ((process.env.NODE_ENV || 'development') !== 'production') {
            console.log('[mail][dev] Contact form email sent to:', adminEmail, 'from:', email);
        }
    }
    catch (error) {
        console.error('SMTP error sendContactFormEmail:', error);
        throw new errorService_1.AppError('Gagal mengirim email contact form', 500);
    }
};
exports.sendContactFormEmail = sendContactFormEmail;
//# sourceMappingURL=emailService.js.map