"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const NotificationController_1 = require("../controllers/NotificationController");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.get('/', NotificationController_1.NotificationController.getUserNotifications);
router.patch('/:id/read', NotificationController_1.NotificationController.markAsRead);
router.patch('/read-all', NotificationController_1.NotificationController.markAllAsRead);
router.delete('/:id', NotificationController_1.NotificationController.deleteNotification);
exports.default = router;
//# sourceMappingURL=notificationRoutes.js.map