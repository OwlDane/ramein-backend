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
const Notification_1 = require("../entities/Notification");
const exportService_1 = __importDefault(require("../services/exportService"));
const logger_1 = __importDefault(require("../utils/logger"));
const eventRepository = database_1.default.getRepository(Event_1.Event);
const participantRepository = database_1.default.getRepository(Participant_1.Participant);
const userRepository = database_1.default.getRepository(User_1.User);
const categoryRepository = database_1.default.getRepository(KategoriKegiatan_1.KategoriKegiatan);
const notificationRepository = database_1.default.getRepository(Notification_1.Notification);
class AdminController {
    static async getDashboardStats(_req, res) {
        try {
            const currentYear = new Date().getFullYear();
            const startOfYear = new Date(currentYear, 0, 1);
            const endOfYear = new Date(currentYear, 11, 31);
            const monthlyEvents = await eventRepository
                .createQueryBuilder('event')
                .select('EXTRACT(MONTH FROM date)', 'month')
                .addSelect('COUNT(*)', 'count')
                .where('date BETWEEN :start AND :end', {
                start: startOfYear,
                end: endOfYear
            })
                .groupBy('EXTRACT(MONTH FROM date)')
                .orderBy('month', 'ASC')
                .getRawMany();
            const monthlyParticipants = await participantRepository
                .createQueryBuilder('participant')
                .select('EXTRACT(MONTH FROM participant.createdAt)', 'month')
                .addSelect('COUNT(*)', 'registrations')
                .addSelect('COUNT(CASE WHEN participant.hasAttended = true THEN 1 END)', 'attendance')
                .where('participant.createdAt BETWEEN :start AND :end', {
                start: startOfYear,
                end: endOfYear
            })
                .groupBy('month')
                .orderBy('month', 'ASC')
                .getRawMany();
            const topEvents = await eventRepository
                .createQueryBuilder('event')
                .leftJoinAndSelect('event.participants', 'participant')
                .select([
                'event.id',
                'event.title',
                'event.date',
                'event.time',
                'event.location'
            ])
                .addSelect('COUNT(participant.id)', 'participant_count')
                .groupBy('event.id, event.title, event.date, event.time, event.location')
                .orderBy('participant_count', 'DESC')
                .limit(10)
                .getRawMany();
            const totalEvents = await eventRepository.count();
            const totalParticipants = await participantRepository.count();
            const totalUsers = await userRepository.count();
            const totalAttendance = await participantRepository.count({
                where: { hasAttended: true }
            });
            const recentEvents = await eventRepository
                .createQueryBuilder('event')
                .select([
                'event.id',
                'event.title',
                'event.date',
                'event.createdAt'
            ])
                .orderBy('event.createdAt', 'DESC')
                .limit(5)
                .getRawMany();
            const recentParticipants = await participantRepository
                .createQueryBuilder('participant')
                .leftJoinAndSelect('participant.user', 'user')
                .leftJoinAndSelect('participant.event', 'event')
                .select([
                'participant.id',
                'participant.hasAttended',
                'participant.createdAt',
                'user.name',
                'user.email',
                'event.title'
            ])
                .orderBy('participant.createdAt', 'DESC')
                .limit(10)
                .getRawMany();
            return res.json({
                monthlyEvents,
                monthlyParticipants,
                topEvents: topEvents.map(event => ({
                    id: event.event_id,
                    title: event.event_title,
                    date: event.event_date,
                    time: event.event_time,
                    location: event.event_location,
                    participantCount: parseInt(event.participant_count)
                })),
                overallStats: {
                    totalEvents,
                    totalParticipants,
                    totalUsers,
                    totalAttendance,
                    attendanceRate: totalParticipants > 0 ? (totalAttendance / totalParticipants * 100).toFixed(2) : 0
                },
                recentActivities: {
                    events: recentEvents.map(event => ({
                        id: event.event_id,
                        title: event.event_title,
                        date: event.event_date,
                        createdAt: event.event_created_at
                    })),
                    participants: recentParticipants.map(participant => ({
                        id: participant.participant_id,
                        hasAttended: participant.participant_has_attended,
                        createdAt: participant.participant_created_at,
                        user: {
                            name: participant.user_name,
                            email: participant.user_email
                        },
                        event: {
                            title: participant.event_title
                        }
                    }))
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
            const { title, description, date, time, location, flyerUrl, certificateUrl, categoryId, price, maxParticipants, registrationDeadline, eventType, contactPersonName, contactPersonPhone, contactPersonEmail, meetingLink, requirements, benefits, isFeatured, tags } = req.body;
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
            let flyerPath = flyerUrl || '';
            let certificatePath = certificateUrl || null;
            const files = req.files || [];
            const flyerFile = files.find((f) => f.fieldname === 'flyerFile');
            const certificateFile = files.find((f) => f.fieldname === 'certificateFile');
            if (flyerFile) {
                const fs = require('fs');
                const path = require('path');
                const uploadDir = path.join(process.cwd(), 'uploads', 'flyers');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                const filename = `flyer_${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(flyerFile.originalname)}`;
                const filepath = path.join(uploadDir, filename);
                fs.writeFileSync(filepath, flyerFile.buffer);
                flyerPath = `uploads/flyers/${filename}`;
            }
            if (certificateFile) {
                const fs = require('fs');
                const path = require('path');
                const uploadDir = path.join(process.cwd(), 'uploads', 'certificates');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                const filename = `cert_${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(certificateFile.originalname)}`;
                const filepath = path.join(uploadDir, filename);
                fs.writeFileSync(filepath, certificateFile.buffer);
                certificatePath = `uploads/certificates/${filename}`;
            }
            const event = eventRepository.create({
                title,
                description,
                date: eventDate,
                time,
                location,
                flyer: flyerPath,
                certificate: certificatePath,
                category: category.nama_kategori,
                price: price ? parseFloat(price) : 0,
                maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
                registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
                eventType: eventType || 'offline',
                contactPersonName: contactPersonName || null,
                contactPersonPhone: contactPersonPhone || null,
                contactPersonEmail: contactPersonEmail || null,
                meetingLink: meetingLink || null,
                requirements: requirements || null,
                benefits: benefits || null,
                isFeatured: isFeatured === 'true' || isFeatured === true,
                tags: tags ? (typeof tags === 'string' ? tags : tags.join(',')) : null,
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
                .leftJoin('event.participants', 'participants')
                .select([
                'event.id',
                'event.title',
                'event.date',
                'event.time',
                'event.location',
                'event.flyer',
                'event.certificate',
                'event.description',
                'event.category',
                'event.price',
                'event.createdBy',
                'event.isPublished',
                'event.createdAt',
                'event.updatedAt'
            ])
                .addSelect('COUNT(DISTINCT participants.id)', 'participant_count')
                .addSelect('COUNT(DISTINCT CASE WHEN participants.hasAttended = true THEN participants.id END)', 'attendance_count')
                .groupBy('event.id');
            if (search) {
                query = query.where('LOWER(event.title) LIKE LOWER(:search) OR LOWER(event.description) LIKE LOWER(:search)', { search: `%${search}%` });
            }
            if (categoryId) {
                query = query.andWhere('event.category = :categoryId', { categoryId });
            }
            const totalQuery = eventRepository.createQueryBuilder('event');
            if (search) {
                totalQuery.where('LOWER(event.title) LIKE LOWER(:search) OR LOWER(event.description) LIKE LOWER(:search)', { search: `%${search}%` });
            }
            if (categoryId) {
                totalQuery.andWhere('event.category = :categoryId', { categoryId });
            }
            const total = await totalQuery.getCount();
            const events = await query
                .skip(skip)
                .take(Number(limit))
                .orderBy('event.date', 'ASC')
                .getRawMany();
            const formattedEvents = events.map(event => ({
                id: event.event_id,
                title: event.event_title,
                date: event.event_date,
                time: event.event_time,
                location: event.event_location,
                flyer: event.event_flyer,
                certificate: event.event_certificate,
                description: event.event_description,
                category: event.event_category,
                price: event.event_price,
                createdBy: event.event_created_by,
                isPublished: event.event_is_published,
                createdAt: event.event_created_at,
                updatedAt: event.event_updated_at,
                participantCount: parseInt(event.participant_count) || 0,
                attendanceCount: parseInt(event.attendance_count) || 0
            }));
            res.json({
                events: formattedEvents,
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
            const { title, description, date, time, location, flyerUrl, certificateUrl, categoryId, price, maxParticipants, registrationDeadline, eventType, contactPersonName, contactPersonPhone, contactPersonEmail, meetingLink, requirements, benefits, isFeatured, tags } = req.body;
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
                const newEventDate = new Date(date);
                newEventDate.setHours(0, 0, 0, 0);
                const existingEventDate = new Date(event.date);
                existingEventDate.setHours(0, 0, 0, 0);
                if (newEventDate.getTime() !== existingEventDate.getTime()) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const threeDaysFromNow = new Date(today);
                    threeDaysFromNow.setDate(today.getDate() + 3);
                    if (newEventDate < threeDaysFromNow) {
                        res.status(400).json({
                            message: 'Tanggal kegiatan minimal H+3 dari hari ini (minimal 3 hari ke depan)'
                        });
                        return;
                    }
                }
            }
            let flyerPath = event.flyer;
            let certificatePath = event.certificate;
            const files = req.files || [];
            const flyerFile = files.find((f) => f.fieldname === 'flyerFile');
            const certificateFile = files.find((f) => f.fieldname === 'certificateFile');
            if (flyerFile) {
                const fs = require('fs');
                const path = require('path');
                const uploadDir = path.join(process.cwd(), 'uploads', 'flyers');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                const filename = `flyer_${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(flyerFile.originalname)}`;
                const filepath = path.join(uploadDir, filename);
                fs.writeFileSync(filepath, flyerFile.buffer);
                flyerPath = `uploads/flyers/${filename}`;
            }
            else if (flyerUrl !== undefined) {
                flyerPath = flyerUrl;
            }
            if (certificateFile) {
                const fs = require('fs');
                const path = require('path');
                const uploadDir = path.join(process.cwd(), 'uploads', 'certificates');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                const filename = `cert_${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(certificateFile.originalname)}`;
                const filepath = path.join(uploadDir, filename);
                fs.writeFileSync(filepath, certificateFile.buffer);
                certificatePath = `uploads/certificates/${filename}`;
            }
            else if (certificateUrl !== undefined) {
                certificatePath = certificateUrl;
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
            event.flyer = flyerPath;
            event.certificate = certificatePath;
            if (price !== undefined)
                event.price = parseFloat(price);
            if (maxParticipants !== undefined)
                event.maxParticipants = maxParticipants ? parseInt(maxParticipants) : null;
            if (registrationDeadline !== undefined)
                event.registrationDeadline = registrationDeadline ? new Date(registrationDeadline) : null;
            if (eventType !== undefined)
                event.eventType = eventType;
            if (contactPersonName !== undefined)
                event.contactPersonName = contactPersonName;
            if (contactPersonPhone !== undefined)
                event.contactPersonPhone = contactPersonPhone;
            if (contactPersonEmail !== undefined)
                event.contactPersonEmail = contactPersonEmail;
            if (meetingLink !== undefined)
                event.meetingLink = meetingLink;
            if (requirements !== undefined)
                event.requirements = requirements;
            if (benefits !== undefined)
                event.benefits = benefits;
            if (isFeatured !== undefined)
                event.isFeatured = isFeatured === 'true' || isFeatured === true;
            if (tags !== undefined)
                event.tags = tags ? (typeof tags === 'string' ? tags : tags.join(',')) : null;
            if (categoryId && categoryId !== 'undefined' && categoryId !== '') {
                const category = await categoryRepository.findOne({
                    where: { id: parseInt(categoryId) }
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
            try {
                const participants = await participantRepository.find({
                    where: { eventId: id },
                    relations: ['user']
                });
                if (participants.length > 0) {
                    const changes = [];
                    if (title)
                        changes.push('Judul');
                    if (description)
                        changes.push('Deskripsi');
                    if (date)
                        changes.push('Tanggal');
                    if (time)
                        changes.push('Waktu');
                    if (location)
                        changes.push('Lokasi');
                    if (meetingLink)
                        changes.push('Link Meeting');
                    const changeText = changes.length > 0 ? changes.join(', ') : 'Informasi event';
                    const notifications = participants.map(participant => {
                        var _a;
                        const notification = new Notification_1.Notification();
                        notification.userId = participant.userId;
                        notification.eventId = id;
                        notification.type = Notification_1.NotificationType.EVENT_UPDATE;
                        notification.title = `Update: ${updatedEvent.title}`;
                        notification.message = `Ada perubahan pada event "${updatedEvent.title}". Yang diubah: ${changeText}. Silakan cek detail event untuk informasi terbaru.`;
                        notification.metadata = {
                            changes,
                            updatedBy: (_a = req.adminUser) === null || _a === void 0 ? void 0 : _a.email,
                            updatedAt: new Date()
                        };
                        return notification;
                    });
                    await notificationRepository.save(notifications);
                    logger_1.default.info(`Sent update notifications to ${participants.length} participants for event: ${updatedEvent.title}`);
                }
            }
            catch (notifError) {
                logger_1.default.error('Error sending event update notifications:', notifError);
            }
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