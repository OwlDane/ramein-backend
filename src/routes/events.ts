import { Router } from 'express';
import { EventController } from '../controllers/EventController';
import { auth, checkRole } from '../middlewares/auth';

const router = Router();

// Public routes
router.get('/', EventController.getAll);

// Admin routes (order matters: admin-specific before dynamic :id)
router.get('/admin/statistics', auth, checkRole(['ADMIN']), EventController.getStatistics);
router.post('/', auth, checkRole(['ADMIN']), EventController.create);
router.put('/:id', auth, checkRole(['ADMIN']), EventController.update);
router.delete('/:id', auth, checkRole(['ADMIN']), EventController.delete);
router.post('/:id/publish', auth, checkRole(['ADMIN']), EventController.publish);
router.post('/:id/unpublish', auth, checkRole(['ADMIN']), EventController.unpublish);

// Public get by id should be last to avoid shadowing
router.get('/:id', EventController.getById);

export default router;
