"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const database_1 = __importDefault(require("../config/database"));
const Event_1 = require("../entities/Event");
const Participant_1 = require("../entities/Participant");
const User_1 = require("../entities/User");
const exportService_1 = __importDefault(require("../services/exportService"));
const eventRepository = database_1.default.getRepository(Event_1.Event);
const participantRepository = database_1.default.getRepository(Participant_1.Participant);
const userRepository = database_1.default.getRepository(User_1.User);
class AdminController {
    static async getDashboardStats(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Hanya admin yang dapat mengakses dashboard' });
            }
            const currentYear = new Date().getFullYear();
            const startOfYear = new Date(currentYear, 0, 1);
            const endOfYear = new Date(currentYear, 11, 31);
            const monthlyEvents = await eventRepository
                .createQueryBuilder('event')
                .select('EXTRACT(MONTH FROM event.date) as month')
                .addSelect('COUNT(*)', 'count')
                .where('event.date BETWEEN :start AND :end', {
                start: startOfYear,
                end: endOfYear
            })
                .groupBy('month')
                .orderBy('month', 'ASC')
                .getRawMany();
            const monthlyParticipants = await participantRepository
                .createQueryBuilder('participant')
                .leftJoin('participant.event', 'event')
                .select('EXTRACT(MONTH FROM event.date)', 'month')
                .addSelect('COUNT(*)', 'registrations')
                .addSelect('COUNT(CASE WHEN participant.hasAttended = true THEN 1 END)', 'attendance')
                .where('EXTRACT(YEAR FROM event.date) = :year', { year: currentYear })
                .groupBy('month')
                .orderBy('month', 'ASC')
                .getRawMany();
            const topEvents = await eventRepository
                .createQueryBuilder('event')
                .leftJoin('event.participants', 'participant')
                .select([
                'event.id',
                'event.title',
                'event.date',
                'event.time',
                'event.location',
                'COUNT(participant.id) as participantCount'
            ])
                .groupBy('event.id')
                .orderBy('participantCount', 'DESC')
                .limit(10)
                .getRawMany();
            const totalEvents = await eventRepository.count();
            const totalParticipants = await participantRepository.count();
            const totalUsers = await userRepository.count();
            const totalAttendance = await participantRepository.count({
                where: { hasAttended: true }
            });
            const recentEvents = await eventRepository.find({
                order: { createdAt: 'DESC' },
                take: 5
            });
            const recentParticipants = await participantRepository.find({
                relations: ['user', 'event'],
                order: { createdAt: 'DESC' },
                take: 10
            });
            return res.json({
                monthlyEvents,
                monthlyParticipants,
                topEvents,
                overallStats: {
                    totalEvents,
                    totalParticipants,
                    totalUsers,
                    totalAttendance,
                    attendanceRate: totalParticipants > 0 ? (totalAttendance / totalParticipants * 100).toFixed(2) : 0
                },
                recentActivities: {
                    events: recentEvents,
                    participants: recentParticipants
                }
            });
        }
        catch (error) {
            console.error('Get dashboard stats error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil statistik dashboard' });
        }
    }
    static async exportDashboardData(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
                res.status(403).json({ message: 'Unauthorized' });
                return;
            }
            const { format = 'xlsx' } = req.query;
            const currentYear = new Date().getFullYear();
            const events = await eventRepository.find({
                relations: ['participants'],
                order: { date: 'ASC' }
            });
            const participants = await participantRepository.find({
                relations: ['user', 'event'],
                order: { createdAt: 'DESC' }
            });
            let buffer;
            let filename;
            let contentType;
            if (format === 'csv') {
                const csvData = await exportService_1.default.exportDashboardToCSV(events, participants, currentYear);
                buffer = Buffer.from(csvData);
                filename = `dashboard_data_${currentYear}.csv`;
                contentType = 'text/csv';
            }
            else {
                buffer = await exportService_1.default.exportDashboardToExcel(events, participants, currentYear);
                filename = `dashboard_data_${currentYear}.xlsx`;
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            }
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(buffer);
        }
        catch (error) {
            console.error('Export dashboard data error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat mengexport data dashboard' });
        }
    }
    static async getUserManagement(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            const { page = 1, limit = 10, search = '', role = '' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            let query = userRepository.createQueryBuilder('user');
            if (search) {
                query = query.where('LOWER(user.name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search)', { search: `%${search}%` });
            }
            if (role) {
                query = query.andWhere('user.role = :role', { role });
            }
            const total = await query.getCount();
            const users = await query
                .skip(skip)
                .take(Number(limit))
                .orderBy('user.createdAt', 'DESC')
                .getMany();
            return res.json({
                users,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        }
        catch (error) {
            console.error('Get user management error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data user' });
        }
    }
    static async updateUserRole(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            const { userId } = req.params;
            const { role } = req.body;
            if (!['USER', 'ADMIN'].includes(role)) {
                return res.status(400).json({ message: 'Role tidak valid' });
            }
            const user = await userRepository.findOne({
                where: { id: userId }
            });
            if (!user) {
                return res.status(404).json({ message: 'User tidak ditemukan' });
            }
            if (userId === req.user.id) {
                return res.status(400).json({ message: 'Tidak dapat mengubah role sendiri' });
            }
            user.role = role;
            await userRepository.save(user);
            return res.json({
                message: 'Role user berhasil diupdate',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            });
        }
        catch (error) {
            console.error('Update user role error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate role user' });
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=AdminController.js.map