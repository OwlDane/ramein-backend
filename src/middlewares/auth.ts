import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import AppDataSource from '../config/database';
import { User } from '../entities/User';

// Define SessionData interface
interface SessionData {
    lastActivity: number;
    userId: string;
}

// Updated AuthRequest interface to include sessionData
export interface AuthRequest extends Request {
    user?: any;
    sessionData?: SessionData;  // Add this property
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new Error('No token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        
        // Support both userId and id fields (for admin and regular users)
        const userId = decoded.userId || decoded.id;
        
        if (!userId) {
            throw new Error('Invalid token payload');
        }

        const user = await AppDataSource.getRepository(User).findOne({
            where: { id: userId }
        });

        if (!user) {
            throw new Error('User not found');
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ message: 'Please authenticate' });
    }
};

export const checkRole = (roles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            res.status(401).json({ message: 'Please authenticate' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        next();
    };
};