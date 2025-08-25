"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const adminMiddleware = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        return next();
    }
    catch (error) {
        console.error('Admin middleware error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.adminMiddleware = adminMiddleware;
//# sourceMappingURL=adminMiddleware.js.map