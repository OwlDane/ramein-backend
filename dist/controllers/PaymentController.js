"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const midtransService_1 = __importDefault(require("../services/midtransService"));
const database_1 = __importDefault(require("../config/database"));
const Event_1 = require("../entities/Event");
const User_1 = require("../entities/User");
class PaymentController {
    async createTransaction(req, res) {
        var _a;
        try {
            const { eventId } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
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
            const transaction = await midtransService_1.default.createTransaction(userId, eventId);
            res.status(201).json({
                success: true,
                message: 'Transaction created successfully',
                data: {
                    transactionId: transaction.id,
                    orderId: transaction.orderId,
                    amount: transaction.amount,
                    adminFee: transaction.adminFee,
                    totalAmount: transaction.totalAmount,
                    paymentStatus: transaction.paymentStatus,
                    snapToken: transaction.snapToken,
                    snapUrl: transaction.snapUrl,
                    expiredAt: transaction.expiredAt
                }
            });
        }
        catch (error) {
            console.error('Create transaction error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create transaction'
            });
        }
    }
    async getTransactionByOrderId(req, res) {
        var _a, _b;
        try {
            const { orderId } = req.params;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            const transaction = await midtransService_1.default.getTransactionByOrderId(orderId);
            if (!transaction) {
                res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
                return;
            }
            if (transaction.userId !== userId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'ADMIN') {
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
        }
        catch (error) {
            console.error('Get transaction error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get transaction'
            });
        }
    }
    async getTransactionById(req, res) {
        var _a, _b;
        try {
            const { id } = req.params;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            const transaction = await midtransService_1.default.getTransactionById(id);
            if (!transaction) {
                res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
                return;
            }
            if (transaction.userId !== userId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'ADMIN') {
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
        }
        catch (error) {
            console.error('Get transaction error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get transaction'
            });
        }
    }
    async checkTransactionStatus(req, res) {
        var _a, _b;
        try {
            const { orderId } = req.params;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            const transaction = await midtransService_1.default.checkTransactionStatus(orderId);
            if (!transaction) {
                res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
                return;
            }
            if (transaction.userId !== userId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'ADMIN') {
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
        }
        catch (error) {
            console.error('Check transaction status error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to check transaction status'
            });
        }
    }
    async handleNotification(req, res) {
        try {
            const notificationData = req.body;
            console.log('Received Midtrans notification:', notificationData);
            const transaction = await midtransService_1.default.handleNotification(notificationData);
            res.status(200).json({
                success: true,
                message: 'Notification processed successfully',
                data: {
                    orderId: transaction.orderId,
                    paymentStatus: transaction.paymentStatus
                }
            });
        }
        catch (error) {
            console.error('Handle notification error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to process notification'
            });
        }
    }
    async getMyTransactions(req, res) {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            const transactions = await midtransService_1.default.getUserTransactions(userId);
            res.status(200).json({
                success: true,
                data: transactions,
                total: transactions.length
            });
        }
        catch (error) {
            console.error('Get my transactions error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get transactions'
            });
        }
    }
    async getEventTransactions(req, res) {
        var _a, _b;
        try {
            const { eventId } = req.params;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            if (userRole !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin only.'
                });
                return;
            }
            const transactions = await midtransService_1.default.getEventTransactions(eventId);
            res.status(200).json({
                success: true,
                data: transactions,
                total: transactions.length
            });
        }
        catch (error) {
            console.error('Get event transactions error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get event transactions'
            });
        }
    }
    async cancelTransaction(req, res) {
        var _a, _b;
        try {
            const { orderId } = req.params;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            const existingTransaction = await midtransService_1.default.getTransactionByOrderId(orderId);
            if (!existingTransaction) {
                res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
                return;
            }
            if (existingTransaction.userId !== userId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
                return;
            }
            const transaction = await midtransService_1.default.cancelTransaction(orderId);
            res.status(200).json({
                success: true,
                message: 'Transaction cancelled successfully',
                data: transaction
            });
        }
        catch (error) {
            console.error('Cancel transaction error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to cancel transaction'
            });
        }
    }
    async getAllTransactions(req, res) {
        var _a, _b;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
            if (!userId || userRole !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin only.'
                });
                return;
            }
            const { status, startDate, endDate, limit, offset } = req.query;
            const filters = {};
            if (status) {
                filters.status = status;
            }
            if (startDate) {
                filters.startDate = new Date(startDate);
            }
            if (endDate) {
                filters.endDate = new Date(endDate);
            }
            if (limit) {
                filters.limit = parseInt(limit);
            }
            if (offset) {
                filters.offset = parseInt(offset);
            }
            const result = await midtransService_1.default.getAllTransactions(filters);
            res.status(200).json({
                success: true,
                data: result.transactions,
                total: result.total,
                limit: filters.limit || null,
                offset: filters.offset || 0
            });
        }
        catch (error) {
            console.error('Get all transactions error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get transactions'
            });
        }
    }
    async getTransactionStatistics(req, res) {
        var _a, _b;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
            if (!userId || userRole !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin only.'
                });
                return;
            }
            const { eventId } = req.query;
            const statistics = await midtransService_1.default.getTransactionStatistics(eventId);
            res.status(200).json({
                success: true,
                data: statistics
            });
        }
        catch (error) {
            console.error('Get transaction statistics error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get statistics'
            });
        }
    }
    async getPaymentSummary(req, res) {
        var _a;
        try {
            const { eventId } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
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
            if (!database_1.default.isInitialized) {
                console.error('AppDataSource is not initialized');
                res.status(500).json({
                    success: false,
                    message: 'Database connection not available'
                });
                return;
            }
            const eventRepository = database_1.default.getRepository(Event_1.Event);
            const userRepository = database_1.default.getRepository(User_1.User);
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
        }
        catch (error) {
            console.error('Get payment summary error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get payment summary'
            });
        }
    }
    async testPaymentAPI(_req, res) {
        try {
            res.status(200).json({
                success: true,
                message: 'Payment API is working',
                timestamp: new Date().toISOString(),
                appDataSourceInitialized: database_1.default.isInitialized
            });
        }
        catch (error) {
            console.error('Test payment API error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Test failed'
            });
        }
    }
}
exports.PaymentController = PaymentController;
exports.default = new PaymentController();
//# sourceMappingURL=PaymentController.js.map