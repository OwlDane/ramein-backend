import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Transaction, PaymentStatus } from '../entities/Transaction';
import logger from '../utils/logger';

export class FinancialController {
    static async getFinancialAnalytics(req: Request, res: Response) {
        try {
            const { startDate, endDate } = req.query;
            
            // Default to current year if no date range provided
            const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
            const end = endDate ? new Date(endDate as string) : new Date();

            const transactionRepository = AppDataSource.getRepository(Transaction);

            // Get all paid transactions in date range
            const transactions = await transactionRepository
                .createQueryBuilder('transaction')
                .leftJoinAndSelect('transaction.event', 'event')
                .where('transaction.paymentStatus = :status', { status: PaymentStatus.PAID })
                .andWhere('transaction.paidAt BETWEEN :start AND :end', { start, end })
                .getMany();

            // Calculate total revenue
            const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);

            // Monthly revenue
            const monthlyRevenueMap = new Map<string, { revenue: number; transactions: number }>();
            transactions.forEach(t => {
                if (t.paidAt) {
                    const month = new Date(t.paidAt).toLocaleDateString('id-ID', { month: 'short' });
                    const current = monthlyRevenueMap.get(month) || { revenue: 0, transactions: 0 };
                    monthlyRevenueMap.set(month, {
                        revenue: current.revenue + Number(t.totalAmount),
                        transactions: current.transactions + 1
                    });
                }
            });

            const monthlyRevenue = Array.from(monthlyRevenueMap.entries()).map(([month, data]) => ({
                month,
                ...data
            }));

            // Revenue by category
            const categoryRevenueMap = new Map<string, number>();
            transactions.forEach(t => {
                if (t.event) {
                    const categoryName = t.event.category || 'Lainnya';
                    categoryRevenueMap.set(
                        categoryName,
                        (categoryRevenueMap.get(categoryName) || 0) + Number(t.totalAmount)
                    );
                }
            });

            const revenueByCategory = Array.from(categoryRevenueMap.entries()).map(([category, revenue]) => ({
                category,
                revenue,
                percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
            }));

            // Payment methods distribution
            const paymentMethodMap = new Map<string, { count: number; amount: number }>();
            transactions.forEach(t => {
                const method = t.paymentMethod || 'QRIS';
                const current = paymentMethodMap.get(method) || { count: 0, amount: 0 };
                paymentMethodMap.set(method, {
                    count: current.count + 1,
                    amount: current.amount + Number(t.totalAmount)
                });
            });

            const paymentMethods = Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
                method,
                ...data
            }));

            // Calculate metrics - refunded transactions
            const refundedTransactions = await transactionRepository
                .createQueryBuilder('transaction')
                .where('transaction.paymentStatus = :status', { status: PaymentStatus.REFUNDED })
                .andWhere('transaction.createdAt BETWEEN :start AND :end', { start, end })
                .getMany();

            const refundAmount = refundedTransactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);
            const totalTransactionsCount = transactions.length + refundedTransactions.length;
            const refundRate = totalTransactionsCount > 0 
                ? (refundedTransactions.length / totalTransactionsCount) * 100 
                : 0;

            const averageTicketPrice = transactions.length > 0 
                ? totalRevenue / transactions.length 
                : 0;

            res.json({
                totalRevenue,
                monthlyRevenue,
                revenueByCategory,
                paymentMethods,
                metrics: {
                    averageTicketPrice,
                    totalTransactions: transactions.length,
                    refundRate,
                    refundAmount
                }
            });

        } catch (error) {
            logger.error('Get financial analytics error:', error);
            res.status(500).json({ 
                message: 'Terjadi kesalahan saat mengambil data finansial' 
            });
        }
    }
}
