"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const database_1 = __importDefault(require("../config/database"));
const User_1 = require("../entities/User");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const emailService_1 = require("../services/emailService");
const userRepository = database_1.default.getRepository(User_1.User);
class AuthController {
    static async register(req, res) {
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
            const user = new User_1.User();
            user.email = email;
            user.password = hashedPassword;
            user.name = name;
            user.phone = phone;
            user.address = address;
            user.education = education;
            user.verificationToken = verificationToken;
            user.tokenExpiry = tokenExpiry;
            await userRepository.save(user);
            await (0, emailService_1.sendVerificationEmail)(email, verificationToken);
            return res.status(201).json({
                message: 'Registrasi berhasil. Silakan cek email Anda untuk verifikasi.'
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat registrasi' });
        }
    }
    static async verifyEmail(req, res) {
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
            if (user.isVerified) {
                return res.status(400).json({ message: 'Email sudah diverifikasi sebelumnya' });
            }
            if (user.tokenExpiry && new Date() > user.tokenExpiry) {
                return res.status(400).json({ message: 'Token verifikasi sudah kadaluarsa' });
            }
            user.isVerified = true;
            user.verificationToken = null;
            user.tokenExpiry = null;
            await userRepository.save(user);
            return res.json({
                message: 'Email berhasil diverifikasi. Silakan login.'
            });
        }
        catch (error) {
            console.error('Email verification error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat verifikasi email' });
        }
    }
    static async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ message: 'Email diperlukan' });
            }
            const user = await userRepository.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ message: 'Email tidak ditemukan' });
            }
            if (!user.isVerified) {
                return res.status(400).json({ message: 'Email belum diverifikasi' });
            }
            const resetToken = Math.random().toString(36).substring(2, 15);
            const resetTokenExpiry = new Date();
            resetTokenExpiry.setMinutes(resetTokenExpiry.getMinutes() + 5);
            user.resetToken = resetToken;
            user.resetTokenExpiry = resetTokenExpiry;
            await userRepository.save(user);
            await (0, emailService_1.sendResetPasswordEmail)(email, resetToken);
            return res.json({
                message: 'Link reset password telah dikirim ke email Anda'
            });
        }
        catch (error) {
            console.error('Request password reset error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat meminta reset password' });
        }
    }
    static async resetPassword(req, res) {
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
            if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
                return res.status(400).json({ message: 'Token reset password sudah kadaluarsa' });
            }
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                return res.status(400).json({
                    message: 'Password harus minimal 8 karakter dan mengandung huruf besar, huruf kecil, angka, dan karakter spesial'
                });
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            user.resetToken = null;
            user.resetTokenExpiry = null;
            await userRepository.save(user);
            return res.json({
                message: 'Password berhasil direset. Silakan login dengan password baru.'
            });
        }
        catch (error) {
            console.error('Reset password error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat reset password' });
        }
    }
    static async login(req, res) {
        try {
            if (!database_1.default.isInitialized) {
                await database_1.default.initialize();
            }
            const userRepository = database_1.default.getRepository(User_1.User);
            const { email, password } = req.body;
            const user = await userRepository.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({ message: 'Email atau password salah' });
            }
            if (!user.isVerified) {
                return res.status(401).json({ message: 'Email belum diverifikasi' });
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Email atau password salah' });
            }
            const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1d' });
            return res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            });
        }
        catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat login' });
        }
    }
    static async createAdmin(req, res) {
        try {
            const { email, password, name, phone, address, education } = req.body;
            const existingUser = await userRepository.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email sudah digunakan' });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const adminUser = new User_1.User();
            adminUser.email = email;
            adminUser.password = hashedPassword;
            adminUser.name = name;
            adminUser.phone = phone;
            adminUser.address = address;
            adminUser.education = education;
            adminUser.role = User_1.UserRole.ADMIN;
            adminUser.isVerified = true;
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
        }
        catch (error) {
            console.error('Create admin error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat membuat admin' });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map