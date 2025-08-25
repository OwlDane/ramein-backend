"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionTimeout = void 0;
const sessionStore = new Map();
const SESSION_TIMEOUT = 5 * 60 * 1000;
const sessionTimeout = (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            return next();
        }
        const sessionData = sessionStore.get(token);
        const now = Date.now();
        if (sessionData) {
            if (now - sessionData.lastActivity > SESSION_TIMEOUT) {
                sessionStore.delete(token);
                return res.status(401).json({
                    message: 'Session expired due to inactivity. Please login again.',
                    code: 'SESSION_EXPIRED'
                });
            }
            sessionData.lastActivity = now;
            sessionStore.set(token, sessionData);
        }
        else {
            if (req.user) {
                sessionStore.set(token, {
                    lastActivity: now,
                    userId: req.user.id
                });
            }
        }
        next();
    }
    catch (error) {
        console.error('Session timeout middleware error:', error);
        next();
    }
};
exports.sessionTimeout = sessionTimeout;
setInterval(() => {
    const now = Date.now();
    for (const [token, sessionData] of sessionStore.entries()) {
        if (now - sessionData.lastActivity > SESSION_TIMEOUT) {
            sessionStore.delete(token);
        }
    }
}, 60 * 1000);
exports.default = exports.sessionTimeout;
//# sourceMappingURL=sessionTimeout.js.map