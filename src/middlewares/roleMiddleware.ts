import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user has admin role
 */
export const adminOnly = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        // Check if user exists (should be set by authMiddleware)
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        // Check if user has admin role
        if (req.user.role !== 'ADMIN') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
            return;
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Middleware to check if user has specific role(s)
 */
export const requireRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            // Check if user exists (should be set by authMiddleware)
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }

            // Check if user has one of the allowed roles
            if (!allowedRoles.includes(req.user.role)) {
                res.status(403).json({
                    success: false,
                    message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
                });
                return;
            }

            next();
        } catch (error) {
            console.error('Role middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };
};

/**
 * Middleware to check if user is verified
 */
export const requireVerified = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        // Check if user exists (should be set by authMiddleware)
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        // Check if user is verified
        if (!req.user.isVerified && !req.user.isEmailVerified) {
            res.status(403).json({
                success: false,
                message: 'Email verification required'
            });
            return;
        }

        next();
    } catch (error) {
        console.error('Verification middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
