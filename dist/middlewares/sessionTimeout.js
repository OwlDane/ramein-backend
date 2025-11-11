"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionTimeout = exports.removeSession = exports.getSession = exports.createOrUpdateSession = void 0;
const sessionStore = new Map();
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
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
const sessionTimeout = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.replace('Bearer ', '');
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
            return next();
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