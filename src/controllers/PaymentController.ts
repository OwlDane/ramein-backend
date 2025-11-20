import { Request, Response } from 'express';
import xenditService from '../services/xenditService';
import { PaymentStatus } from '../entities/Transaction';
import AppDataSource from '../config/database';
import { Event } from '../entities/Event';
import { User } from '../entities/User';

export class PaymentController {
    /**
     * Create new transaction and get Snap token
     * POST /api/payment/create
     */
    async createTransaction(req: Request, res: Response): Promise<void> {
        try {
            const { eventId } = req.body;
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }

            if (!eventId) {
                res.status(400).json({
                    success: false,
                    message: 'Event ID is required'
                });
                return;
            }

            const transaction = await xenditService.createTransaction(userId, eventId);

            res.status(201).json({
                success: true,
                message: 'Transaction created successfully',
                data: {
                    id: transaction.id,
                    transactionId: transaction.id,
                    orderId: transaction.orderId,
                    amount: transaction.amount,
                    adminFee: transaction.adminFee,
                    totalAmount: transaction.totalAmount,
                    paymentStatus: transaction.paymentStatus,
                    snapToken: transaction.snapToken,
                    snapUrl: transaction.snapUrl,
                    invoiceUrl: transaction.snapUrl,
                    invoiceId: transaction.snapToken,
                    expiredAt: transaction.expiredAt
                }
            });
        } catch (error: any) {
            console.error('Create transaction error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create transaction'
            });
        }
    }

    /**
     * Get transaction by order ID
     * GET /api/payment/transaction/:orderId
     */
    async getTransactionByOrderId(req: Request, res: Response): Promise<void> {
        try {
            const { orderId } = req.params;
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }

            const transaction = await xenditService.getTransactionByOrderId(orderId);

            if (!transaction) {
                res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
                return;
            }

            // Check if user owns this transaction (unless admin)
            if (transaction.userId !== userId && req.user?.role !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: transaction
            });
        } catch (error: any) {
            console.error('Get transaction error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get transaction'
            });
        }
    }

    /**
     * Get transaction by ID
     * GET /api/payment/:id
     */
    async getTransactionById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }

            const transaction = await xenditService.getTransactionById(id);

            if (!transaction) {
                res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
                return;
            }

            // Check if user owns this transaction (unless admin)
            if (transaction.userId !== userId && req.user?.role !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: transaction
            });
        } catch (error: any) {
            console.error('Get transaction error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get transaction'
            });
        }
    }

    /**
     * Check transaction status from Midtrans
     * GET /api/payment/status/:orderId
     */
    async checkTransactionStatus(req: Request, res: Response): Promise<void> {
        try {
            const { orderId } = req.params;
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }

            const transaction = await xenditService.checkTransactionStatus(orderId);

            if (!transaction) {
                res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
                return;
            }

            // Check if user owns this transaction (unless admin)
            if (transaction.userId !== userId && req.user?.role !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Transaction status updated',
                data: transaction
            });
        } catch (error: any) {
            console.error('Check transaction status error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to check transaction status'
            });
        }
    }

    /**
     * Handle Midtrans notification webhook
     * POST /api/payment/notification
     */
    async handleNotification(req: Request, res: Response): Promise<void> {
        try {
            const notificationData = req.body;

            console.log('Received Midtrans notification:', notificationData);

            const transaction = await xenditService.handleNotification(notificationData);

            res.status(200).json({
                success: true,
                message: 'Notification processed successfully',
                data: {
                    orderId: transaction.orderId,
                    paymentStatus: transaction.paymentStatus
                }
            });
        } catch (error: any) {
            console.error('Handle notification error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to process notification'
            });
        }
    }

    /**
     * Get user's transactions
     * GET /api/payment/my-transactions
     */
    async getMyTransactions(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }

            const transactions = await xenditService.getUserTransactions(userId);

            res.status(200).json({
                success: true,
                data: transactions,
                total: transactions.length
            });
        } catch (error: any) {
            console.error('Get my transactions error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get transactions'
            });
        }
    }

    /**
     * Get event transactions (Admin or Event Owner)
     * GET /api/payment/event/:eventId
     */
    async getEventTransactions(req: Request, res: Response): Promise<void> {
        try {
            const { eventId } = req.params;
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }

            // Only admin can view event transactions
            if (userRole !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin only.'
                });
                return;
            }

            const transactions = await xenditService.getEventTransactions(eventId);

            res.status(200).json({
                success: true,
                data: transactions,
                total: transactions.length
            });
        } catch (error: any) {
            console.error('Get event transactions error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get event transactions'
            });
        }
    }

    /**
     * Cancel transaction
     * POST /api/payment/cancel/:orderId
     */
    async cancelTransaction(req: Request, res: Response): Promise<void> {
        try {
            const { orderId } = req.params;
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }

            // Get transaction first to check ownership
            const existingTransaction = await xenditService.getTransactionByOrderId(orderId);

            if (!existingTransaction) {
                res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
                return;
            }

            // Check if user owns this transaction (unless admin)
            if (existingTransaction.userId !== userId && req.user?.role !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
                return;
            }

            const transaction = await xenditService.cancelTransaction(orderId);

            res.status(200).json({
                success: true,
                message: 'Transaction cancelled successfully',
                data: transaction
            });
        } catch (error: any) {
            console.error('Cancel transaction error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to cancel transaction'
            });
        }
    }

    /**
     * Get all transactions (Admin only)
     * GET /api/payment/admin/all
     */
    async getAllTransactions(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId || userRole !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin only.'
                });
                return;
            }

            const { status, startDate, endDate, limit, offset } = req.query;

            const filters: any = {};

            if (status) {
                filters.status = status as PaymentStatus;
            }

            if (startDate) {
                filters.startDate = new Date(startDate as string);
            }

            if (endDate) {
                filters.endDate = new Date(endDate as string);
            }

            if (limit) {
                filters.limit = parseInt(limit as string);
            }

            if (offset) {
                filters.offset = parseInt(offset as string);
            }

            const result = await xenditService.getAllTransactions(filters);

            res.status(200).json({
                success: true,
                data: result.transactions,
                total: result.total,
                limit: filters.limit || null,
                offset: filters.offset || 0
            });
        } catch (error: any) {
            console.error('Get all transactions error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get transactions'
            });
        }
    }

    /**
     * Get transaction statistics (Admin only)
     * GET /api/payment/admin/statistics
     */
    async getTransactionStatistics(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId || userRole !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin only.'
                });
                return;
            }

            const { eventId } = req.query;

            const statistics = await xenditService.getTransactionStatistics(
                eventId as string | undefined
            );

            res.status(200).json({
                success: true,
                data: statistics
            });
        } catch (error: any) {
            console.error('Get transaction statistics error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get statistics'
            });
        }
    }

    /**
     * Get payment summary before checkout
     * POST /api/payment/summary
     */
    async getPaymentSummary(req: Request, res: Response): Promise<void> {
        try {
            const { eventId } = req.body;
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }

            if (!eventId) {
                res.status(400).json({
                    success: false,
                    message: 'Event ID is required'
                });
                return;
            }

            // Check if AppDataSource is initialized
            if (!AppDataSource.isInitialized) {
                console.error('AppDataSource is not initialized');
                res.status(500).json({
                    success: false,
                    message: 'Database connection not available'
                });
                return;
            }

            // Get repositories
            const eventRepository = AppDataSource.getRepository(Event);
            const userRepository = AppDataSource.getRepository(User);

            const event = await eventRepository.findOne({ where: { id: eventId } });
            if (!event) {
                res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
                return;
            }

            const user = await userRepository.findOne({ where: { id: userId } });
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            const amount = Number(event.price);
            const adminFee = amount === 0 ? 0 : Math.round(Math.max(1000, amount * 0.015));
            const totalAmount = amount + adminFee;

            res.status(200).json({
                success: true,
                data: {
                    event: {
                        id: event.id,
                        title: event.title,
                        date: event.date,
                        time: event.time,
                        location: event.location,
                        category: event.category,
                        price: event.price
                    },
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone
                    },
                    pricing: {
                        amount,
                        adminFee,
                        totalAmount,
                        isFree: amount === 0
                    }
                }
            });
        } catch (error: any) {
            console.error('Get payment summary error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get payment summary'
            });
        }
    }

    /**
     * Test endpoint to check if payment API is working
     * GET /api/payment/test
     */
    async testPaymentAPI(_req: Request, res: Response): Promise<void> {
        try {
            res.status(200).json({
                success: true,
                message: 'Payment API is working',
                timestamp: new Date().toISOString(),
                appDataSourceInitialized: AppDataSource.isInitialized
            });
        } catch (error: any) {
            console.error('Test payment API error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Test failed'
            });
        }
    }
}

export default new PaymentController();
