"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireVerification = void 0;
const database_1 = __importDefault(require("../config/database"));
const User_1 = require("../entities/User");
const requireVerification = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({
                message: 'Authentication required'
            });
            return;
        }
        if (!database_1.default.isInitialized) {
            await database_1.default.initialize();
        }
        const userRepository = database_1.default.getRepository(User_1.User);
        const user = await userRepository.findOne({
            where: { id: req.user.id }
        });
        if (!user) {
            res.status(401).json({
                message: 'User not found'
            });
            return;
        }
        if (!user.isEmailVerified && !user.isVerified) {
            res.status(403).json({
                message: 'Please verify your email first',
                requiresVerification: true
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Verification middleware error:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
        return;
    }
};
exports.requireVerification = requireVerification;
//# sourceMappingURL=requireVerification.js.map