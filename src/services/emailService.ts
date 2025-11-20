import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { AppError } from './errorService';

// Initialize email service (Resend for production, Nodemailer for dev)
const useResend = process.env.USE_RESEND === 'true';
const resend = useResend ? new Resend(process.env.RESEND_API_KEY) : null;

// Gmail SMTP transporter
let transporter: any = null;
if (!useResend) {
  // Check if credentials are available
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('[mail] ❌ Gmail credentials not found. Please set EMAIL_USER and EMAIL_PASS environment variables.');
    console.error('[mail] ℹ️  For Gmail, you need to use an App Password, not your regular password.');
  } else {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465, // Use port 465 (SSL) instead of 587 (STARTTLS) for Railway
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      pool: true, // Use connection pooling for better performance
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000, // 1 second
      rateLimit: 5 // Max 5 emails per second
    });

    // Verify transporter on startup
    (async () => {
      try {
        await transporter.verify();
        const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
        console.log(`[mail] ✅ Gmail SMTP ready (${mode} mode)`);
        console.log(`[mail] 📧 Sending from: ${process.env.EMAIL_USER}`);
      } catch (err) {
        console.error('[mail] ❌ Gmail SMTP verify failed:', err);
        console.error('[mail] 💡 Make sure you are using Gmail App Password, not regular password');
        console.error('[mail] 📖 How to get App Password: https://support.google.com/accounts/answer/185833');
      }
    })();
  }
} else {
  console.log('[mail] ✅ Resend initialized (production mode)');
}

// Helper function to send email with timeout
async function sendEmail(to: string, subject: string, html: string) {
  console.log(`[mail] Attempting to send email to: ${to}, subject: ${subject}`);
  console.log(`[mail] Using Resend: ${useResend}, Has transporter: ${!!transporter}`);
  
  if (useResend && resend) {
    // Use Resend (production)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    try {
      console.log(`[mail] Sending via Resend from: ${fromEmail}`);
      const result = await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
      });
      console.log(`[mail] ✅ Sent via Resend to ${to}`, result);
    } catch (error) {
      console.error('[mail] ❌ Resend error:', error);
      throw new AppError(`Gagal mengirim email via Resend: ${error}`, 500);
    }
  } else if (transporter) {
    // Use Nodemailer with timeout
    try {
      console.log(`[mail] Sending via Nodemailer from: ${process.env.EMAIL_USER}`);
      
      // Add timeout wrapper (10 seconds max)
      const sendPromise = transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email timeout after 10 seconds')), 10000)
      );
      
      const result = await Promise.race([sendPromise, timeoutPromise]);
      console.log(`[mail] ✅ Sent via Nodemailer to ${to}`, result.messageId);
    } catch (error) {
      console.error('[mail] ❌ Nodemailer error:', error);
      console.error('[mail] Nodemailer error details:', {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });
      
      // Don't throw error, just log it - allow registration to continue
      console.warn('[mail] ⚠️ Email sending failed, but registration will continue');
      console.warn('[mail] 💡 User can request verification email resend later');
    }
  } else {
    const errorMsg = 'Email service not configured. Please check USE_RESEND, RESEND_API_KEY, EMAIL_USER, and EMAIL_PASS environment variables.';
    console.error(`[mail] ❌ ${errorMsg}`);
    // Don't throw error in production, just log it
    console.warn('[mail] ⚠️ Email service not available, registration will continue without email');
  }
}

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Verifikasi Email - Ramein</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Selamat Datang di Ramein!</h1>
            </div>
            <div class="content">
                <h2>Verifikasi Email Anda</h2>
                <p>Terima kasih telah mendaftar di Ramein Event Management System!</p>
                <p>Untuk melengkapi proses registrasi, silakan klik tombol di bawah ini untuk memverifikasi email Anda:</p>
                
                <div style="text-align: center;">
                    <a href="${verificationUrl}" class="button">Verifikasi Email Saya</a>
                </div>
                
                <p>Atau copy dan paste link berikut ke browser Anda:</p>
                <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 3px;">
                    ${verificationUrl}
                </p>
                
                <p><strong>⚠️ Penting:</strong> Link verifikasi ini akan kadaluarsa dalam <strong>5 menit</strong>.</p>
                <p>Jika Anda tidak mendaftar di Ramein, silakan abaikan email ini.</p>
            </div>
            <div class="footer">
                <p>© 2024 Ramein Event Management System</p>
                <p>Email ini dikirim secara otomatis, mohon jangan membalas.</p>
            </div>
        </div>
    </body>
    </html>
  `;
  
  console.log(`[mail] Sending verification email to ${email} with URL: ${verificationUrl}`);
  await sendEmail(email, '🔐 Verifikasi Email Anda - Ramein', html);
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const html = `
    <h1>Reset Password</h1>
    <p>Silakan klik link di bawah ini untuk mereset password Anda:</p>
    <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}">
      Reset Password
    </a>
    <p>Link ini akan kadaluarsa dalam 5 menit.</p>
  `;
  
  await sendEmail(email, 'Reset Password', html);
};

export const sendEventRegistrationEmail = async (
  email: string,
  eventTitle: string,
  tokenNumber: string
) => {
  const html = `
    <h1>Pendaftaran Event Berhasil</h1>
    <p>Terima kasih telah mendaftar untuk event "${eventTitle}".</p>
    <p>Berikut adalah token kehadiran Anda:</p>
    <h2>${tokenNumber}</h2>
    <p>Simpan token ini baik-baik, Anda akan membutuhkannya untuk mengisi daftar hadir saat event berlangsung.</p>
  `;
  
  await sendEmail(email, `Pendaftaran Event: ${eventTitle}`, html);
};

export const sendOTPEmail = async (email: string, otp: string) => {
  const html = `
    <h1>Verification Code</h1>
    <p>Your verification code is:</p>
    <h2>${otp}</h2>
    <p>This code will expire in 5 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  
  await sendEmail(email, 'Your Verification Code', html);
  
  if ((process.env.NODE_ENV || 'development') !== 'production') {
    console.log('[mail][dev] OTP sent:', email, otp);
  }
};

export const sendContactFormEmail = async (
  name: string,
  email: string,
  subject: string,
  message: string
) => {
  const adminEmail = process.env.EMAIL_USER;
  
  // Email to admin
  const adminHtml = `
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
        <p>Untuk membalas pesan ini, kirim email langsung ke: ${email}</p>
      </div>
    </div>
  `;

  // Email confirmation to sender
  const userHtml = `
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
      <div style="margin-top: 30px; padding: 20px; background-color: #f0f4ff; border-radius: 6px; text-align: center;">
        <p style="margin: 0; color: #4F46E5; font-weight: bold;">Tim Ramein</p>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">Event Management System</p>
      </div>
    </div>
  `;

  // Send both emails
  await sendEmail(adminEmail || '', `[Contact Form] ${subject}`, adminHtml);
  await sendEmail(email, 'Terima kasih telah menghubungi Ramein', userHtml);
  
  if ((process.env.NODE_ENV || 'development') !== 'production') {
    console.log('[mail][dev] Contact form email sent to:', adminEmail, 'from:', email);
  }
};
