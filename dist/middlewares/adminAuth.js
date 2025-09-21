"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const User_1 = require("../entities/User");
const logger_1 = __importDefault(require("../utils/logger"));
const userRepository = database_1.default.getRepository(User_1.User);
const adminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                message: 'Token admin diperlukan'
            });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        if (!decoded.isAdmin || decoded.iss !== 'ramein-admin') {
            logger_1.default.warn(`Non-admin token used for admin route: ${decoded.email || 'unknown'}`);
            res.status(403).json({
                message: 'Akses admin ditolak'
            });
            return;
        }
        const admin = await userRepository.findOne({
            where: {
                id: decoded.id,
                role: User_1.UserRole.ADMIN
            },
            select: ['id', 'email', 'name', 'role', 'isVerified', 'isEmailVerified']
        });
        if (!admin) {
            logger_1.default.warn(`Admin not found or role changed: ${decoded.email}`);
            res.status(403).json({
                message: 'Admin tidak ditemukan atau tidak memiliki akses'
            });
            return;
        }
        if (!admin.isVerified || !admin.isEmailVerified) {
            logger_1.default.warn(`Admin account not verified: ${admin.email}`);
            res.status(403).json({
                message: 'Akun admin tidak terverifikasi'
            });
            return;
        }
        const loginTime = new Date(decoded.loginTime);
        const now = new Date();
        const sessionDuration = now.getTime() - loginTime.getTime();
        const fiveMinutes = 5 * 60 * 1000;
        if (sessionDuration > fiveMinutes) {
            logger_1.default.info(`Admin session expired: ${admin.email}`);
            res.status(401).json({
                message: 'Session admin telah berakhir. Silakan login ulang.',
                code: 'SESSION_EXPIRED'
            });
            return;
        }
        req.adminUser = {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            isAdmin: true,
            loginTime: decoded.loginTime
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            logger_1.default.warn(`Invalid admin token: ${error.message}`);
            res.status(401).json({
                message: 'Token admin tidak valid'
            });
            return;
        }
        logger_1.default.error('Admin auth middleware error:', error);
        res.status(500).json({
            message: 'Terjadi kesalahan saat autentikasi admin'
        });
    }
};
exports.adminAuth = adminAuth;
//# sourceMappingURL=adminAuth.js.map