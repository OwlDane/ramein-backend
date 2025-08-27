"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const reportService_1 = __importDefault(require("../services/reportService"));
const errorService_1 = require("../services/errorService");
const router = (0, express_1.Router)();
router.get('/reports/monthly', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), (0, errorService_1.catchAsync)(async (req, res) => {
    const { months = '12' } = req.query;
    const monthsCount = Math.min(parseInt(months) || 12, 24);
    const report = await reportService_1.default.getMonthlyStatistics(monthsCount);
    res.json(report);
}));
router.get('/reports/top-events', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), (0, errorService_1.catchAsync)(async (req, res) => {
    const { limit = '10' } = req.query;
    const limitCount = Math.min(parseInt(limit) || 10, 100);
    const topEvents = await reportService_1.default.getTopEventsByParticipants(limitCount);
    res.json({
        count: topEvents.length,
        events: topEvents
    });
}));
router.get('/reports/event/:eventId/participation', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), (0, errorService_1.catchAsync)(async (req, res) => {
    const { eventId } = req.params;
    const event = await reportService_1.default.getEventParticipationStats(eventId);
    res.json(event);
}));
exports.default = router;
//# sourceMappingURL=reportRoutes.js.map