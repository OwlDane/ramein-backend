// authRoutes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { auth, checkRole } from '../middlewares/auth';

const router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/request-reset-password', AuthController.requestPasswordReset);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes (admin only)
router.post('/create-admin', auth, checkRole(['ADMIN']), AuthController.createAdmin);

export default router;
