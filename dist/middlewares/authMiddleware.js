"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const User_1 = require("../entities/User");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'No token provided or invalid format'
            });
            return;
        }
        const token = authHeader.slice(7);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const userRepository = database_1.default.getRepository(User_1.User);
        const user = await userRepository.findOne({
            where: { id: decoded.userId }
        });
        if (!user) {
            res.status(401).json({
                success: false,
                error: 'User not found'
            });
            return;
        }
        req.user = user;
        req.token = token;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Token expired'
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
};
exports.authMiddleware = authMiddleware;
const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }
        if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=authMiddleware.js.map