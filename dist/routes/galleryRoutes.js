"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const GalleryController_1 = require("../controllers/GalleryController");
const auth_1 = require("../middlewares/auth");
const adminAuth_1 = require("../middlewares/adminAuth");
const router = (0, express_1.Router)();
router.get('/', GalleryController_1.GalleryController.getGalleryItems);
router.get('/:id', GalleryController_1.GalleryController.getGalleryItem);
router.post('/', auth_1.auth, adminAuth_1.adminAuth, GalleryController_1.GalleryController.createGalleryItem);
router.put('/:id', auth_1.auth, adminAuth_1.adminAuth, GalleryController_1.GalleryController.updateGalleryItem);
router.delete('/:id', auth_1.auth, adminAuth_1.adminAuth, GalleryController_1.GalleryController.deleteGalleryItem);
exports.default = router;
//# sourceMappingURL=galleryRoutes.js.map