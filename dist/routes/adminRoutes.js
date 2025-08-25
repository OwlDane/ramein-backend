"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AdminController_1 = require("../controllers/AdminController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.use(auth_1.auth);
router.use((0, auth_1.checkRole)(['ADMIN']));
router.get('/dashboard/stats', AdminController_1.AdminController.getDashboardStats);
router.get('/dashboard/export', AdminController_1.AdminController.exportDashboardData);
router.get('/users', AdminController_1.AdminController.getUserManagement);
router.put('/users/:userId/role', AdminController_1.AdminController.updateUserRole);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map