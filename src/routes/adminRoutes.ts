import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { FinancialController } from '../controllers/FinancialController';
import { adminAuth } from '../middlewares/adminAuth';

const router = Router();

// All admin routes require admin authentication
router.use(adminAuth);

// Dashboard routes
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/dashboard/financial', FinancialController.getFinancialAnalytics);
router.get('/dashboard/export', AdminController.exportDashboardData);

// Event management routes
router.post('/events', AdminController.createEvent);
router.get('/events', AdminController.getEvents);
router.get('/events/:id', AdminController.getEventById);
router.put('/events/:id', AdminController.updateEvent);
router.delete('/events/:id', AdminController.deleteEvent);

// Participant management routes
router.get('/events/:eventId/participants', AdminController.getEventParticipants);
router.get('/events/:eventId/participants/export', AdminController.exportEventParticipants);

// User management routes
router.get('/users', AdminController.getUserManagement);
router.put('/users/:userId/role', AdminController.updateUserRole);

export default router;