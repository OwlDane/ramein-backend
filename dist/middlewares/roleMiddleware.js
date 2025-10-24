"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireVerified = exports.requireRole = exports.adminOnly = void 0;
const adminOnly = (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        if (req.user.role !== 'ADMIN') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.adminOnly = adminOnly;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            if (!allowedRoles.includes(req.user.role)) {
                res.status(403).json({
                    success: false,
                    message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Role middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };
};
exports.requireRole = requireRole;
const requireVerified = (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        if (!req.user.isVerified && !req.user.isEmailVerified) {
            res.status(403).json({
                success: false,
                message: 'Email verification required'
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Verification middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.requireVerified = requireVerified;
//# sourceMappingURL=roleMiddleware.js.map