import { Router } from 'express';
import { AdminAuthController } from '../controllers/AdminAuthController';
import { adminAuth } from '../middlewares/adminAuth';

const router = Router();

// Admin login route (separate from regular user login)
router.post('/login', AdminAuthController.login);

// Admin logout route
router.post('/logout', adminAuth, AdminAuthController.logout);

// Get admin profile
router.get('/profile', adminAuth, AdminAuthController.getProfile);

// Verify admin session
router.get('/verify', adminAuth, AdminAuthController.verifySession);

export default router;
