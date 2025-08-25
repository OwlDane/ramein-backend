import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();

// Auth routes
router.post('/register', AuthController.register);
router.get('/verify-email/:token', AuthController.verifyEmail);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.requestPasswordReset);
router.post('/reset-password/:token', AuthController.resetPassword);

export default router;
