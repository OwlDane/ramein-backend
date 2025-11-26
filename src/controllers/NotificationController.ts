import { Response } from 'express';
import AppDataSource from '../config/database';
import { Notification } from '../entities/Notification';
import { AuthRequest } from '../middlewares/auth';
import logger from '../utils/logger';

const notificationRepository = AppDataSource.getRepository(Notification);

export class NotificationController {
    // Get user notifications
    static async getUserNotifications(req: AuthRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            let query = notificationRepository.createQueryBuilder('notification')
                .leftJoinAndSelect('notification.event', 'event')
                .where('notification.userId = :userId', { userId });

            // Filter unread only if requested
            if (unreadOnly === 'true') {
                query = query.andWhere('notification.isRead = :isRead', { isRead: false });
            }

            // Get total count
            const total = await query.getCount();

            // Get unread count
            const unreadCount = await notificationRepository.count({
                where: { userId, isRead: false }
            });

            // Get paginated results
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

        } catch (error) {
            logger.error('Get user notifications error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat mengambil notifikasi' });
        }
    }

    // Mark notification as read
    static async markAsRead(req: AuthRequest, res: Response) {
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

        } catch (error) {
            logger.error('Mark notification as read error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat menandai notifikasi' });
        }
    }

    // Mark all notifications as read
    static async markAllAsRead(req: AuthRequest, res: Response) {
        try {
            const userId = req.user.id;

            await notificationRepository
                .createQueryBuilder()
                .update(Notification)
                .set({ isRead: true, readAt: new Date() })
                .where('userId = :userId AND isRead = :isRead', { userId, isRead: false })
                .execute();

            res.json({ message: 'Semua notifikasi ditandai sudah dibaca' });

        } catch (error) {
            logger.error('Mark all notifications as read error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat menandai semua notifikasi' });
        }
    }

    // Delete notification
    static async deleteNotification(req: AuthRequest, res: Response) {
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

        } catch (error) {
            logger.error('Delete notification error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat menghapus notifikasi' });
        }
    }
}
