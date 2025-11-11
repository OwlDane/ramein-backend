"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TestimonialController_1 = require("../controllers/TestimonialController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/', TestimonialController_1.TestimonialController.getAll);
router.get('/:id', TestimonialController_1.TestimonialController.getById);
router.get('/admin/all', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), TestimonialController_1.TestimonialController.getAllAdmin);
router.post('/', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), TestimonialController_1.TestimonialController.create);
router.put('/:id', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), TestimonialController_1.TestimonialController.update);
router.patch('/:id/toggle', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), TestimonialController_1.TestimonialController.toggleActive);
router.delete('/:id', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), TestimonialController_1.TestimonialController.delete);
exports.default = router;
//# sourceMappingURL=testimonialRoutes.js.map