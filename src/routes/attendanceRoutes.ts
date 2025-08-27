import { Router } from 'express';
import { auth } from '../middlewares/auth';
import attendanceService from '../services/attendanceService';
import { catchAsync } from '../services/errorService';

const router = Router();

// Generate attendance token (Admin only)
router.post('/events/:eventId/token', auth, catchAsync(async (req, res) => {
    const { eventId } = req.params;
    const { token, expiresAt } = await attendanceService.generateAttendanceToken(eventId);
    res.json({ token, expiresAt });
}));

// Mark attendance (Public but requires valid token)
router.post('/events/:eventId/attend', catchAsync(async (req, res) => {
    const { token, participantId } = req.body;
    
    if (!token || !participantId) {
        return res.status(400).json({ message: 'Token and participantId are required' });
    }

    const success = await attendanceService.markAttendance(participantId, token);
    
    if (!success) {
        return res.status(400).json({ message: 'Invalid or expired token' });
    }

    res.json({ message: 'Attendance marked successfully' });
}));

// Get attendance stats (Admin only)
router.get('/events/:eventId/attendance-stats', auth, catchAsync(async (req, res) => {
    const { eventId } = req.params;
    const stats = await attendanceService.getEventAttendanceStats(eventId);
    res.json(stats);
}));

export default router;
