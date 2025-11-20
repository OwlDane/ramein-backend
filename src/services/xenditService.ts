import axios, { AxiosInstance } from 'axios';
import AppDataSource from '../config/database';
import { Transaction, PaymentStatus } from '../entities/Transaction';
import { Event } from '../entities/Event';
import { User } from '../entities/User';
import { Participant } from '../entities/Participant';
import crypto from 'crypto';
import { generateNumericToken } from '../utils/tokenGenerator';

interface XenditInvoiceRequest {
    external_id: string;
    amount: number;
    description: string;
    invoice_duration?: number;
    customer: {
        given_names: string;
        email: string;
        mobile_number?: string;
    };
    items?: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    fees?: Array<{
        type: string;
        value: number;
    }>;
    success_redirect_url?: string;
    failure_redirect_url?: string;
}

interface XenditInvoiceResponse {
    id: string;
    external_id: string;
    user_id: string;
    status: string;
    merchant_name: string;
    merchant_profile_picture_url: string;
    amount: number;
    payer_email: string;
    description: string;
    expiry_date: string;
    invoice_url: string;
    available_banks: Array<{
        bank_code: string;
        collection_type: string;
        bank_account_number: string;
        transfer_amount: number;
        bank_branch: string;
        account_holder_name: string;
    }>;
    available_ewallets: Array<{
        ewallet_type: string;
        amount: number;
    }>;
    available_retail_outlets: Array<{
        retail_outlet_name: string;
        amount: number;
        payment_code: string;
        expires_at: string;
    }>;
    should_exclude_credit_card: boolean;
    should_send_email: boolean;
    created: string;
    updated: string;
    items?: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    fees?: Array<{
        type: string;
        value: number;
    }>;
    currency: string;
    paid_amount: number;
    paid_at?: string;
    payment_method?: string;
    payment_channel?: string;
    payment_id?: string;
    settlement_status?: string;
}

interface XenditWebhookPayload {
    id: string;
    external_id: string;
    user_id: string;
    status: string;
    merchant_name: string;
    amount: number;
    payer_email: string;
    description: string;
    paid_amount: number;
    paid_at: string;
    payment_method: string;
    payment_channel: string;
    payment_id: string;
    settlement_status: string;
    created: string;
    updated: string;
}

class XenditService {
    private apiClient: AxiosInstance;
    private callbackToken: string;
    private transactionRepository = AppDataSource.getRepository(Transaction);
    private eventRepository = AppDataSource.getRepository(Event);
    private userRepository = AppDataSource.getRepository(User);
    private participantRepository = AppDataSource.getRepository(Participant);

