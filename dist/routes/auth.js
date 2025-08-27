"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const router = (0, express_1.Router)();
router.post('/register', AuthController_1.AuthController.register);
router.get('/verify-email/:token', AuthController_1.AuthController.verifyEmail);
router.post('/login', AuthController_1.AuthController.login);
router.post('/forgot-password', AuthController_1.AuthController.requestPasswordReset);
router.post('/reset-password/:token', AuthController_1.AuthController.resetPassword);
router.post('/request-verification', AuthController_1.AuthController.requestVerification);
router.post('/verify-otp', AuthController_1.AuthController.verifyOTP);
exports.default = router;
//# sourceMappingURL=auth.js.map