import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

// Define SessionData interface here since it's specific to session management
interface SessionData {
    lastActivity: number;
    userId: string;
}

// In-memory session store (in production, use Redis or database)
const sessionStore = new Map<string, SessionData>();
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds (increased for admin)

// Function to create or update a session
export const createOrUpdateSession = (token: string, userId: string) => {
    sessionStore.set(token, {
        lastActivity: Date.now(),
        userId: userId
    });
};

// Function to get session data
export const getSession = (token: string): SessionData | undefined => {
    return sessionStore.get(token);
};

// Function to remove session
export const removeSession = (token: string) => {
    sessionStore.delete(token);
};

// Main session timeout middleware
export const sessionTimeout = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return next();
        }

        const now = Date.now();
        let sessionData = sessionStore.get(token);

        // Check if session exists
        if (!sessionData) {
            // If no session but has token, let it pass to authMiddleware for JWT validation
            // The authMiddleware will validate the token and create a new session if valid
            // This handles backend restarts where in-memory sessions are lost
            return next();
        }

        // Check for inactivity timeout
        if (now - sessionData.lastActivity > INACTIVITY_TIMEOUT) {
            // Session expired due to inactivity, but let authMiddleware validate JWT first
            // If JWT is still valid, authMiddleware will create new session
            sessionStore.delete(token);
            // Don't return error here - let authMiddleware handle it
            return next();
        }

        // Update last activity timestamp for all authenticated requests
        sessionData.lastActivity = now;
        sessionStore.set(token, sessionData);

        // Attach session data to request for use in other middlewares/routes
        req.sessionData = sessionData;

        next();
    } catch (error) {
        console.error('Session timeout middleware error:', error);
        next(error);
    }
};

// Cleanup expired sessions every minute
const cleanupInterval = setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [token, session] of sessionStore.entries()) {
        if (now - session.lastActivity > INACTIVITY_TIMEOUT) {
            sessionStore.delete(token);
            cleanedCount++;
        }
    }

    if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired sessions`);
    }
}, 60000); // Run every minute

// Graceful cleanup on process termination
process.on('SIGINT', () => {
    clearInterval(cleanupInterval);
    sessionStore.clear();
    console.log('Session cleanup completed');
    process.exit(0);
});

process.on('SIGTERM', () => {
    clearInterval(cleanupInterval);
    sessionStore.clear();
    console.log('Session cleanup completed');
    process.exit(0);
});

export default sessionTimeout;