    constructor() {
        const apiKey = process.env.XENDIT_API_KEY || '';
        this.callbackToken = process.env.XENDIT_CALLBACK_TOKEN || '';

        if (!apiKey) {
            console.warn('⚠️ XENDIT_API_KEY not configured');
        }

        // Create Axios instance with Xendit API base URL
        this.apiClient = axios.create({
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

    /**
     * Generate order ID
     */
    private generateOrderId(): string {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex').toUpperCase();
        return `RAMEIN-${timestamp}-${random}`;
    }

    /**
     * Calculate admin fee
     */
    private calculateAdminFee(amount: number): number {
        if (amount === 0) return 0;
        // Xendit fee: 1.5% + Rp 1000 minimum
        return Math.max(1000, Math.round(amount * 0.015));
    }

    /**
     * Create invoice (payment request)
     */
    async createTransaction(userId: string, eventId: string): Promise<any> {
        try {
            // Get user and event
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) {
                throw new Error('User not found');
            }

            const event = await this.eventRepository.findOne({ where: { id: eventId } });
            if (!event) {
                throw new Error('Event not found');
            }

            // Check if user already registered
            const existingParticipant = await this.participantRepository.findOne({
                where: { userId, eventId }
            });

            if (existingParticipant) {
                throw new Error('User already registered for this event');
            }

            // Calculate amounts
            const amount = Number(event.price) || 0;
            const adminFee = this.calculateAdminFee(amount);
            const totalAmount = amount + adminFee;

            // Generate order ID
            const orderId = this.generateOrderId();

            // Create transaction record
            const transaction = new Transaction();
            transaction.userId = userId;
            transaction.eventId = eventId;
            transaction.orderId = orderId;
            transaction.amount = amount;
            transaction.adminFee = adminFee;
            transaction.totalAmount = totalAmount;
            transaction.paymentStatus = amount === 0 ? PaymentStatus.PAID : PaymentStatus.PENDING;

            // If free event, auto-approve
            if (amount === 0) {
                transaction.paidAt = new Date();
                transaction.notes = 'Free event - auto approved';
                await this.transactionRepository.save(transaction);

                // Create participant record
                const participant = new Participant();
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

            // Save transaction first
            await this.transactionRepository.save(transaction);

            // Create Xendit invoice
            const invoiceRequest: XenditInvoiceRequest = {
                external_id: orderId,
                amount: totalAmount,
                description: `Payment for ${event.title}`,
                invoice_duration: 24 * 3600, // 24 hours in seconds
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

            const response = await this.apiClient.post<XenditInvoiceResponse>(
                '/v2/invoices',
                invoiceRequest
            );

            const invoiceData = response.data;

            console.log('✅ Xendit invoice created:', invoiceData.id);

            // Update transaction with invoice data
            transaction.snapToken = invoiceData.id; // Store invoice ID as token
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
        } catch (error: any) {
            console.error('❌ Xendit API Error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText,
                fullError: error
            });

            // Provide more detailed error message
            let errorMessage = error.message;
            if (error.response?.data?.error_code) {
                errorMessage = `${error.response.data.error_code}: ${error.response.data.message || error.message}`;
            }

            throw new Error(`Failed to create payment: ${errorMessage}`);
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
     * Check transaction status from Xendit
     */
    async checkTransactionStatus(orderId: string): Promise<Transaction | null> {
        try {
            const transaction = await this.getTransactionByOrderId(orderId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }

            // Get invoice from Xendit
            const response = await this.apiClient.get<XenditInvoiceResponse>(
                `/v2/invoices/${transaction.snapToken}`
            );

            const invoiceData = response.data;

            console.log('📊 Xendit invoice status:', invoiceData.status);

            // Update transaction status based on invoice status
            if (invoiceData.status === 'PAID' && transaction.paymentStatus !== PaymentStatus.PAID) {
                transaction.paymentStatus = PaymentStatus.PAID;
                transaction.paidAt = new Date(invoiceData.paid_at || new Date());
                // Convert payment channel to lowercase for enum compatibility
                const paymentChannel = invoiceData.payment_channel ? invoiceData.payment_channel.toLowerCase() : 'xendit';
                transaction.paymentMethod = paymentChannel as any;

                // Create participant record
                const existingParticipant = await this.participantRepository.findOne({
                    where: { userId: transaction.userId, eventId: transaction.eventId }
                });

                if (!existingParticipant) {
                    const participant = new Participant();
                    participant.userId = transaction.userId;
                    participant.eventId = transaction.eventId;
                    participant.tokenNumber = generateNumericToken(10); // Generate 10-digit token
                    await this.participantRepository.save(participant);
                    console.log(`✅ Participant created with token: ${participant.tokenNumber}`);
                }

                await this.transactionRepository.save(transaction);
            } else if (invoiceData.status === 'EXPIRED' && transaction.paymentStatus === PaymentStatus.PENDING) {
                transaction.paymentStatus = PaymentStatus.EXPIRED;
                await this.transactionRepository.save(transaction);
            }

            return transaction;
        } catch (error: any) {
            console.error('❌ Check transaction status error:', error.message);
            throw new Error(`Failed to check transaction status: ${error.message}`);
        }
    }

    /**
     * Handle Xendit webhook notification
     */
    async handleNotification(payload: XenditWebhookPayload): Promise<Transaction> {
        try {
            console.log('🔔 Xendit webhook received:', payload.external_id);

            const transaction = await this.getTransactionByOrderId(payload.external_id);
            if (!transaction) {
                throw new Error('Transaction not found');
            }

            // Update transaction based on payment status
            if (payload.status === 'PAID') {
                transaction.paymentStatus = PaymentStatus.PAID;
                transaction.paidAt = new Date(payload.paid_at);
                // Convert payment channel to lowercase for enum compatibility
                const paymentChannel = payload.payment_channel ? payload.payment_channel.toLowerCase() : 'xendit';
                transaction.paymentMethod = paymentChannel as any;

                // Create participant record
                const existingParticipant = await this.participantRepository.findOne({
                    where: { userId: transaction.userId, eventId: transaction.eventId }
                });

                if (!existingParticipant) {
                    const participant = new Participant();
                    participant.userId = transaction.userId;
                    participant.eventId = transaction.eventId;
                    participant.tokenNumber = generateNumericToken(10); // Generate 10-digit token
                    await this.participantRepository.save(participant);
                    console.log(`✅ Participant created with token: ${participant.tokenNumber}`);
                }
            } else if (payload.status === 'EXPIRED') {
                transaction.paymentStatus = PaymentStatus.EXPIRED;
            }

            transaction.midtransResponse = payload;
            await this.transactionRepository.save(transaction);

            return transaction;
        } catch (error: any) {
            console.error('❌ Handle notification error:', error.message);
            throw new Error(`Failed to process notification: ${error.message}`);
        }
    }

    /**
     * Cancel transaction
     */
    async cancelTransaction(orderId: string): Promise<Transaction> {
        const transaction = await this.getTransactionByOrderId(orderId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        // Check if transaction can be cancelled
        if (transaction.paymentStatus === PaymentStatus.PAID) {
            throw new Error('Tidak dapat membatalkan transaksi yang sudah dibayar');
        }

        if (transaction.paymentStatus === PaymentStatus.CANCELLED) {
            throw new Error('Transaksi sudah dibatalkan sebelumnya');
        }

        if (transaction.paymentStatus === PaymentStatus.EXPIRED) {
            throw new Error('Transaksi sudah kadaluarsa dan tidak dapat dibatalkan');
        }

        if (transaction.paymentStatus === PaymentStatus.FAILED) {
            throw new Error('Transaksi sudah gagal dan tidak dapat dibatalkan');
        }

        try {
            // Cancel invoice in Xendit if not free
            if (transaction.amount > 0 && transaction.snapToken) {
                try {
                    await this.apiClient.post(
                        `/v2/invoices/${transaction.snapToken}/cancel`
                    );
                    console.log(`✅ Xendit invoice cancelled: ${orderId}`);
                } catch (xenditError: any) {
                    // If invoice already paid or expired, still mark as cancelled locally
                    if (xenditError.response?.status === 400 || xenditError.response?.status === 404) {
                        console.warn(`⚠️ Xendit error - Invoice cannot be cancelled: ${orderId}`);
                    } else {
                        throw xenditError;
                    }
                }
            }

            transaction.paymentStatus = PaymentStatus.CANCELLED;
            return await this.transactionRepository.save(transaction);
        } catch (error: any) {
            console.error('❌ Cancel transaction error:', {
                orderId,
                message: error.message,
                status: error.response?.status
            });
            throw new Error(`Gagal membatalkan transaksi: ${error.message}`);
        }
    }

    /**
     * Get user's transactions
     */
    async getUserTransactions(userId: string): Promise<Transaction[]> {
        return await this.transactionRepository.find({
            where: { userId },
            relations: ['event', 'participant'],
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Get event transactions
     */
    async getEventTransactions(eventId: string): Promise<Transaction[]> {
        return await this.transactionRepository.find({
            where: { eventId },
            relations: ['user', 'participant'],
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Get all transactions
     */
    async getAllTransactions(filters?: {
        status?: PaymentStatus;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{ transactions: Transaction[]; total: number }> {
        let query = this.transactionRepository.createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.user', 'user')
            .leftJoinAndSelect('transaction.event', 'event');

        if (filters?.status) {
            query = query.where('transaction.paymentStatus = :status', { status: filters.status });
        }

        if (filters?.startDate) {
            query = query.andWhere('transaction.createdAt >= :startDate', { startDate: filters.startDate });
        }

        if (filters?.endDate) {
            query = query.andWhere('transaction.createdAt <= :endDate', { endDate: filters.endDate });
        }

        const total = await query.getCount();

        if (filters?.limit) {
            query = query.take(filters.limit);
        }

        if (filters?.offset) {
            query = query.skip(filters.offset);
        }

        const transactions = await query.orderBy('transaction.createdAt', 'DESC').getMany();

        return { transactions, total };
    }

    /**
     * Get transaction statistics
     */
    async getTransactionStatistics(eventId?: string): Promise<{
        total: number;
        paid: number;
        pending: number;
        failed: number;
        totalRevenue: number;
    }> {
        let query = this.transactionRepository.createQueryBuilder('transaction');

        if (eventId) {
            query = query.where('transaction.eventId = :eventId', { eventId });
        }

        const transactions = await query.getMany();

        const stats = {
            total: transactions.length,
            paid: transactions.filter(t => t.paymentStatus === PaymentStatus.PAID).length,
            pending: transactions.filter(t => t.paymentStatus === PaymentStatus.PENDING).length,
            failed: transactions.filter(t => t.paymentStatus === PaymentStatus.FAILED).length,
            totalRevenue: transactions
                .filter(t => t.paymentStatus === PaymentStatus.PAID)
                .reduce((sum, t) => sum + t.amount, 0)
        };

        return stats;
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload: any, signature: string): boolean {
        try {
            if (!this.callbackToken) {
                console.warn('⚠️ XENDIT_CALLBACK_TOKEN not configured - skipping signature verification');
                return true; // Allow if token not configured
            }

            const computedSignature = crypto
                .createHmac('sha256', this.callbackToken)
                .update(JSON.stringify(payload))
                .digest('hex');

            return computedSignature === signature;
        } catch (error) {
            console.error('Webhook signature verification error:', error);
            return false;
        }
    }
}

export default new XenditService();
