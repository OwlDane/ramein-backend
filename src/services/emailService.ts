import nodemailer from 'nodemailer';
import { AppError } from './errorService';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (email: string, token: string) => {
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
  } catch (error) {
    throw new AppError('Gagal mengirim email verifikasi', 500);
  }
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
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
  } catch (error) {
    throw new AppError('Gagal mengirim email konfirmasi pendaftaran', 500);
  }
};
