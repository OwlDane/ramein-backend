"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const User_1 = require("../entities/User");
const logger_1 = __importDefault(require("../utils/logger"));
const sessionTimeout_1 = require("../middlewares/sessionTimeout");
const userRepository = database_1.default.getRepository(User_1.User);
class AdminAuthController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    message: 'Email dan password harus diisi'
                });
                return;
            }
            const admin = await userRepository.findOne({
                where: {
                    email: email.toLowerCase(),
                    role: User_1.UserRole.ADMIN
                }
            });
            if (!admin) {
                logger_1.default.warn(`Admin login attempt with non-admin email: ${email}`);
                res.status(401).json({
                    message: 'Kredensial admin tidak valid'
                });
                return;
            }
            if (!admin.isVerified || !admin.isEmailVerified) {
                res.status(401).json({
                    message: 'Akun admin belum terverifikasi'
                });
                return;
            }
            const isPasswordValid = await bcryptjs_1.default.compare(password, admin.password);
            if (!isPasswordValid) {
                logger_1.default.warn(`Admin login attempt with invalid password for email: ${email}`);
                res.status(401).json({
                    message: 'Kredensial admin tidak valid'
                });
                return;
            }
            const adminToken = jsonwebtoken_1.default.sign({
                id: admin.id,
                email: admin.email,
                role: 'ADMIN',
                isAdmin: true,
                loginTime: new Date().toISOString()
            }, process.env.JWT_SECRET || 'fallback-secret', {
                expiresIn: '5m',
                issuer: 'ramein-admin'
            });
            (0, sessionTimeout_1.createOrUpdateSession)(adminToken, admin.id);
            logger_1.default.info(`Admin login successful: ${admin.email}`);
            res.json({
                message: 'Login admin berhasil',
                token: adminToken,
                admin: {
                    id: admin.id,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role,
                    isAdmin: true
                }
            });
        }
        catch (error) {
            logger_1.default.error('Admin login error:', error);
            res.status(500).json({
                message: 'Terjadi kesalahan saat login admin'
            });
        }
    }
    static async logout(req, res) {
        var _a, _b;
        try {
            const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
            if (token) {
                (0, sessionTimeout_1.removeSession)(token);
            }
            logger_1.default.info(`Admin logout: ${(_b = req.user) === null || _b === void 0 ? void 0 : _b.email}`);
            res.json({
                message: 'Logout admin berhasil'
            });
        }
        catch (error) {
            logger_1.default.error('Admin logout error:', error);
            res.status(500).json({
                message: 'Terjadi kesalahan saat logout admin'
            });
        }
    }
    static async getProfile(req, res) {
        var _a;
        try {
            const admin = await userRepository.findOne({
                where: { id: (_a = req.adminUser) === null || _a === void 0 ? void 0 : _a.id },
                select: ['id', 'email', 'name', 'role', 'isVerified', 'isEmailVerified', 'createdAt']
            });
            if (!admin) {
                res.status(404).json({
                    message: 'Admin tidak ditemukan'
                });
                return;
            }
            res.json({
                admin: {
                    ...admin,
                    isAdmin: true
                }
            });
        }
        catch (error) {
            logger_1.default.error('Get admin profile error:', error);
            res.status(500).json({
                message: 'Terjadi kesalahan saat mengambil profil admin'
            });
        }
    }
    static async verifySession(req, res) {
        var _a, _b, _c, _d;
        try {
            res.json({
                valid: true,
                admin: {
                    id: (_a = req.adminUser) === null || _a === void 0 ? void 0 : _a.id,
                    email: (_b = req.adminUser) === null || _b === void 0 ? void 0 : _b.email,
                    name: (_c = req.adminUser) === null || _c === void 0 ? void 0 : _c.name,
                    role: (_d = req.adminUser) === null || _d === void 0 ? void 0 : _d.role,
                    isAdmin: true
                }
            });
        }
        catch (error) {
            logger_1.default.error('Verify admin session error:', error);
            res.status(500).json({
                message: 'Terjadi kesalahan saat verifikasi session admin'
            });
        }
    }
}
exports.AdminAuthController = AdminAuthController;
//# sourceMappingURL=AdminAuthController.js.map