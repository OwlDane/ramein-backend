// authRoutes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { auth, checkRole } from '../middlewares/auth';
import { requireVerification } from '../middlewares/requireVerification'; // Fixed import path

const router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/request-verification', AuthController.requestVerification); // ✅ Added OTP request
router.post('/verify-otp', AuthController.verifyOTP); // ✅ Added OTP verification
router.post('/request-reset-password', AuthController.requestPasswordReset);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes (admin only)
router.post('/create-admin', auth, checkRole(['ADMIN']), AuthController.createAdmin);

// Example protected route that requires verification
router.get('/protected-route', auth, requireVerification, (req, res) => {
    res.json({ 
        message: 'This is a protected route',
        user: {
            id: (req.user as any)?.id,
            role: (req.user as any)?.role
        }
    });
});

// Additional protected routes you might need
router.get('/profile', auth, requireVerification, (req, res) => {
    res.json({ 
        message: 'User profile endpoint',
        userId: (req.user as any)?.id 
    });
});

export default router;