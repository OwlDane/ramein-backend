"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AdminAuthController_1 = require("../controllers/AdminAuthController");
const adminAuth_1 = require("../middlewares/adminAuth");
const router = (0, express_1.Router)();
router.post('/login', AdminAuthController_1.AdminAuthController.login);
router.post('/logout', adminAuth_1.adminAuth, AdminAuthController_1.AdminAuthController.logout);
router.get('/profile', adminAuth_1.adminAuth, AdminAuthController_1.AdminAuthController.getProfile);
router.get('/verify', adminAuth_1.adminAuth, AdminAuthController_1.AdminAuthController.verifySession);
exports.default = router;
//# sourceMappingURL=adminAuthRoutes.js.map