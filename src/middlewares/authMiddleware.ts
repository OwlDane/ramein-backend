import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/database';

interface JwtPayload {
    userId: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Invalid token format' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;

        // Check if user still exists
        const user = await db.query(
            'SELECT id, role FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (user.rows.length === 0) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        // Add user info to request
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };

        return next(); // ✅ Tambahkan return di sini
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
