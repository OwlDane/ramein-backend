import { Router } from 'express';
import { EventController } from '../controllers/EventController';
import { auth, checkRole } from '../middlewares/auth';

const router = Router();

// Public routes
router.get('/', EventController.getAll);
router.get('/:id', EventController.getById);

// Protected routes (admin only)
router.post('/', auth, checkRole(['ADMIN']), EventController.create);
router.put('/:id', auth, checkRole(['ADMIN']), EventController.update);
router.delete('/:id', auth, checkRole(['ADMIN']), EventController.delete);
router.get('/admin/statistics', auth, checkRole(['ADMIN']), EventController.getStatistics);

export default router;
