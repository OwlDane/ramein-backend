import { Router } from 'express';
import { ContactController } from '../controllers/ContactController';

const router = Router();

/**
 * @route POST /api/contact
 * @desc Submit contact form
 * @access Public
 */
router.post('/', ContactController.submitContactForm);

/**
 * @route GET /api/contact/health
 * @desc Health check for contact endpoint
 * @access Public
 */
router.get('/health', ContactController.healthCheck);

export default router;
