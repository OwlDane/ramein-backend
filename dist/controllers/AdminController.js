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
const KategoriKegiatan_1 = require("../entities/KategoriKegiatan");
const exportService_1 = __importDefault(require("../services/exportService"));
const logger_1 = __importDefault(require("../utils/logger"));
const eventRepository = database_1.default.getRepository(Event_1.Event);
const participantRepository = database_1.default.getRepository(Participant_1.Participant);
const userRepository = database_1.default.getRepository(User_1.User);
const categoryRepository = database_1.default.getRepository(KategoriKegiatan_1.KategoriKegiatan);
class AdminController {
    static async getDashboardStats(_req, res) {
        try {
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
            if (userId === req.adminUser.id) {
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
    static async createEvent(req, res) {
        var _a, _b;
        try {
            const { title, description, date, time, location, flyerUrl, certificateUrl, categoryId } = req.body;
            if (!title || !description || !date || !time || !location || !categoryId) {
                res.status(400).json({
                    message: 'Semua field wajib diisi'
                });
                return;
            }
            const eventDate = new Date(date);
            const today = new Date();
            const threeDaysFromNow = new Date(today);
            threeDaysFromNow.setDate(today.getDate() + 3);
            if (eventDate < threeDaysFromNow) {
                res.status(400).json({
                    message: 'Kegiatan hanya bisa dibuat maksimal H-3 dari tanggal pelaksanaan'
                });
                return;
            }
            const category = await categoryRepository.findOne({
                where: { id: categoryId }
            });
            if (!category) {
                res.status(400).json({
                    message: 'Kategori kegiatan tidak ditemukan'
                });
                return;
            }
            const event = eventRepository.create({
                title,
                description,
                date: eventDate,
                time,
                location,
                flyer: flyerUrl || '',
                certificate: certificateUrl || null,
                category: category.nama_kategori,
                createdBy: (_a = req.adminUser) === null || _a === void 0 ? void 0 : _a.id
            });
            const savedEvent = await eventRepository.save(event);
            logger_1.default.info(`Admin ${(_b = req.adminUser) === null || _b === void 0 ? void 0 : _b.email} created event: ${savedEvent.title}`);
            res.status(201).json({
                message: 'Kegiatan berhasil dibuat',
                event: {
                    id: savedEvent.id,
                    title: savedEvent.title,
                    description: savedEvent.description,
                    date: savedEvent.date,
                    time: savedEvent.time,
                    location: savedEvent.location,
                    flyerUrl: savedEvent.flyer,
                    certificateUrl: savedEvent.certificate,
                    category: {
                        id: category.id,
                        name: category.nama_kategori
                    }
                }
            });
        }
        catch (error) {
            logger_1.default.error('Create event error:', error);
            res.status(500).json({
                message: 'Terjadi kesalahan saat membuat kegiatan'
            });
        }
    }
    static async getEvents(req, res) {
        try {
            const { page = 1, limit = 10, search = '', categoryId = '' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            let query = eventRepository.createQueryBuilder('event')
                .leftJoinAndSelect('event.participants', 'participants');
            if (search) {
                query = query.where('LOWER(event.title) LIKE LOWER(:search) OR LOWER(event.description) LIKE LOWER(:search)', { search: `%${search}%` });
            }
            if (categoryId) {
                query = query.andWhere('event.category = :categoryId', { categoryId });
            }
            const total = await query.getCount();
            const events = await query
                .skip(skip)
                .take(Number(limit))
                .orderBy('event.date', 'ASC')
                .getMany();
            const eventsWithStats = events.map(event => {
                var _a, _b;
                return ({
                    ...event,
                    participantCount: ((_a = event.participants) === null || _a === void 0 ? void 0 : _a.length) || 0,
                    attendanceCount: ((_b = event.participants) === null || _b === void 0 ? void 0 : _b.filter(p => p.hasAttended).length) || 0
                });
            });
            res.json({
                events: eventsWithStats,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        }
        catch (error) {
            logger_1.default.error('Get events error:', error);
            res.status(500).json({
                message: 'Terjadi kesalahan saat mengambil data kegiatan'
            });
        }
    }
    static async getEventById(req, res) {
        var _a, _b;
        try {
            const { id } = req.params;
            const event = await eventRepository.findOne({
                where: { id },
                relations: ['participants', 'participants.user']
            });
            if (!event) {
                res.status(404).json({
                    message: 'Kegiatan tidak ditemukan'
                });
                return;
            }
            res.json({
                event: {
                    ...event,
                    participantCount: ((_a = event.participants) === null || _a === void 0 ? void 0 : _a.length) || 0,
                    attendanceCount: ((_b = event.participants) === null || _b === void 0 ? void 0 : _b.filter(p => p.hasAttended).length) || 0
                }
            });
        }
        catch (error) {
            logger_1.default.error('Get event by ID error:', error);
            res.status(500).json({
                message: 'Terjadi kesalahan saat mengambil data kegiatan'
            });
        }
    }
    static async updateEvent(req, res) {
        var _a;
        try {
            const { id } = req.params;
            const { title, description, date, time, location, flyerUrl, certificateUrl, categoryId } = req.body;
            const event = await eventRepository.findOne({
                where: { id }
            });
            if (!event) {
                res.status(404).json({
                    message: 'Kegiatan tidak ditemukan'
                });
                return;
            }
            if (date) {
                const eventDate = new Date(date);
                const today = new Date();
                const threeDaysFromNow = new Date(today);
                threeDaysFromNow.setDate(today.getDate() + 3);
                if (eventDate < threeDaysFromNow) {
                    res.status(400).json({
                        message: 'Tanggal kegiatan hanya bisa diubah maksimal H-3 dari tanggal pelaksanaan'
                    });
                    return;
                }
            }
            if (title)
                event.title = title;
            if (description)
                event.description = description;
            if (date)
                event.date = new Date(date);
            if (time)
                event.time = time;
            if (location)
                event.location = location;
            if (flyerUrl !== undefined)
                event.flyer = flyerUrl;
            if (certificateUrl !== undefined)
                event.certificate = certificateUrl;
            if (categoryId) {
                const category = await categoryRepository.findOne({
                    where: { id: categoryId }
                });
                if (!category) {
                    res.status(400).json({
                        message: 'Kategori kegiatan tidak ditemukan'
                    });
                    return;
                }
                event.category = category.nama_kategori;
            }
            const updatedEvent = await eventRepository.save(event);
            logger_1.default.info(`Admin ${(_a = req.adminUser) === null || _a === void 0 ? void 0 : _a.email} updated event: ${updatedEvent.title}`);
            res.json({
                message: 'Kegiatan berhasil diupdate',
                event: updatedEvent
            });
        }
        catch (error) {
            logger_1.default.error('Update event error:', error);
            res.status(500).json({
                message: 'Terjadi kesalahan saat mengupdate kegiatan'
            });
        }
    }
    static async deleteEvent(req, res) {
        var _a;
        try {
            const { id } = req.params;
            const event = await eventRepository.findOne({
                where: { id },
                relations: ['participants']
            });
            if (!event) {
                res.status(404).json({
                    message: 'Kegiatan tidak ditemukan'
                });
                return;
            }
            if (event.participants && event.participants.length > 0) {
                res.status(400).json({
                    message: 'Tidak dapat menghapus kegiatan yang sudah memiliki peserta'
                });
                return;
            }
            await eventRepository.remove(event);
            logger_1.default.info(`Admin ${(_a = req.adminUser) === null || _a === void 0 ? void 0 : _a.email} deleted event: ${event.title}`);
            res.json({
                message: 'Kegiatan berhasil dihapus'
            });
        }
        catch (error) {
            logger_1.default.error('Delete event error:', error);
            res.status(500).json({
                message: 'Terjadi kesalahan saat menghapus kegiatan'
            });
        }
    }
    static async getEventParticipants(req, res) {
        try {
            const { eventId } = req.params;
            const { page = 1, limit = 10, search = '', hasAttended = '' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const event = await eventRepository.findOne({
                where: { id: eventId }
            });
            if (!event) {
                res.status(404).json({
                    message: 'Kegiatan tidak ditemukan'
                });
                return;
            }
            let query = participantRepository.createQueryBuilder('participant')
                .leftJoinAndSelect('participant.user', 'user')
                .leftJoinAndSelect('participant.event', 'event')
                .where('participant.event.id = :eventId', { eventId });
            if (search) {
                query = query.andWhere('LOWER(user.name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search)', { search: `%${search}%` });
            }
            if (hasAttended !== '') {
                query = query.andWhere('participant.hasAttended = :hasAttended', {
                    hasAttended: hasAttended === 'true'
                });
            }
            const total = await query.getCount();
            const participants = await query
                .skip(skip)
                .take(Number(limit))
                .orderBy('participant.createdAt', 'DESC')
                .getMany();
            res.json({
                participants,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        }
        catch (error) {
            logger_1.default.error('Get event participants error:', error);
            res.status(500).json({
                message: 'Terjadi kesalahan saat mengambil data peserta'
            });
        }
    }
    static async exportEventParticipants(req, res) {
        try {
            const { eventId } = req.params;
            const { format = 'xlsx' } = req.query;
            const event = await eventRepository.findOne({
                where: { id: eventId }
            });
            if (!event) {
                res.status(404).json({
                    message: 'Kegiatan tidak ditemukan'
                });
                return;
            }
            const participants = await participantRepository.find({
                where: { event: { id: eventId } },
                relations: ['user', 'event']
            });
            let buffer;
            let filename;
            let contentType;
            if (format === 'csv') {
                const csvData = await exportService_1.default.exportEventParticipantsToCSV(participants, event);
                buffer = Buffer.from(csvData);
                filename = `peserta_${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
                contentType = 'text/csv';
            }
            else {
                buffer = await exportService_1.default.exportEventParticipantsToExcel(participants, event);
                filename = `peserta_${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            }
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(buffer);
        }
        catch (error) {
            logger_1.default.error('Export event participants error:', error);
            res.status(500).json({
                message: 'Terjadi kesalahan saat mengexport data peserta'
            });
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=AdminController.js.map