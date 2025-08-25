import { Request, Response, NextFunction } from 'express';

export const adminMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        return next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
