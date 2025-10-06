"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const StatisticsController_1 = require("../controllers/StatisticsController");
const adminAuth_1 = require("../middlewares/adminAuth");
const router = (0, express_1.Router)();
router.use(adminAuth_1.adminAuth);
router.get('/dashboard', StatisticsController_1.StatisticsController.getDashboardStats);
router.get('/events/monthly', StatisticsController_1.StatisticsController.getMonthlyEventsStats);
router.get('/participants/monthly', StatisticsController_1.StatisticsController.getMonthlyParticipantsStats);
router.get('/events/top', StatisticsController_1.StatisticsController.getTopEvents);
exports.default = router;
//# sourceMappingURL=statisticsRoutes.js.map