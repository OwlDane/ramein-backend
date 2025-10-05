import { Router } from 'express';
import { StatisticsController } from '../controllers/StatisticsController';
import { adminAuth } from '../middlewares/adminAuth';

const router = Router();

// Protect all statistics routes with admin middleware
router.use(adminAuth);

// Get all dashboard statistics
router.get('/dashboard', StatisticsController.getDashboardStats);

// Get monthly events statistics
router.get('/events/monthly', StatisticsController.getMonthlyEventsStats);

// Get monthly participants statistics
router.get('/participants/monthly', StatisticsController.getMonthlyParticipantsStats);

// Get top 10 events
router.get('/events/top', StatisticsController.getTopEvents);

export default router;