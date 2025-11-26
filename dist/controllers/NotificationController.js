"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const database_1 = __importDefault(require("../config/database"));
const Notification_1 = require("../entities/Notification");
const logger_1 = __importDefault(require("../utils/logger"));
const notificationRepository = database_1.default.getRepository(Notification_1.Notification);
class NotificationController {
    static async getUserNotifications(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            let query = notificationRepository.createQueryBuilder('notification')
                .leftJoinAndSelect('notification.event', 'event')
                .where('notification.userId = :userId', { userId });
            if (unreadOnly === 'true') {
                query = query.andWhere('notification.isRead = :isRead', { isRead: false });
            }
            const total = await query.getCount();
            const unreadCount = await notificationRepository.count({
                where: { userId, isRead: false }
            });
            const notifications = await query
                .skip(skip)
                .take(Number(limit))
                .orderBy('notification.createdAt', 'DESC')
                .getMany();
            res.json({
                notifications,
                unreadCount,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        }
        catch (error) {
            logger_1.default.error('Get user notifications error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat mengambil notifikasi' });
        }
    }
    static async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const notification = await notificationRepository.findOne({
                where: { id, userId }
            });
            if (!notification) {
                return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
            }
            if (!notification.isRead) {
                notification.isRead = true;
                notification.readAt = new Date();
                await notificationRepository.save(notification);
            }
            res.json({ message: 'Notifikasi ditandai sudah dibaca', notification });
        }
        catch (error) {
            logger_1.default.error('Mark notification as read error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat menandai notifikasi' });
        }
    }
    static async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;
            await notificationRepository
                .createQueryBuilder()
                .update(Notification_1.Notification)
                .set({ isRead: true, readAt: new Date() })
                .where('userId = :userId AND isRead = :isRead', { userId, isRead: false })
                .execute();
            res.json({ message: 'Semua notifikasi ditandai sudah dibaca' });
        }
        catch (error) {
            logger_1.default.error('Mark all notifications as read error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat menandai semua notifikasi' });
        }
    }
    static async deleteNotification(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const notification = await notificationRepository.findOne({
                where: { id, userId }
            });
            if (!notification) {
                return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
            }
            await notificationRepository.remove(notification);
            res.json({ message: 'Notifikasi berhasil dihapus' });
        }
        catch (error) {
            logger_1.default.error('Delete notification error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat menghapus notifikasi' });
        }
    }
}
exports.NotificationController = NotificationController;
//# sourceMappingURL=NotificationController.js.map