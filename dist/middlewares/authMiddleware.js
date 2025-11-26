"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = exports.authorize = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const User_1 = require("../entities/User");
const sessionTimeout_1 = require("./sessionTimeout");
const authMiddleware = async (req, res, next) => {
    try {
        console.log('[Auth] 🔐 authMiddleware called:', {
            method: req.method,
            path: req.path,
            hasAuthHeader: !!req.headers.authorization
        });
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log('[Auth] ❌ No token or invalid format');
            res.status(401).json({
                success: false,
                error: "No token provided or invalid format",
            });
            return;
        }
        const token = authHeader.slice(7);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
        const userId = decoded.userId || decoded.id;
        const userRepository = database_1.default.getRepository(User_1.User);
        const user = await userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            res.status(401).json({
                success: false,
                error: "User not found",
            });
            return;
        }
        const finalRole = decoded.role || user.role;
        console.log('[Auth] User authenticated:', {
            userId: user.id,
            email: user.email,
            dbRole: user.role,
            jwtRole: decoded.role,
            finalRole,
            issuer: decoded.iss
        });
        req.user = {
            ...user,
            userId: user.id,
            role: finalRole,
        };
        req.token = token;
        if (!(0, sessionTimeout_1.getSession)(token)) {
            (0, sessionTimeout_1.createOrUpdateSession)(token, user.id);
        }
        next();
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: "Invalid token",
            });
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: "Token expired",
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
};
exports.authMiddleware = authMiddleware;
const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        console.log('[Auth] 🛡️ authorize middleware called:', {
            method: req.method,
            path: req.path,
            allowedRoles,
            hasUser: !!req.user
        });
        if (!req.user) {
            console.log('[Auth] ❌ No user in request');
            res.status(401).json({
                success: false,
                error: "Authentication required",
            });
            return;
        }
        const userRoleUpper = req.user.role.toUpperCase();
        const allowedRolesUpper = allowedRoles.map(r => r.toUpperCase());
        const hasPermission = allowedRolesUpper.includes(userRoleUpper);
        console.log('[Auth] Role check:', {
            userRole: req.user.role,
            userRoleUpper,
            allowedRoles,
            allowedRolesUpper,
            hasPermission,
            userEmail: req.user.email,
            userId: req.user.id,
            path: req.path,
            method: req.method
        });
        if (allowedRoles.length > 0 && !hasPermission) {
            console.error('[Auth] ❌ Role authorization FAILED:', {
                userRole: req.user.role,
                userRoleUpper,
                allowedRoles,
                allowedRolesUpper,
                userEmail: req.user.email,
                path: req.path
            });
            res.status(403).json({
                success: false,
                error: "Insufficient permissions",
                debug: {
                    yourRole: req.user.role,
                    requiredRoles: allowedRoles
                }
            });
            return;
        }
        console.log('[Auth] ✅ Role authorization SUCCESS');
        next();
    };
};
exports.authorize = authorize;
exports.authenticate = exports.authMiddleware;
//# sourceMappingURL=authMiddleware.js.map