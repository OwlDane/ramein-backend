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
            throw new Error();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await AppDataSource.getRepository(User).findOne({
            where: { id: (decoded as any).userId }
        });

        if (!user) {
            throw new Error();
        }

        req.user = user;
        next();
    } catch (error) {
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