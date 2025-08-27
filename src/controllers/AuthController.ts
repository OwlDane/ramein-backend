import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { User, UserRole } from '../entities/User'; // pastikan UserRole di-import
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendResetPasswordEmail, sendOTPEmail } from '../services/emailService';

// Initialize database connection if not initialized
const userRepository = AppDataSource.getRepository(User);

// Helper function to generate OTP
const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to check if OTP is expired (5 minutes)
const isOTPExpired = (otpCreatedAt: Date): boolean => {
    const now = new Date();
    const diffInMinutes = (now.getTime() - otpCreatedAt.getTime()) / (1000 * 60);
    return diffInMinutes > 5;
};

export class AuthController {
    // Register new user
    static async register(req: Request, res: Response) {
        try {
            const { email, password, name, phone, address, education } = req.body;

            const existingUser = await userRepository.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email sudah terdaftar' });
            }

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).json({
                    message: 'Password harus minimal 8 karakter dan mengandung huruf besar, huruf kecil, angka, dan karakter spesial'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const verificationToken = Math.random().toString(36).substring(2, 15);
            const tokenExpiry = new Date();
            tokenExpiry.setMinutes(tokenExpiry.getMinutes() + 5);

            const user = new User();
            user.email = email;
            user.password = hashedPassword;
            user.name = name;
            user.phone = phone;
            user.address = address;
            user.education = education;
            user.verificationToken = verificationToken;
            user.tokenExpiry = tokenExpiry;

            await userRepository.save(user);
            await sendVerificationEmail(email, verificationToken);

            return res.status(201).json({
                message: 'Registrasi berhasil. Silakan cek email Anda untuk verifikasi.'
            });
        } catch (error) {
            console.error('Registration error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat registrasi' });
        }
    }

    // Verify email (existing method)
    static async verifyEmail(req: Request, res: Response) {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({ message: 'Token verifikasi diperlukan' });
            }

            const user = await userRepository.findOne({
                where: { verificationToken: token }
            });

            if (!user) {
                return res.status(400).json({ message: 'Token verifikasi tidak valid' });
            }

            if (user.isOtpVerified) {
                return res.status(400).json({ message: 'Email sudah diverifikasi sebelumnya' });
            }

            // Check if token has expired
            if (user.tokenExpiry && new Date() > user.tokenExpiry) {
                return res.status(400).json({ message: 'Token verifikasi sudah kadaluarsa' });
            }

            // Mark email as verified
            user.isOtpVerified = true;
            user.verificationToken = null;
            user.tokenExpiry = null;

            await userRepository.save(user);

            return res.json({
                message: 'Email berhasil diverifikasi. Silakan login.'
            });
        } catch (error) {
            console.error('Email verification error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat verifikasi email' });
        }
    }

    // NEW: Request OTP verification
    static async requestVerification(req: Request, res: Response) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ message: 'Email diperlukan' });
            }

            const user = await userRepository.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ message: 'User tidak ditemukan' });
            }

            // Check if already verified (using the existing field name)
            if (user.isEmailVerified || user.isOtpVerified) {
                return res.status(400).json({ message: 'Email sudah diverifikasi' });
            }

            const otp = generateOTP();
            user.otp = otp;
            user.otpCreatedAt = new Date();

            await userRepository.save(user);
            await sendOTPEmail(email, otp);

            return res.json({ 
                message: 'OTP telah dikirim ke email Anda' 
            });
        } catch (error) {
            console.error('Request verification error:', error);
            return res.status(500).json({ message: 'Gagal mengirim OTP' });
        }
    }

    // NEW: Verify OTP
    static async verifyOTP(req: Request, res: Response) {
        try {
            const { email, otp } = req.body;

            if (!email || !otp) {
                return res.status(400).json({ message: 'Email dan OTP diperlukan' });
            }

            const user = await userRepository.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ message: 'User tidak ditemukan' });
            }

            // Check if already verified
            if (user.isEmailVerified || user.isOtpVerified) {
                return res.status(400).json({ message: 'Email sudah diverifikasi' });
            }

            if (!user.otp || user.otp !== otp) {
                return res.status(400).json({ message: 'OTP tidak valid' });
            }

            if (!user.otpCreatedAt || isOTPExpired(user.otpCreatedAt)) {
                return res.status(400).json({ message: 'OTP sudah kadaluarsa' });
            }

            // Mark as verified and clear OTP data
            user.isEmailVerified = true;
            user.isOtpVerified = true;
            user.otp = null;
            user.otpCreatedAt = null;

            await userRepository.save(user);

            return res.json({ 
                message: 'Email berhasil diverifikasi' 
            });
        } catch (error) {
            console.error('Verify OTP error:', error);
            return res.status(500).json({ message: 'Gagal memverifikasi OTP' });
        }
    }

    // Request password reset
    static async requestPasswordReset(req: Request, res: Response) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ message: 'Email diperlukan' });
            }

            const user = await userRepository.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ message: 'Email tidak ditemukan' });
            }

            if (!user.isEmailVerified && !user.isOtpVerified) {
                return res.status(400).json({ message: 'Email belum diverifikasi' });
            }

            // Generate reset token
            const resetToken = Math.random().toString(36).substring(2, 15);
            const resetTokenExpiry = new Date();
            resetTokenExpiry.setMinutes(resetTokenExpiry.getMinutes() + 5);

            user.resetToken = resetToken;
            user.resetTokenExpiry = resetTokenExpiry;

            await userRepository.save(user);
            await sendResetPasswordEmail(email, resetToken);

            return res.json({
                message: 'Link reset password telah dikirim ke email Anda'
            });
        } catch (error) {
            console.error('Request password reset error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat meminta reset password' });
        }
    }

    // Reset password
    static async resetPassword(req: Request, res: Response) {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({ message: 'Token dan password baru diperlukan' });
            }

            const user = await userRepository.findOne({
                where: { resetToken: token }
            });

            if (!user) {
                return res.status(400).json({ message: 'Token reset password tidak valid' });
            }

            // Check if token has expired
            if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
                return res.status(400).json({ message: 'Token reset password sudah kadaluarsa' });
            }

            // Validate new password
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                return res.status(400).json({
                    message: 'Password harus minimal 8 karakter dan mengandung huruf besar, huruf kecil, angka, dan karakter spesial'
                });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password and clear reset token
            user.password = hashedPassword;
            user.resetToken = null;
            user.resetTokenExpiry = null;

            await userRepository.save(user);

            return res.json({
                message: 'Password berhasil direset. Silakan login dengan password baru.'
            });
        } catch (error) {
            console.error('Reset password error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat reset password' });
        }
    }

    // UPDATED: Login with verification check
    static async login(req: Request, res: Response) {
        try {
            // Initialize database connection if not initialized
            if (!AppDataSource.isInitialized) {
                await AppDataSource.initialize();
            }
            const userRepository = AppDataSource.getRepository(User);
            
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Email dan password diperlukan' });
            }

            const user = await userRepository.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({ message: 'Email atau password salah' });
            }

            // Check if email is verified (either method)
            if (!user.isEmailVerified && !user.isOtpVerified) {
                return res.status(403).json({ 
                    message: 'Silakan verifikasi email Anda terlebih dahulu',
                    requiresVerification: true 
                });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Email atau password salah' });
            }

            const token = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1d' }
            );

            return res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat login' });
        }
    }

    // Create Admin
    static async createAdmin(req: Request, res: Response) {
        try {
            const { email, password, name, phone, address, education } = req.body;

            const existingUser = await userRepository.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email sudah digunakan' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const adminUser = new User();
            adminUser.email = email;
            adminUser.password = hashedPassword;
            adminUser.name = name;
            adminUser.phone = phone;
            adminUser.address = address;
            adminUser.education = education;
            adminUser.role = UserRole.ADMIN; // ✅ pakai enum
            adminUser.isEmailVerified = true; // Admin otomatis diverifikasi
            adminUser.isOtpVerified = true; // Tambahkan ini juga

            await userRepository.save(adminUser);

            return res.status(201).json({
                message: 'Admin berhasil dibuat',
                admin: {
                    id: adminUser.id,
                    email: adminUser.email,
                    name: adminUser.name,
                    role: adminUser.role
                }
            });
        } catch (error) {
            console.error('Create admin error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat membuat admin' });
        }
    }
}