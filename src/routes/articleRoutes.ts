import { Router } from 'express';
import { ArticleController } from '../controllers/ArticleController';
import { auth, checkRole } from '../middlewares/auth';

const router = Router();

// Public routes
router.get('/', ArticleController.getAll);
router.get('/categories', ArticleController.getCategories);
router.get('/:slug', ArticleController.getBySlug);

// Admin routes
router.get('/admin/all', auth, checkRole(['ADMIN']), ArticleController.getAllAdmin);
router.post('/', auth, checkRole(['ADMIN']), ArticleController.create);
router.put('/:id', auth, checkRole(['ADMIN']), ArticleController.update);
router.delete('/:id', auth, checkRole(['ADMIN']), ArticleController.delete);

// Category management (admin only)
router.post('/categories', auth, checkRole(['ADMIN']), ArticleController.createCategory);
router.put('/categories/:id', auth, checkRole(['ADMIN']), ArticleController.updateCategory);
router.delete('/categories/:id', auth, checkRole(['ADMIN']), ArticleController.deleteCategory);

export default router;
