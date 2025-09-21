import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import AppDataSource from '../config/database';
import { User, UserRole } from '../entities/User';
import logger from '../utils/logger';

interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
    isAdmin: boolean;
    loginTime: string;
}

// Extend Express Request interface for admin
declare global {
    namespace Express {
        interface Request {
            adminUser?: AdminUser;
        }
    }
}

const userRepository = AppDataSource.getRepository(User);

export const adminAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ 
                message: 'Token admin diperlukan' 
            });
            return;
        }

        const token = authHeader.substring(7);

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        
        // Check if token is from admin login (has isAdmin flag and correct issuer)
        if (!decoded.isAdmin || decoded.iss !== 'ramein-admin') {
            logger.warn(`Non-admin token used for admin route: ${decoded.email || 'unknown'}`);
            res.status(403).json({ 
                message: 'Akses admin ditolak' 
            });
            return;
        }

        // Check if admin still exists and has ADMIN role
        const admin = await userRepository.findOne({
            where: { 
                id: decoded.id,
                role: UserRole.ADMIN
            },
            select: ['id', 'email', 'name', 'role', 'isVerified', 'isEmailVerified']
        });

        if (!admin) {
            logger.warn(`Admin not found or role changed: ${decoded.email}`);
            res.status(403).json({ 
                message: 'Admin tidak ditemukan atau tidak memiliki akses' 
            });
            return;
        }

        // Check if admin account is still verified
        if (!admin.isVerified || !admin.isEmailVerified) {
            logger.warn(`Admin account not verified: ${admin.email}`);
            res.status(403).json({ 
                message: 'Akun admin tidak terverifikasi' 
            });
            return;
        }

        // Check session timeout (5 minutes)
        const loginTime = new Date(decoded.loginTime);
        const now = new Date();
        const sessionDuration = now.getTime() - loginTime.getTime();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

        if (sessionDuration > fiveMinutes) {
            logger.info(`Admin session expired: ${admin.email}`);
            res.status(401).json({ 
                message: 'Session admin telah berakhir. Silakan login ulang.',
                code: 'SESSION_EXPIRED'
            });
            return;
        }

        // Add admin info to request
        req.adminUser = {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            isAdmin: true,
            loginTime: decoded.loginTime
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            logger.warn(`Invalid admin token: ${error.message}`);
            res.status(401).json({ 
                message: 'Token admin tidak valid' 
            });
            return;
        }
        
        logger.error('Admin auth middleware error:', error);
        res.status(500).json({ 
            message: 'Terjadi kesalahan saat autentikasi admin' 
        });
    }
};

export { AdminUser };
