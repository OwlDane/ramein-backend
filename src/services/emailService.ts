import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { AppError } from './errorService';

// Initialize email service (Resend for production, Nodemailer for dev)
const useResend = process.env.USE_RESEND === 'true';
const resend = useResend ? new Resend(process.env.RESEND_API_KEY) : null;

// Fallback nodemailer for development
let transporter: any = null;
if (!useResend) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Verify transporter on startup
  (async () => {
    try {
      await transporter.verify();
      console.log('[mail] Nodemailer ready (development mode)');
    } catch (err) {
      console.error('[mail] Nodemailer verify failed:', err);
    }
  })();
} else {
  console.log('[mail] Resend initialized (production mode)');
}

// Helper function to send email
async function sendEmail(to: string, subject: string, html: string) {
  if (useResend && resend) {
    // Use Resend (production)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    try {
      await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
      });
      console.log(`[mail] Sent via Resend to ${to}`);
    } catch (error) {
      console.error('[mail] Resend error:', error);
      throw new AppError('Gagal mengirim email', 500);
    }
  } else if (transporter) {
    // Use Nodemailer (development)
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
      });
      console.log(`[mail] Sent via Nodemailer to ${to}`);
    } catch (error) {
      console.error('[mail] Nodemailer error:', error);
      throw new AppError('Gagal mengirim email', 500);
    }
  } else {
    throw new AppError('Email service not configured', 500);
  }
}

export const sendVerificationEmail = async (email: string, token: string) => {
  const html = `
    <h1>Verifikasi Email</h1>
    <p>Silakan klik link di bawah ini untuk memverifikasi email Anda:</p>
    <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}">
      Verifikasi Email
    </a>
    <p>Link ini akan kadaluarsa dalam 5 menit.</p>
  `;
  
  await sendEmail(email, 'Verifikasi Email Anda', html);
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
