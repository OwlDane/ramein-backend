"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MidtransService = void 0;
const midtrans_client_1 = __importDefault(require("midtrans-client"));
const database_1 = __importDefault(require("../config/database"));
const Transaction_1 = require("../entities/Transaction");
const Event_1 = require("../entities/Event");
const User_1 = require("../entities/User");
const Participant_1 = require("../entities/Participant");
const crypto_1 = __importDefault(require("crypto"));
class MidtransService {
    constructor() {
        this.transactionRepository = database_1.default.getRepository(Transaction_1.Transaction);
        this.eventRepository = database_1.default.getRepository(Event_1.Event);
        this.userRepository = database_1.default.getRepository(User_1.User);
        this.participantRepository = database_1.default.getRepository(Participant_1.Participant);
        this.snap = new midtrans_client_1.default.Snap({
            isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.MIDTRANS_CLIENT_KEY
        });
        this.coreApi = new midtrans_client_1.default.CoreApi({
            isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.MIDTRANS_CLIENT_KEY
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
        const percentage = amount * 0.02;
        const adminFee = Math.max(1000, Math.min(percentage, 10000));
        return Math.round(adminFee);
    }
    async createTransaction(userId, eventId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        if (!event) {
            throw new Error('Event not found');
        }
        const existingTransaction = await this.transactionRepository.findOne({
            where: {
                userId,
                eventId,
                paymentStatus: Transaction_1.PaymentStatus.PENDING
            }
        });
        if (existingTransaction) {
            return existingTransaction;
        }
        const orderId = this.generateOrderId();
        const amount = Number(event.price);
        const adminFee = this.calculateAdminFee(amount);
        const totalAmount = amount + adminFee;
        const transaction = this.transactionRepository.create({
            userId,
            eventId,
            orderId,
            amount,
            adminFee,
            totalAmount,
            paymentStatus: Transaction_1.PaymentStatus.PENDING,
            paymentMethod: amount === 0 ? Transaction_1.PaymentMethod.FREE : null,
            expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        if (amount === 0) {
            transaction.paymentStatus = Transaction_1.PaymentStatus.PAID;
            transaction.paidAt = new Date();
            transaction.notes = 'Free event - auto approved';
            const savedTransaction = await this.transactionRepository.save(transaction);
            await this.createParticipantFromTransaction(savedTransaction);
            return savedTransaction;
        }
        await this.transactionRepository.save(transaction);
        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: totalAmount
            },
            item_details: [
                {
                    id: event.id,
                    price: amount,
                    quantity: 1,
                    name: event.title,
                    category: event.category || 'Event'
                },
                {
                    id: 'admin_fee',
                    price: adminFee,
                    quantity: 1,
                    name: 'Admin Fee',
                    category: 'Fee'
                }
            ],
            customer_details: {
                first_name: user.name.split(' ')[0] || user.name,
                last_name: user.name.split(' ').slice(1).join(' ') || '',
                email: user.email,
                phone: user.phone,
                billing_address: {
                    address: user.address || 'N/A'
                }
            },
            callbacks: {
                finish: `${process.env.FRONTEND_URL}/payment/success?order_id=${orderId}`,
                error: `${process.env.FRONTEND_URL}/payment/error?order_id=${orderId}`,
                pending: `${process.env.FRONTEND_URL}/payment/pending?order_id=${orderId}`
            },
            expiry: {
                unit: 'hours',
                duration: 24
            },
            enabled_payments: [
                'credit_card',
                'bca_va',
                'bni_va',
                'bri_va',
                'mandiri_clickpay',
                'cimb_va',
                'other_va',
                'gopay',
                'shopeepay',
                'qris'
            ]
        };
        try {
            const snapTransaction = await this.snap.createTransaction(parameter);
            transaction.snapToken = snapTransaction.token;
            transaction.snapUrl = snapTransaction.redirect_url;
            transaction.midtransResponse = snapTransaction;
            return await this.transactionRepository.save(transaction);
        }
        catch (error) {
            transaction.paymentStatus = Transaction_1.PaymentStatus.FAILED;
            transaction.failureReason = error.message || 'Failed to create Midtrans transaction';
            await this.transactionRepository.save(transaction);
            throw new Error(`Failed to create payment: ${error.message}`);
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
    async getUserTransactions(userId) {
        return await this.transactionRepository.find({
            where: { userId },
            relations: ['event'],
            order: { createdAt: 'DESC' }
        });
    }
    async getEventTransactions(eventId) {
        return await this.transactionRepository.find({
            where: { eventId },
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });
    }
    async checkTransactionStatus(orderId) {
        const transaction = await this.getTransactionByOrderId(orderId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        if (transaction.paymentStatus === Transaction_1.PaymentStatus.PAID) {
            return transaction;
        }
        if (transaction.amount === 0) {
            return transaction;
        }
        try {
            const status = await this.coreApi.transaction.status(orderId);
            await this.updateTransactionFromMidtrans(transaction, status);
            return await this.getTransactionByOrderId(orderId);
        }
        catch (error) {
            console.error('Error checking transaction status:', error);
            throw new Error(`Failed to check transaction status: ${error.message}`);
        }
    }
    async handleNotification(notificationData) {
        const orderId = notificationData.order_id;
        const transaction = await this.getTransactionByOrderId(orderId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        const signatureKey = this.generateSignatureKey(notificationData);
        if (signatureKey !== notificationData.signature_key) {
            throw new Error('Invalid signature key');
        }
        await this.updateTransactionFromMidtrans(transaction, notificationData);
        return await this.getTransactionByOrderId(orderId);
    }
    async updateTransactionFromMidtrans(transaction, midtransData) {
        const transactionStatus = midtransData.transaction_status;
        const fraudStatus = midtransData.fraud_status;
        const paymentType = midtransData.payment_type;
        transaction.midtransResponse = midtransData;
        transaction.transactionId = midtransData.transaction_id;
        transaction.paymentType = paymentType;
        transaction.paymentMethod = this.mapPaymentMethod(paymentType, midtransData);
        if (midtransData.va_numbers && midtransData.va_numbers.length > 0) {
            transaction.vaNumber = midtransData.va_numbers[0].va_number;
            transaction.bankName = midtransData.va_numbers[0].bank;
        }
        else if (midtransData.permata_va_number) {
            transaction.vaNumber = midtransData.permata_va_number;
            transaction.bankName = 'permata';
        }
        if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
            if (fraudStatus === 'accept' || fraudStatus === undefined) {
                transaction.paymentStatus = Transaction_1.PaymentStatus.PAID;
                transaction.paidAt = new Date();
                await this.createParticipantFromTransaction(transaction);
            }
        }
        else if (transactionStatus === 'pending') {
            transaction.paymentStatus = Transaction_1.PaymentStatus.PENDING;
        }
        else if (transactionStatus === 'deny' || transactionStatus === 'cancel') {
            transaction.paymentStatus = Transaction_1.PaymentStatus.FAILED;
            transaction.failureReason = `Transaction ${transactionStatus}`;
        }
        else if (transactionStatus === 'expire') {
            transaction.paymentStatus = Transaction_1.PaymentStatus.EXPIRED;
        }
        else if (transactionStatus === 'refund') {
            transaction.paymentStatus = Transaction_1.PaymentStatus.REFUNDED;
            transaction.isRefunded = true;
            transaction.refundedAt = new Date();
        }
        await this.transactionRepository.save(transaction);
    }
    async createParticipantFromTransaction(transaction) {
        const existingParticipant = await this.participantRepository.findOne({
            where: {
                userId: transaction.userId,
                eventId: transaction.eventId
            }
        });
        if (existingParticipant) {
            transaction.participantId = existingParticipant.id;
            await this.transactionRepository.save(transaction);
            return;
        }
        const tokenNumber = await this.generateTokenNumber(transaction.eventId);
        const participant = this.participantRepository.create({
            userId: transaction.userId,
            eventId: transaction.eventId,
            tokenNumber,
            hasAttended: false
        });
        const savedParticipant = await this.participantRepository.save(participant);
        transaction.participantId = savedParticipant.id;
        await this.transactionRepository.save(transaction);
    }
    async generateTokenNumber(eventId) {
        const count = await this.participantRepository.count({ where: { eventId } });
        const paddedNumber = String(count + 1).padStart(4, '0');
        const eventPrefix = eventId.substring(0, 4).toUpperCase();
        return `${eventPrefix}-${paddedNumber}`;
    }
    mapPaymentMethod(paymentType, data) {
        const mapping = {
            'credit_card': Transaction_1.PaymentMethod.CREDIT_CARD,
            'gopay': Transaction_1.PaymentMethod.GOPAY,
            'shopeepay': Transaction_1.PaymentMethod.SHOPEEPAY,
            'qris': Transaction_1.PaymentMethod.QRIS,
        };
        if (paymentType === 'bank_transfer' && data.va_numbers) {
            const bank = data.va_numbers[0].bank.toLowerCase();
            const bankMapping = {
                'bca': Transaction_1.PaymentMethod.BCA_VA,
                'bni': Transaction_1.PaymentMethod.BNI_VA,
                'bri': Transaction_1.PaymentMethod.BRI_VA,
                'mandiri': Transaction_1.PaymentMethod.MANDIRI_VA,
                'permata': Transaction_1.PaymentMethod.PERMATA_VA,
                'cimb': Transaction_1.PaymentMethod.CIMB_VA,
            };
            return bankMapping[bank] || Transaction_1.PaymentMethod.BANK_TRANSFER;
        }
        return mapping[paymentType] || Transaction_1.PaymentMethod.BANK_TRANSFER;
    }
    generateSignatureKey(data) {
        const orderId = data.order_id;
        const statusCode = data.status_code;
        const grossAmount = data.gross_amount;
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        const signatureString = `${orderId}${statusCode}${grossAmount}${serverKey}`;
        return crypto_1.default.createHash('sha512').update(signatureString).digest('hex');
    }
    async cancelTransaction(orderId) {
        const transaction = await this.getTransactionByOrderId(orderId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        if (transaction.paymentStatus === Transaction_1.PaymentStatus.PAID) {
            throw new Error('Cannot cancel paid transaction');
        }
        try {
            if (transaction.amount > 0) {
                await this.coreApi.transaction.cancel(orderId);
            }
            transaction.paymentStatus = Transaction_1.PaymentStatus.CANCELLED;
            return await this.transactionRepository.save(transaction);
        }
        catch (error) {
            throw new Error(`Failed to cancel transaction: ${error.message}`);
        }
    }
    async getAllTransactions(filters) {
        const queryBuilder = this.transactionRepository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.user', 'user')
            .leftJoinAndSelect('transaction.event', 'event');
        if (filters === null || filters === void 0 ? void 0 : filters.status) {
            queryBuilder.andWhere('transaction.paymentStatus = :status', { status: filters.status });
        }
        if (filters === null || filters === void 0 ? void 0 : filters.startDate) {
            queryBuilder.andWhere('transaction.createdAt >= :startDate', { startDate: filters.startDate });
        }
        if (filters === null || filters === void 0 ? void 0 : filters.endDate) {
            queryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate: filters.endDate });
        }
        queryBuilder.orderBy('transaction.createdAt', 'DESC');
        const total = await queryBuilder.getCount();
        if (filters === null || filters === void 0 ? void 0 : filters.limit) {
            queryBuilder.take(filters.limit);
        }
        if (filters === null || filters === void 0 ? void 0 : filters.offset) {
            queryBuilder.skip(filters.offset);
        }
        const transactions = await queryBuilder.getMany();
        return { transactions, total };
    }
    async getTransactionStatistics(eventId) {
        const queryBuilder = this.transactionRepository
            .createQueryBuilder('transaction');
        if (eventId) {
            queryBuilder.where('transaction.eventId = :eventId', { eventId });
        }
        const total = await queryBuilder.getCount();
        const paid = await queryBuilder.clone().where('transaction.paymentStatus = :status', { status: Transaction_1.PaymentStatus.PAID }).getCount();
        const pending = await queryBuilder.clone().where('transaction.paymentStatus = :status', { status: Transaction_1.PaymentStatus.PENDING }).getCount();
        const failed = await queryBuilder.clone().where('transaction.paymentStatus = :status', { status: Transaction_1.PaymentStatus.FAILED }).getCount();
        const totalRevenue = await queryBuilder
            .select('SUM(transaction.totalAmount)', 'total')
            .where('transaction.paymentStatus = :status', { status: Transaction_1.PaymentStatus.PAID })
            .getRawOne();
        return {
            total,
            paid,
            pending,
            failed,
            totalRevenue: Number((totalRevenue === null || totalRevenue === void 0 ? void 0 : totalRevenue.total) || 0)
        };
    }
}
exports.MidtransService = MidtransService;
exports.default = new MidtransService();
//# sourceMappingURL=midtransService.js.map