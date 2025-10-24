"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionTimeout = exports.removeSession = exports.getSession = exports.createOrUpdateSession = void 0;
const sessionStore = new Map();
const INACTIVITY_TIMEOUT = 5 * 60 * 1000;
const createOrUpdateSession = (token, userId) => {
    sessionStore.set(token, {
        lastActivity: Date.now(),
        userId: userId
    });
};
exports.createOrUpdateSession = createOrUpdateSession;
const getSession = (token) => {
    return sessionStore.get(token);
};
exports.getSession = getSession;
const removeSession = (token) => {
    sessionStore.delete(token);
};
exports.removeSession = removeSession;
const sessionTimeout = (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            return next();
        }
        const now = Date.now();
        let sessionData = sessionStore.get(token);
        if (!sessionData) {
            return next();
        }
        if (now - sessionData.lastActivity > INACTIVITY_TIMEOUT) {
            sessionStore.delete(token);
            return res.status(401).json({
                status: 'error',
                message: 'Session expired due to inactivity. Please login again.',
                code: 'SESSION_EXPIRED'
            });
        }
        sessionData.lastActivity = now;
        sessionStore.set(token, sessionData);
        req.sessionData = sessionData;
        next();
    }
    catch (error) {
        console.error('Session timeout middleware error:', error);
        next(error);
    }
};
exports.sessionTimeout = sessionTimeout;
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
}, 60000);
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
exports.default = exports.sessionTimeout;
//# sourceMappingURL=sessionTimeout.js.map