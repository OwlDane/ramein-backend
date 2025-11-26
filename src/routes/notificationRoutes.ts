import express from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { auth } from '../middlewares/auth';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get user notifications
router.get('/', NotificationController.getUserNotifications);

// Mark notification as read
router.patch('/:id/read', NotificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', NotificationController.markAllAsRead);

// Delete notification
router.delete('/:id', NotificationController.deleteNotification);

export default router;
