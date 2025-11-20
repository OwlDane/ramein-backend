"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const database_1 = __importDefault(require("../config/database"));
const Transaction_1 = require("../entities/Transaction");
const Event_1 = require("../entities/Event");
const User_1 = require("../entities/User");
const Participant_1 = require("../entities/Participant");
const crypto_1 = __importDefault(require("crypto"));
const tokenGenerator_1 = require("../utils/tokenGenerator");
class XenditService {
    constructor() {
        this.transactionRepository = database_1.default.getRepository(Transaction_1.Transaction);
        this.eventRepository = database_1.default.getRepository(Event_1.Event);
        this.userRepository = database_1.default.getRepository(User_1.User);
        this.participantRepository = database_1.default.getRepository(Participant_1.Participant);
        const apiKey = process.env.XENDIT_API_KEY || '';
        this.callbackToken = process.env.XENDIT_CALLBACK_TOKEN || '';
        if (!apiKey) {
            console.warn('⚠️ XENDIT_API_KEY not configured');
        }
        this.apiClient = axios_1.default.create({
            baseURL: 'https://api.xendit.co',
            auth: {
                username: apiKey,
                password: ''
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    generateOrderId() {
        const timestamp = Date.now();
        const random = crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
        return `RAMEIN-${timestamp}-${random}`;
    }
    calculateAdminFee(amount) {
        if (amount === 0)
            return 0;
        return Math.max(1000, Math.round(amount * 0.015));
    }
    async createTransaction(userId, eventId) {
        var _a, _b, _c, _d, _e;
        try {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) {
                throw new Error('User not found');
            }
            const event = await this.eventRepository.findOne({ where: { id: eventId } });
            if (!event) {
                throw new Error('Event not found');
            }
            const existingParticipant = await this.participantRepository.findOne({
                where: { userId, eventId }
            });
            if (existingParticipant) {
                throw new Error('User already registered for this event');
            }
            const amount = Number(event.price) || 0;
            const adminFee = this.calculateAdminFee(amount);
            const totalAmount = amount + adminFee;
            const orderId = this.generateOrderId();
            const transaction = new Transaction_1.Transaction();
            transaction.userId = userId;
            transaction.eventId = eventId;
            transaction.orderId = orderId;
            transaction.amount = amount;
            transaction.adminFee = adminFee;
            transaction.totalAmount = totalAmount;
            transaction.paymentStatus = amount === 0 ? Transaction_1.PaymentStatus.PAID : Transaction_1.PaymentStatus.PENDING;
            if (amount === 0) {
                transaction.paidAt = new Date();
                transaction.notes = 'Free event - auto approved';
                await this.transactionRepository.save(transaction);
                const participant = new Participant_1.Participant();
                participant.userId = userId;
                participant.eventId = eventId;
                await this.participantRepository.save(participant);
                return {
                    id: transaction.id,
                    transactionId: transaction.id,
                    orderId: transaction.orderId,
                    amount: transaction.amount,
                    adminFee: transaction.adminFee,
                    totalAmount: transaction.totalAmount,
                    paymentStatus: transaction.paymentStatus,
                    invoiceUrl: null,
                    invoiceId: null,
                    expiredAt: transaction.expiredAt
                };
            }
            await this.transactionRepository.save(transaction);
            const invoiceRequest = {
                external_id: orderId,
                amount: totalAmount,
                description: `Payment for ${event.title}`,
                invoice_duration: 24 * 3600,
                customer: {
                    given_names: user.name,
                    email: user.email,
                    mobile_number: user.phone || undefined
                },
                items: [
                    {
                        name: event.title,
                        quantity: 1,
                        price: amount
                    },
                    {
                        name: 'Admin Fee',
                        quantity: 1,
                        price: adminFee
                    }
                ],
                success_redirect_url: `${process.env.FRONTEND_URL}/payment/success?order_id=${orderId}`,
                failure_redirect_url: `${process.env.FRONTEND_URL}/payment/error?order_id=${orderId}`
            };
            console.log('📤 Creating Xendit invoice:', JSON.stringify(invoiceRequest, null, 2));
            const response = await this.apiClient.post('/v2/invoices', invoiceRequest);
            const invoiceData = response.data;
            console.log('✅ Xendit invoice created:', invoiceData.id);
            transaction.snapToken = invoiceData.id;
            transaction.snapUrl = invoiceData.invoice_url;
            transaction.midtransResponse = invoiceData;
            transaction.expiredAt = new Date(invoiceData.expiry_date);
            await this.transactionRepository.save(transaction);
            return {
                id: transaction.id,
                transactionId: transaction.id,
                orderId: transaction.orderId,
                amount: transaction.amount,
                adminFee: transaction.adminFee,
                totalAmount: transaction.totalAmount,
                paymentStatus: transaction.paymentStatus,
                snapToken: invoiceData.id,
                snapUrl: invoiceData.invoice_url,
                invoiceUrl: invoiceData.invoice_url,
                invoiceId: invoiceData.id,
                expiredAt: transaction.expiredAt
            };
        }
        catch (error) {
            console.error('❌ Xendit API Error:', {
                message: error.message,
                response: (_a = error.response) === null || _a === void 0 ? void 0 : _a.data,
                status: (_b = error.response) === null || _b === void 0 ? void 0 : _b.status,
                statusText: (_c = error.response) === null || _c === void 0 ? void 0 : _c.statusText,
                fullError: error
            });
            let errorMessage = error.message;
            if ((_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.error_code) {
                errorMessage = `${error.response.data.error_code}: ${error.response.data.message || error.message}`;
            }
            throw new Error(`Failed to create payment: ${errorMessage}`);
        }
    }
    async getTransactionByOrderId(orderId) {
        return await this.transactionRepository.findOne({
            where: { orderId },
            relations: ['user', 'event', 'participant']
        });
    }
    async getTransactionById(id) {
        return await this.transactionRepository.findOne({
            where: { id },
            relations: ['user', 'event', 'participant']
        });
    }
    async checkTransactionStatus(orderId) {
        try {
            const transaction = await this.getTransactionByOrderId(orderId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            const response = await this.apiClient.get(`/v2/invoices/${transaction.snapToken}`);
            const invoiceData = response.data;
            console.log('📊 Xendit invoice status:', invoiceData.status);
            if (invoiceData.status === 'PAID' && transaction.paymentStatus !== Transaction_1.PaymentStatus.PAID) {
                transaction.paymentStatus = Transaction_1.PaymentStatus.PAID;
                transaction.paidAt = new Date(invoiceData.paid_at || new Date());
                const paymentChannel = invoiceData.payment_channel ? invoiceData.payment_channel.toLowerCase() : 'xendit';
                transaction.paymentMethod = paymentChannel;
                const existingParticipant = await this.participantRepository.findOne({
                    where: { userId: transaction.userId, eventId: transaction.eventId }
                });
                if (!existingParticipant) {
                    const participant = new Participant_1.Participant();
                    participant.userId = transaction.userId;
                    participant.eventId = transaction.eventId;
                    participant.tokenNumber = (0, tokenGenerator_1.generateNumericToken)(10);
                    await this.participantRepository.save(participant);
                    console.log(`✅ Participant created with token: ${participant.tokenNumber}`);
                }
                await this.transactionRepository.save(transaction);
            }
            else if (invoiceData.status === 'EXPIRED' && transaction.paymentStatus === Transaction_1.PaymentStatus.PENDING) {
                transaction.paymentStatus = Transaction_1.PaymentStatus.EXPIRED;
                await this.transactionRepository.save(transaction);
            }
            return transaction;
        }
        catch (error) {
            console.error('❌ Check transaction status error:', error.message);
            throw new Error(`Failed to check transaction status: ${error.message}`);
        }
    }
    async handleNotification(payload) {
        try {
            console.log('🔔 Xendit webhook received:', payload.external_id);
            const transaction = await this.getTransactionByOrderId(payload.external_id);
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            if (payload.status === 'PAID') {
                transaction.paymentStatus = Transaction_1.PaymentStatus.PAID;
                transaction.paidAt = new Date(payload.paid_at);
                const paymentChannel = payload.payment_channel ? payload.payment_channel.toLowerCase() : 'xendit';
                transaction.paymentMethod = paymentChannel;
                const existingParticipant = await this.participantRepository.findOne({
                    where: { userId: transaction.userId, eventId: transaction.eventId }
                });
                if (!existingParticipant) {
                    const participant = new Participant_1.Participant();
                    participant.userId = transaction.userId;
                    participant.eventId = transaction.eventId;
                    participant.tokenNumber = (0, tokenGenerator_1.generateNumericToken)(10);
                    await this.participantRepository.save(participant);
                    console.log(`✅ Participant created with token: ${participant.tokenNumber}`);
                }
            }
            else if (payload.status === 'EXPIRED') {
                transaction.paymentStatus = Transaction_1.PaymentStatus.EXPIRED;
            }
            transaction.midtransResponse = payload;
            await this.transactionRepository.save(transaction);
            return transaction;
        }
        catch (error) {
            console.error('❌ Handle notification error:', error.message);
            throw new Error(`Failed to process notification: ${error.message}`);
        }
    }
    async cancelTransaction(orderId) {
        var _a, _b, _c;
        const transaction = await this.getTransactionByOrderId(orderId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        if (transaction.paymentStatus === Transaction_1.PaymentStatus.PAID) {
            throw new Error('Tidak dapat membatalkan transaksi yang sudah dibayar');
        }
        if (transaction.paymentStatus === Transaction_1.PaymentStatus.CANCELLED) {
            throw new Error('Transaksi sudah dibatalkan sebelumnya');
        }
        if (transaction.paymentStatus === Transaction_1.PaymentStatus.EXPIRED) {
            throw new Error('Transaksi sudah kadaluarsa dan tidak dapat dibatalkan');
        }
        if (transaction.paymentStatus === Transaction_1.PaymentStatus.FAILED) {
            throw new Error('Transaksi sudah gagal dan tidak dapat dibatalkan');
        }
        try {
            if (transaction.amount > 0 && transaction.snapToken) {
                try {
                    await this.apiClient.post(`/v2/invoices/${transaction.snapToken}/cancel`);
                    console.log(`✅ Xendit invoice cancelled: ${orderId}`);
                }
                catch (xenditError) {
                    if (((_a = xenditError.response) === null || _a === void 0 ? void 0 : _a.status) === 400 || ((_b = xenditError.response) === null || _b === void 0 ? void 0 : _b.status) === 404) {
                        console.warn(`⚠️ Xendit error - Invoice cannot be cancelled: ${orderId}`);
                    }
                    else {
                        throw xenditError;
                    }
                }
            }
            transaction.paymentStatus = Transaction_1.PaymentStatus.CANCELLED;
            return await this.transactionRepository.save(transaction);
        }
        catch (error) {
            console.error('❌ Cancel transaction error:', {
                orderId,
                message: error.message,
                status: (_c = error.response) === null || _c === void 0 ? void 0 : _c.status
            });
            throw new Error(`Gagal membatalkan transaksi: ${error.message}`);
        }
    }
    async getUserTransactions(userId) {
        return await this.transactionRepository.find({
            where: { userId },
            relations: ['event', 'participant'],
            order: { createdAt: 'DESC' }
        });
    }
    async getEventTransactions(eventId) {
        return await this.transactionRepository.find({
            where: { eventId },
            relations: ['user', 'participant'],
            order: { createdAt: 'DESC' }
        });
    }
    async getAllTransactions(filters) {
        let query = this.transactionRepository.createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.user', 'user')
            .leftJoinAndSelect('transaction.event', 'event');
        if (filters === null || filters === void 0 ? void 0 : filters.status) {
            query = query.where('transaction.paymentStatus = :status', { status: filters.status });
        }
        if (filters === null || filters === void 0 ? void 0 : filters.startDate) {
            query = query.andWhere('transaction.createdAt >= :startDate', { startDate: filters.startDate });
        }
        if (filters === null || filters === void 0 ? void 0 : filters.endDate) {
            query = query.andWhere('transaction.createdAt <= :endDate', { endDate: filters.endDate });
        }
        const total = await query.getCount();
        if (filters === null || filters === void 0 ? void 0 : filters.limit) {
            query = query.take(filters.limit);
        }
        if (filters === null || filters === void 0 ? void 0 : filters.offset) {
            query = query.skip(filters.offset);
        }
        const transactions = await query.orderBy('transaction.createdAt', 'DESC').getMany();
        return { transactions, total };
    }
    async getTransactionStatistics(eventId) {
        let query = this.transactionRepository.createQueryBuilder('transaction');
        if (eventId) {
            query = query.where('transaction.eventId = :eventId', { eventId });
        }
        const transactions = await query.getMany();
        const stats = {
            total: transactions.length,
            paid: transactions.filter(t => t.paymentStatus === Transaction_1.PaymentStatus.PAID).length,
            pending: transactions.filter(t => t.paymentStatus === Transaction_1.PaymentStatus.PENDING).length,
            failed: transactions.filter(t => t.paymentStatus === Transaction_1.PaymentStatus.FAILED).length,
            totalRevenue: transactions
                .filter(t => t.paymentStatus === Transaction_1.PaymentStatus.PAID)
                .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
        };
        console.log('📊 Transaction Statistics:', stats);
        return stats;
    }
    verifyWebhookSignature(payload, signature) {
        try {
            if (!this.callbackToken) {
                console.warn('⚠️ XENDIT_CALLBACK_TOKEN not configured - skipping signature verification');
                return true;
            }
            const computedSignature = crypto_1.default
                .createHmac('sha256', this.callbackToken)
                .update(JSON.stringify(payload))
                .digest('hex');
            return computedSignature === signature;
        }
        catch (error) {
            console.error('Webhook signature verification error:', error);
            return false;
        }
    }
}
exports.default = new XenditService();
//# sourceMappingURL=xenditService.js.map