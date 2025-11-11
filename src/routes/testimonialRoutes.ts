import { Router } from 'express';
import { TestimonialController } from '../controllers/TestimonialController';
import { auth, checkRole } from '../middlewares/auth';

const router = Router();

// Public routes
router.get('/', TestimonialController.getAll);
router.get('/:id', TestimonialController.getById);

// Admin routes
router.get('/admin/all', auth, checkRole(['ADMIN']), TestimonialController.getAllAdmin);
router.post('/', auth, checkRole(['ADMIN']), TestimonialController.create);
router.put('/:id', auth, checkRole(['ADMIN']), TestimonialController.update);
router.patch('/:id/toggle', auth, checkRole(['ADMIN']), TestimonialController.toggleActive);
router.delete('/:id', auth, checkRole(['ADMIN']), TestimonialController.delete);

export default router;
