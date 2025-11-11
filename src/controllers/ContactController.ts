import { Request, Response } from 'express';
import { sendContactFormEmail } from '../services/emailService';
import { AppError } from '../services/errorService';
import logger from '../utils/logger';

export class ContactController {
  /**
   * Submit contact form
   * POST /api/contact
   */
  static async submitContactForm(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, subject, message } = req.body;

      // Validation
      if (!name || !email || !subject || !message) {
        throw new AppError('Semua field wajib diisi', 400);
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new AppError('Format email tidak valid', 400);
      }

      // Length validation
      if (name.length < 2 || name.length > 100) {
        throw new AppError('Nama harus antara 2-100 karakter', 400);
      }

      if (subject.length < 5 || subject.length > 200) {
        throw new AppError('Subject harus antara 5-200 karakter', 400);
      }

      if (message.length < 10 || message.length > 2000) {
        throw new AppError('Pesan harus antara 10-2000 karakter', 400);
      }

      // Send email
      await sendContactFormEmail(
        name.trim(),
        email.trim(),
        subject.trim(),
        message.trim()
      );

      logger.info(`Contact form submitted by ${email} - Subject: ${subject}`);

      res.status(200).json({
        success: true,
        message: 'Pesan Anda telah berhasil dikirim! Kami akan membalas dalam 1x24 jam.',
      });
    } catch (error) {
      logger.error('Error submitting contact form:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.',
        });
      }
    }
  }

  /**
   * Health check for contact endpoint
   * GET /api/contact/health
   */
  static async healthCheck(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Contact endpoint is healthy',
      timestamp: new Date().toISOString(),
    });
  }
}
