"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const auth_1 = require("../middlewares/auth");
const requireVerification_1 = require("../middlewares/requireVerification");
const router = (0, express_1.Router)();
router.post('/register', AuthController_1.AuthController.register);
router.post('/login', AuthController_1.AuthController.login);
router.post('/request-login-otp', AuthController_1.AuthController.requestLoginOTP);
router.post('/verify-otp', AuthController_1.AuthController.verifyOTP);
router.post('/verify-email', AuthController_1.AuthController.verifyEmail);
router.post('/request-verification', AuthController_1.AuthController.requestVerification);
router.post('/request-reset-password', AuthController_1.AuthController.requestPasswordReset);
router.post('/reset-password', AuthController_1.AuthController.resetPassword);
router.post('/create-admin', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), AuthController_1.AuthController.createAdmin);
router.get('/protected-route', auth_1.auth, requireVerification_1.requireVerification, (req, res) => {
    var _a, _b;
    res.json({
        message: 'This is a protected route',
        user: {
            id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            role: (_b = req.user) === null || _b === void 0 ? void 0 : _b.role
        }
    });
});
router.get('/profile', auth_1.auth, requireVerification_1.requireVerification, (req, res) => {
    var _a;
    res.json({
        message: 'User profile endpoint',
        userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id
    });
});
router.post('/logout', AuthController_1.AuthController.logout);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map