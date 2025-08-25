// src/routes/eventCategoryRoutes.ts
import { Router } from "express";
import { EventCategoryController } from "../controllers/EventCategoryController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";

const router = Router();
// Public
router.get("/", EventCategoryController.getAllCategories.bind(EventCategoryController));
router.get("/:id", EventCategoryController.getCategoryById.bind(EventCategoryController));

// Admin only
router.post("/", [authMiddleware, adminMiddleware], EventCategoryController.createCategory.bind(EventCategoryController));
router.put("/:id", [authMiddleware, adminMiddleware], EventCategoryController.updateCategory.bind(EventCategoryController));
router.delete("/:id", [authMiddleware, adminMiddleware], EventCategoryController.deleteCategory.bind(EventCategoryController));

export default router;
