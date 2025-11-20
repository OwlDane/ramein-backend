"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialController = void 0;
const database_1 = __importDefault(require("../config/database"));
const Transaction_1 = require("../entities/Transaction");
const logger_1 = __importDefault(require("../utils/logger"));
class FinancialController {
    static async getFinancialAnalytics(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
            const end = endDate ? new Date(endDate) : new Date();
            const transactionRepository = database_1.default.getRepository(Transaction_1.Transaction);
            const transactions = await transactionRepository
                .createQueryBuilder('transaction')
                .leftJoinAndSelect('transaction.event', 'event')
                .where('transaction.paymentStatus = :status', { status: Transaction_1.PaymentStatus.PAID })
                .andWhere('transaction.paidAt BETWEEN :start AND :end', { start, end })
                .getMany();
            const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);
            const monthlyRevenueMap = new Map();
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
            const categoryRevenueMap = new Map();
            transactions.forEach(t => {
                if (t.event) {
                    const categoryName = t.event.category || 'Lainnya';
                    categoryRevenueMap.set(categoryName, (categoryRevenueMap.get(categoryName) || 0) + Number(t.totalAmount));
                }
            });
            const revenueByCategory = Array.from(categoryRevenueMap.entries()).map(([category, revenue]) => ({
                category,
                revenue,
                percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
            }));
            const paymentMethodMap = new Map();
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
            const refundedTransactions = await transactionRepository
                .createQueryBuilder('transaction')
                .where('transaction.paymentStatus = :status', { status: Transaction_1.PaymentStatus.REFUNDED })
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
        }
        catch (error) {
            logger_1.default.error('Get financial analytics error:', error);
            res.status(500).json({
                message: 'Terjadi kesalahan saat mengambil data finansial'
            });
        }
    }
}
exports.FinancialController = FinancialController;
//# sourceMappingURL=FinancialController.js.map