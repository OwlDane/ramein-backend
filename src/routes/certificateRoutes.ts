import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { certificateController } from '../controllers/CertificateController';
import { authMiddleware, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Debug endpoint to check auth
router.get('/debug-auth', (req, res) => {
    res.json({
        authenticated: !!req.user,
        user: req.user ? {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            roleType: typeof req.user.role
        } : null,
        timestamp: new Date().toISOString()
    });
});

// Apply role-based authorization for specific routes
// IMPORTANT: Using uppercase roles to match UserRole enum (ADMIN, ORGANIZER, USER)
console.log('[CertificateRoutes] ✅ Initializing with UPPERCASE roles: ADMIN, ORGANIZER');
const adminOnly = authorize(['ADMIN']);
const organizerOrAdmin = authorize(['ORGANIZER', 'ADMIN']);
console.log('[CertificateRoutes] ✅ Middleware configured with uppercase roles');

/**
 * @route   POST /api/certificates/generate
 * @desc    Generate a new certificate
 * @access  Private (Admin/Organizer)
 */
router.post(
    '/generate',
    [
        body('participantId').isUUID().withMessage('Valid participant ID is required'),
        body('eventId').isUUID().withMessage('Valid event ID is required')
    ],
    organizerOrAdmin,
    certificateController.generateCertificate
);

/**
 * @route   POST /api/certificates/generate-bulk
 * @desc    Generate certificates for multiple participants
 * @access  Private (Admin/Organizer)
 */
router.post(
    '/generate-bulk',
    [
        body('eventId').isUUID().withMessage('Valid event ID is required'),
        body('participantIds').isArray().withMessage('Participant IDs must be an array'),
        body('participantIds.*').isUUID().withMessage('Each participant ID must be valid')
    ],
    organizerOrAdmin,
    certificateController.generateBulkCertificates
);

/**
 * @route   GET /api/certificates/verify/:certificateNumber
 * @desc    Verify a certificate
 * @access  Public
 */
router.get(
    '/verify/:certificateNumber',
    [
        param('certificateNumber')
            .isString()
            .withMessage('Certificate number is required')
    ],
    certificateController.verifyCertificate
);

/**
 * @route   GET /api/certificates/event/:eventId
 * @desc    Get all certificates for an event
 * @access  Private (Admin/Organizer)
 */
router.get(
    '/event/:eventId',
    [
        param('eventId').isUUID().withMessage('Valid event ID is required'),
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ],
    organizerOrAdmin,
    certificateController.getEventCertificates
);

/**
 * @route   GET /api/certificates/export/:eventId
 * @desc    Export certificates for an event
 * @access  Private (Admin/Organizer)
 */
router.get(
    '/export/:eventId',
    [
        param('eventId').isUUID().withMessage('Valid event ID is required'),
        query('format').optional().isIn(['csv', 'pdf', 'excel']).withMessage('Invalid export format')
    ],
    organizerOrAdmin,
    certificateController.exportCertificates
);

/**
 * @route   PATCH /api/certificates/revoke/:certificateId
 * @desc    Revoke a certificate
 * @access  Private (Admin)
 */
router.patch(
    '/revoke/:certificateId',
    [
        param('certificateId').isUUID().withMessage('Valid certificate ID is required'),
        body('reason').optional().isString().withMessage('Reason must be a string')
    ],
    adminOnly,
    certificateController.revokeCertificate
);

export default router;
