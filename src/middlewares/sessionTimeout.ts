import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

interface SessionData {
    lastActivity: number;
    userId: string;
}

// In-memory session store (in production, use Redis or database)
const sessionStore = new Map<string, SessionData>();
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

export const sessionTimeout = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
       
        if (!token) {
            return next();
        }

        // Check if session exists and is still valid
        const sessionData = sessionStore.get(token);
        const now = Date.now();

        if (sessionData) {
            // Check if session has expired
            if (now - sessionData.lastActivity > SESSION_TIMEOUT) {
                // Session expired, remove it
                sessionStore.delete(token);
                return res.status(401).json({
                    message: 'Session expired due to inactivity. Please login again.',
                    code: 'SESSION_EXPIRED'
                });
            }

            // Update last activity
            sessionData.lastActivity = now;
            sessionStore.set(token, sessionData);
        } else {
            // Create new session
            if (req.user) {
                sessionStore.set(token, {
                    lastActivity: now,
                    userId: req.user.id
                });
            }
        }

        next();
    } catch (error) {
        console.error('Session timeout middleware error:', error);
        next();
    }
};

// Cleanup expired sessions every minute
setInterval(() => {
    const now = Date.now();
    for (const [token, sessionData] of sessionStore.entries()) {
        if (now - sessionData.lastActivity > SESSION_TIMEOUT) {
            sessionStore.delete(token);
        }
    }
}, 60 * 1000);

export default sessionTimeout;