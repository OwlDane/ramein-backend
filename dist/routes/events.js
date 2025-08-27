"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EventController_1 = require("../controllers/EventController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/', EventController_1.EventController.getAll);
router.get('/admin/statistics', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), EventController_1.EventController.getStatistics);
router.post('/', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), EventController_1.EventController.create);
router.put('/:id', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), EventController_1.EventController.update);
router.delete('/:id', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), EventController_1.EventController.delete);
router.post('/:id/publish', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), EventController_1.EventController.publish);
router.post('/:id/unpublish', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), EventController_1.EventController.unpublish);
router.get('/:id', EventController_1.EventController.getById);
exports.default = router;
//# sourceMappingURL=events.js.map