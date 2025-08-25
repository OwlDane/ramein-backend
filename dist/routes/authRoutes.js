"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.post('/register', AuthController_1.AuthController.register);
router.post('/login', AuthController_1.AuthController.login);
router.post('/verify-email', AuthController_1.AuthController.verifyEmail);
router.post('/request-reset-password', AuthController_1.AuthController.requestPasswordReset);
router.post('/reset-password', AuthController_1.AuthController.resetPassword);
router.post('/create-admin', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), AuthController_1.AuthController.createAdmin);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map