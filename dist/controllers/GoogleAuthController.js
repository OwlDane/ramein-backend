"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuthCallback = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const User_1 = require("../entities/User");
const errorService_1 = require("../services/errorService");
const googleAuthCallback = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            throw new errorService_1.AppError('Access Token is required', 400);
        }
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${idToken}`);
        if (!response.ok) {
            throw new errorService_1.AppError('Invalid Google token', 400);
        }
        const googleUser = await response.json();
        if (!googleUser || !googleUser.email) {
            throw new errorService_1.AppError('Invalid Google user data', 400);
        }
        const { email, name, picture, sub: googleId, email_verified } = googleUser;
        const userRepository = database_1.default.getRepository(User_1.User);
        let user = await userRepository.findOne({ where: { email } });
        if (!user) {
            user = userRepository.create({
                email,
                name: name || email.split('@')[0],
                password: '',
                profilePicture: picture,
                googleId,
                isVerified: email_verified || true,
                role: User_1.UserRole.USER,
            });
            await userRepository.save(user);
        }
        else {
            if (!user.googleId) {
                user.googleId = googleId;
            }
            if (picture && !user.profilePicture) {
                user.profilePicture = picture;
            }
            if (!user.isVerified && email_verified) {
                user.isVerified = true;
            }
            await userRepository.save(user);
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1d' });
        res.json({
            success: true,
            message: 'Google login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    profilePicture: user.profilePicture,
                    isVerified: user.isVerified,
                },
            },
        });
    }
    catch (error) {
        console.error('Google Auth Error:', error);
        if (error instanceof errorService_1.AppError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Google authentication failed',
            });
        }
    }
};
exports.googleAuthCallback = googleAuthCallback;
//# sourceMappingURL=GoogleAuthController.js.map