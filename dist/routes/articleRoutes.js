"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ArticleController_1 = require("../controllers/ArticleController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/', ArticleController_1.ArticleController.getAll);
router.get('/categories', ArticleController_1.ArticleController.getCategories);
router.get('/:slug', ArticleController_1.ArticleController.getBySlug);
router.get('/admin/all', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), ArticleController_1.ArticleController.getAllAdmin);
router.post('/', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), ArticleController_1.ArticleController.create);
router.put('/:id', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), ArticleController_1.ArticleController.update);
router.delete('/:id', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), ArticleController_1.ArticleController.delete);
router.post('/categories', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), ArticleController_1.ArticleController.createCategory);
router.put('/categories/:id', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), ArticleController_1.ArticleController.updateCategory);
router.delete('/categories/:id', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), ArticleController_1.ArticleController.deleteCategory);
exports.default = router;
//# sourceMappingURL=articleRoutes.js.map