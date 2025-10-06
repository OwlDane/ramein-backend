import { Router } from 'express';
import { CertificateTemplateController } from '../controllers/CertificateTemplateController';
import { auth } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.get('/', auth, CertificateTemplateController.getAll);
router.get('/default', auth, CertificateTemplateController.getDefault);
router.get('/:id', auth, CertificateTemplateController.getById);

// Admin only routes
router.post('/', auth, CertificateTemplateController.create);
router.put('/:id', auth, CertificateTemplateController.update);
router.delete('/:id', auth, CertificateTemplateController.delete);
router.patch('/:id/set-default', auth, CertificateTemplateController.setDefault);

export default router;
