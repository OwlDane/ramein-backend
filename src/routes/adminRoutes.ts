import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { auth, checkRole } from '../middlewares/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(checkRole(['ADMIN']));

// Dashboard routes
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/dashboard/export', AdminController.exportDashboardData);

// User management routes
router.get('/users', AdminController.getUserManagement);
router.put('/users/:userId/role', AdminController.updateUserRole);

export default router;
