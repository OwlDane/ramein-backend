"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactController = void 0;
const emailService_1 = require("../services/emailService");
const errorService_1 = require("../services/errorService");
const logger_1 = __importDefault(require("../utils/logger"));
class ContactController {
    static async submitContactForm(req, res) {
        try {
            const { name, email, subject, message } = req.body;
            if (!name || !email || !subject || !message) {
                throw new errorService_1.AppError('Semua field wajib diisi', 400);
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new errorService_1.AppError('Format email tidak valid', 400);
            }
            if (name.length < 2 || name.length > 100) {
                throw new errorService_1.AppError('Nama harus antara 2-100 karakter', 400);
            }
            if (subject.length < 5 || subject.length > 200) {
                throw new errorService_1.AppError('Subject harus antara 5-200 karakter', 400);
            }
            if (message.length < 10 || message.length > 2000) {
                throw new errorService_1.AppError('Pesan harus antara 10-2000 karakter', 400);
            }
            await (0, emailService_1.sendContactFormEmail)(name.trim(), email.trim(), subject.trim(), message.trim());
            logger_1.default.info(`Contact form submitted by ${email} - Subject: ${subject}`);
            res.status(200).json({
                success: true,
                message: 'Pesan Anda telah berhasil dikirim! Kami akan membalas dalam 1x24 jam.',
            });
        }
        catch (error) {
            logger_1.default.error('Error submitting contact form:', error);
            if (error instanceof errorService_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.',
                });
            }
        }
    }
    static async healthCheck(_req, res) {
        res.status(200).json({
            success: true,
            message: 'Contact endpoint is healthy',
            timestamp: new Date().toISOString(),
        });
    }
}
exports.ContactController = ContactController;
//# sourceMappingURL=ContactController.js.map