import midtransClient from 'midtrans-client';
import AppDataSource from '../config/database';
import { Transaction, PaymentStatus, PaymentMethod } from '../entities/Transaction';
import { Event } from '../entities/Event';
import { User } from '../entities/User';
import { Participant } from '../entities/Participant';
import crypto from 'crypto';

export class MidtransService {
    private snap: any;
    private coreApi: any;
    private transactionRepository = AppDataSource.getRepository(Transaction);
    private eventRepository = AppDataSource.getRepository(Event);
    private userRepository = AppDataSource.getRepository(User);
    private participantRepository = AppDataSource.getRepository(Participant);

    constructor() {
        // Initialize Snap for payment page
        this.snap = new midtransClient.Snap({
            isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.MIDTRANS_CLIENT_KEY
        });

        // Initialize Core API for transaction status
        this.coreApi = new midtransClient.CoreApi({
            isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.MIDTRANS_CLIENT_KEY
        });
    }

    /**
     * Generate unique order ID
     */
    private generateOrderId(): string {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex').toUpperCase();
        return `RAMEIN-${timestamp}-${random}`;
    }

    /**
     * Calculate admin fee (you can customize this)
     */
    private calculateAdminFee(amount: number): number {
        // For free events, no admin fee
        if (amount === 0) return 0;

        // Example: 2% admin fee with minimum Rp 1,000 and maximum Rp 10,000
        const percentage = amount * 0.02;
        const adminFee = Math.max(1000, Math.min(percentage, 10000));
        return Math.round(adminFee);
    }

