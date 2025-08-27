import { Router } from 'express';
import { auth, checkRole } from '../middlewares/auth';
import reportService from '../services/reportService';
import { catchAsync } from '../services/errorService';

const router = Router();

// Get monthly statistics
router.get('/reports/monthly', auth, checkRole(['ADMIN']), catchAsync(async (req, res) => {
    const { months = '12' } = req.query;
    const monthsCount = Math.min(parseInt(months as string) || 12, 24); // Max 24 months
    
    const report = await reportService.getMonthlyStatistics(monthsCount);
    res.json(report);
}));

// Get top events by participants
router.get('/reports/top-events', auth, checkRole(['ADMIN']), catchAsync(async (req, res) => {
    const { limit = '10' } = req.query;
    const limitCount = Math.min(parseInt(limit as string) || 10, 100); // Max 100 events
    
    const topEvents = await reportService.getTopEventsByParticipants(limitCount);
    res.json({
        count: topEvents.length,
        events: topEvents
    });
}));

// Get event participation statistics
router.get('/reports/event/:eventId/participation', auth, checkRole(['ADMIN']), catchAsync(async (req, res) => {
    const { eventId } = req.params;
    
    const event = await reportService.getEventParticipationStats(eventId);
    res.json(event);
}));

export default router;
