"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EventCategoryController_1 = require("../controllers/EventCategoryController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminMiddleware_1 = require("../middlewares/adminMiddleware");
const router = (0, express_1.Router)();
router.get("/", EventCategoryController_1.EventCategoryController.getAllCategories.bind(EventCategoryController_1.EventCategoryController));
router.get("/:id", EventCategoryController_1.EventCategoryController.getCategoryById.bind(EventCategoryController_1.EventCategoryController));
router.post("/", [authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware], EventCategoryController_1.EventCategoryController.createCategory.bind(EventCategoryController_1.EventCategoryController));
router.put("/:id", [authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware], EventCategoryController_1.EventCategoryController.updateCategory.bind(EventCategoryController_1.EventCategoryController));
router.delete("/:id", [authMiddleware_1.authMiddleware, adminMiddleware_1.adminMiddleware], EventCategoryController_1.EventCategoryController.deleteCategory.bind(EventCategoryController_1.EventCategoryController));
exports.default = router;
//# sourceMappingURL=eventCategoryRoutes.js.map