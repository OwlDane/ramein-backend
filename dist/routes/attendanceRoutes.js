"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const attendanceService_1 = __importDefault(require("../services/attendanceService"));
const errorService_1 = require("../services/errorService");
const router = (0, express_1.Router)();
router.post('/events/:eventId/token', auth_1.auth, (0, errorService_1.catchAsync)(async (req, res) => {
    const { eventId } = req.params;
    const { token, expiresAt } = await attendanceService_1.default.generateAttendanceToken(eventId);
    res.json({ token, expiresAt });
}));
router.post('/events/:eventId/attend', (0, errorService_1.catchAsync)(async (req, res) => {
    const { token, participantId } = req.body;
    if (!token || !participantId) {
        return res.status(400).json({ message: 'Token and participantId are required' });
    }
    const success = await attendanceService_1.default.markAttendance(participantId, token);
    if (!success) {
        return res.status(400).json({ message: 'Invalid or expired token' });
    }
    res.json({ message: 'Attendance marked successfully' });
}));
router.get('/events/:eventId/attendance-stats', auth_1.auth, (0, errorService_1.catchAsync)(async (req, res) => {
    const { eventId } = req.params;
    const stats = await attendanceService_1.default.getEventAttendanceStats(eventId);
    res.json(stats);
}));
exports.default = router;
//# sourceMappingURL=attendanceRoutes.js.map