    /**
     * Create transaction and get Snap token
     */
    async createTransaction(userId: string, eventId: string): Promise<Transaction> {
        // Get user and event data
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        if (!event) {
            throw new Error('Event not found');
        }

        // Check if user already has a transaction for this event
        const existingTransaction = await this.transactionRepository.findOne({
            where: {
                userId,
                eventId,
                paymentStatus: PaymentStatus.PENDING
            }
        });

        if (existingTransaction) {
            // Return existing pending transaction
            return existingTransaction;
        }

        // Generate order ID
        const orderId = this.generateOrderId();

        // Calculate amounts
        const amount = Number(event.price);
        const adminFee = this.calculateAdminFee(amount);
        const totalAmount = amount + adminFee;

        // Create transaction record
        const transaction = this.transactionRepository.create({
            userId,
            eventId,
            orderId,
            amount,
            adminFee,
            totalAmount,
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod: amount === 0 ? PaymentMethod.FREE : null,
            expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        // For free events, auto-approve
        if (amount === 0) {
            transaction.paymentStatus = PaymentStatus.PAID;
            transaction.paidAt = new Date();
            transaction.notes = 'Free event - auto approved';

            const savedTransaction = await this.transactionRepository.save(transaction);

            // Auto create participant for free events
            await this.createParticipantFromTransaction(savedTransaction);

            return savedTransaction;
        }

        // Save transaction first
        await this.transactionRepository.save(transaction);

        // Create Midtrans transaction parameter
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
            // Create Snap transaction
            const snapTransaction = await this.snap.createTransaction(parameter);

            // Update transaction with Snap data
            transaction.snapToken = snapTransaction.token;
            transaction.snapUrl = snapTransaction.redirect_url;
            transaction.midtransResponse = snapTransaction;

            return await this.transactionRepository.save(transaction);
        } catch (error: any) {
            // Update transaction status to failed
            transaction.paymentStatus = PaymentStatus.FAILED;
            transaction.failureReason = error.message || 'Failed to create Midtrans transaction';
            await this.transactionRepository.save(transaction);

            throw new Error(`Failed to create payment: ${error.message}`);
        }
    }

    /**
     * Get transaction by order ID
     */
    async getTransactionByOrderId(orderId: string): Promise<Transaction | null> {
        return await this.transactionRepository.findOne({
            where: { orderId },
            relations: ['user', 'event', 'participant']
        });
    }

    /**
     * Get transaction by ID
     */
    async getTransactionById(id: string): Promise<Transaction | null> {
        return await this.transactionRepository.findOne({
            where: { id },
            relations: ['user', 'event', 'participant']
        });
    }

    /**
     * Get user transactions
     */
    async getUserTransactions(userId: string): Promise<Transaction[]> {
        return await this.transactionRepository.find({
            where: { userId },
            relations: ['event'],
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Get event transactions
     */
    async getEventTransactions(eventId: string): Promise<Transaction[]> {
        return await this.transactionRepository.find({
            where: { eventId },
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Check transaction status from Midtrans
     */
    async checkTransactionStatus(orderId: string): Promise<Transaction> {
        const transaction = await this.getTransactionByOrderId(orderId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        // If already paid, return as is
        if (transaction.paymentStatus === PaymentStatus.PAID) {
            return transaction;
        }

        // For free events, return as is
        if (transaction.amount === 0) {
            return transaction;
        }

        try {
            // Get status from Midtrans
            const status = await this.coreApi.transaction.status(orderId);

            // Update transaction based on Midtrans status
            await this.updateTransactionFromMidtrans(transaction, status);

            // Return updated transaction
            return await this.getTransactionByOrderId(orderId) as Transaction;
        } catch (error: any) {
            console.error('Error checking transaction status:', error);
            throw new Error(`Failed to check transaction status: ${error.message}`);
        }
    }

    /**
     * Handle Midtrans notification/webhook
     */
    async handleNotification(notificationData: any): Promise<Transaction> {
        const orderId = notificationData.order_id;

        const transaction = await this.getTransactionByOrderId(orderId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        // Verify signature (important for security)
        const signatureKey = this.generateSignatureKey(notificationData);
        if (signatureKey !== notificationData.signature_key) {
            throw new Error('Invalid signature key');
        }

        // Update transaction
        await this.updateTransactionFromMidtrans(transaction, notificationData);

        return await this.getTransactionByOrderId(orderId) as Transaction;
    }

    /**
     * Update transaction from Midtrans response
     */
    private async updateTransactionFromMidtrans(transaction: Transaction, midtransData: any): Promise<void> {
        const transactionStatus = midtransData.transaction_status;
        const fraudStatus = midtransData.fraud_status;
        const paymentType = midtransData.payment_type;

        // Store Midtrans response
        transaction.midtransResponse = midtransData;
        transaction.transactionId = midtransData.transaction_id;
        transaction.paymentType = paymentType;

        // Map payment method
        transaction.paymentMethod = this.mapPaymentMethod(paymentType, midtransData);

        // Store VA number if applicable
        if (midtransData.va_numbers && midtransData.va_numbers.length > 0) {
            transaction.vaNumber = midtransData.va_numbers[0].va_number;
            transaction.bankName = midtransData.va_numbers[0].bank;
        } else if (midtransData.permata_va_number) {
            transaction.vaNumber = midtransData.permata_va_number;
            transaction.bankName = 'permata';
        }

        // Update status based on Midtrans response
        if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
            if (fraudStatus === 'accept' || fraudStatus === undefined) {
                transaction.paymentStatus = PaymentStatus.PAID;
                transaction.paidAt = new Date();

                // Create participant after successful payment
                await this.createParticipantFromTransaction(transaction);
            }
        } else if (transactionStatus === 'pending') {
            transaction.paymentStatus = PaymentStatus.PENDING;
        } else if (transactionStatus === 'deny' || transactionStatus === 'cancel') {
            transaction.paymentStatus = PaymentStatus.FAILED;
            transaction.failureReason = `Transaction ${transactionStatus}`;
        } else if (transactionStatus === 'expire') {
            transaction.paymentStatus = PaymentStatus.EXPIRED;
        } else if (transactionStatus === 'refund') {
            transaction.paymentStatus = PaymentStatus.REFUNDED;
            transaction.isRefunded = true;
            transaction.refundedAt = new Date();
        }

        await this.transactionRepository.save(transaction);
    }

    /**
     * Create participant after successful payment
     */
    private async createParticipantFromTransaction(transaction: Transaction): Promise<void> {
        // Check if participant already exists
        const existingParticipant = await this.participantRepository.findOne({
            where: {
                userId: transaction.userId,
                eventId: transaction.eventId
            }
        });

        if (existingParticipant) {
            // Link transaction to existing participant
            transaction.participantId = existingParticipant.id;
            await this.transactionRepository.save(transaction);
            return;
        }

        // Generate token number for participant
        const tokenNumber = await this.generateTokenNumber(transaction.eventId);

        // Create new participant
        const participant = this.participantRepository.create({
            userId: transaction.userId,
            eventId: transaction.eventId,
            tokenNumber,
            hasAttended: false
        });

        const savedParticipant = await this.participantRepository.save(participant);

        // Link transaction to participant
        transaction.participantId = savedParticipant.id;
        await this.transactionRepository.save(transaction);
    }

    /**
     * Generate unique token number for participant
     */
    private async generateTokenNumber(eventId: string): Promise<string> {
        const count = await this.participantRepository.count({ where: { eventId } });
        const paddedNumber = String(count + 1).padStart(4, '0');
        const eventPrefix = eventId.substring(0, 4).toUpperCase();
        return `${eventPrefix}-${paddedNumber}`;
    }

    /**
     * Map Midtrans payment type to our enum
     */
    private mapPaymentMethod(paymentType: string, data: any): PaymentMethod {
        const mapping: { [key: string]: PaymentMethod } = {
            'credit_card': PaymentMethod.CREDIT_CARD,
            'gopay': PaymentMethod.GOPAY,
            'shopeepay': PaymentMethod.SHOPEEPAY,
            'qris': PaymentMethod.QRIS,
        };

        // Handle bank transfer
        if (paymentType === 'bank_transfer' && data.va_numbers) {
            const bank = data.va_numbers[0].bank.toLowerCase();
            const bankMapping: { [key: string]: PaymentMethod } = {
                'bca': PaymentMethod.BCA_VA,
                'bni': PaymentMethod.BNI_VA,
                'bri': PaymentMethod.BRI_VA,
                'mandiri': PaymentMethod.MANDIRI_VA,
                'permata': PaymentMethod.PERMATA_VA,
                'cimb': PaymentMethod.CIMB_VA,
            };
            return bankMapping[bank] || PaymentMethod.BANK_TRANSFER;
        }

        return mapping[paymentType] || PaymentMethod.BANK_TRANSFER;
    }

    /**
     * Generate signature key for verification
     */
    private generateSignatureKey(data: any): string {
        const orderId = data.order_id;
        const statusCode = data.status_code;
        const grossAmount = data.gross_amount;
        const serverKey = process.env.MIDTRANS_SERVER_KEY;

        const signatureString = `${orderId}${statusCode}${grossAmount}${serverKey}`;
        return crypto.createHash('sha512').update(signatureString).digest('hex');
    }

    /**
     * Cancel transaction
     */
    async cancelTransaction(orderId: string): Promise<Transaction> {
        const transaction = await this.getTransactionByOrderId(orderId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        if (transaction.paymentStatus === PaymentStatus.PAID) {
            throw new Error('Cannot cancel paid transaction');
        }

        try {
            // Cancel in Midtrans if not free
            if (transaction.amount > 0) {
                await this.coreApi.transaction.cancel(orderId);
            }

            transaction.paymentStatus = PaymentStatus.CANCELLED;
            return await this.transactionRepository.save(transaction);
        } catch (error: any) {
            throw new Error(`Failed to cancel transaction: ${error.message}`);
        }
    }

    /**
     * Get all transactions (for admin)
     */
    async getAllTransactions(filters?: {
        status?: PaymentStatus;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{ transactions: Transaction[]; total: number }> {
        const queryBuilder = this.transactionRepository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.user', 'user')
            .leftJoinAndSelect('transaction.event', 'event');

        if (filters?.status) {
            queryBuilder.andWhere('transaction.paymentStatus = :status', { status: filters.status });
        }

        if (filters?.startDate) {
            queryBuilder.andWhere('transaction.createdAt >= :startDate', { startDate: filters.startDate });
        }

        if (filters?.endDate) {
            queryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate: filters.endDate });
        }

        queryBuilder.orderBy('transaction.createdAt', 'DESC');

        const total = await queryBuilder.getCount();

        if (filters?.limit) {
            queryBuilder.take(filters.limit);
        }

        if (filters?.offset) {
            queryBuilder.skip(filters.offset);
        }

        const transactions = await queryBuilder.getMany();

        return { transactions, total };
    }

    /**
     * Get transaction statistics
     */
    async getTransactionStatistics(eventId?: string): Promise<any> {
        const queryBuilder = this.transactionRepository
            .createQueryBuilder('transaction');

        if (eventId) {
            queryBuilder.where('transaction.eventId = :eventId', { eventId });
        }

        const total = await queryBuilder.getCount();
        const paid = await queryBuilder.clone().where('transaction.paymentStatus = :status', { status: PaymentStatus.PAID }).getCount();
        const pending = await queryBuilder.clone().where('transaction.paymentStatus = :status', { status: PaymentStatus.PENDING }).getCount();
        const failed = await queryBuilder.clone().where('transaction.paymentStatus = :status', { status: PaymentStatus.FAILED }).getCount();

        const totalRevenue = await queryBuilder
            .select('SUM(transaction.totalAmount)', 'total')
            .where('transaction.paymentStatus = :status', { status: PaymentStatus.PAID })
            .getRawOne();

        return {
            total,
            paid,
            pending,
            failed,
            totalRevenue: Number(totalRevenue?.total || 0)
        };
    }
}

export default new MidtransService();
