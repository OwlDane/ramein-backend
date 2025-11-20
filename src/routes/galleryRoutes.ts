import { Router } from 'express';
import { GalleryController } from '../controllers/GalleryController';
import { auth } from '../middlewares/auth';
import { adminAuth } from '../middlewares/adminAuth';

const router = Router();

// Public routes
router.get('/', GalleryController.getGalleryItems);
router.get('/:id', GalleryController.getGalleryItem);

// Admin routes
router.post('/', auth, adminAuth, GalleryController.createGalleryItem);
router.put('/:id', auth, adminAuth, GalleryController.updateGalleryItem);
router.delete('/:id', auth, adminAuth, GalleryController.deleteGalleryItem);

export default router;
