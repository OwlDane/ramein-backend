"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = exports.auth = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const User_1 = require("../entities/User");
const auth = async (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            throw new Error('No token provided');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const userId = decoded.userId || decoded.id;
        if (!userId) {
            throw new Error('Invalid token payload');
        }
        const user = await database_1.default.getRepository(User_1.User).findOne({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ message: 'Please authenticate' });
    }
};
exports.auth = auth;
const checkRole = (roles) => {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'Please authenticate' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }
        next();
    };
};
exports.checkRole = checkRole;
//# sourceMappingURL=auth.js.map