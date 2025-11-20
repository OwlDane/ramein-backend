import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Event } from '../entities/Event';
import { Participant } from '../entities/Participant';
import { User } from '../entities/User';
import { KategoriKegiatan } from '../entities/KategoriKegiatan';
import ExportService from '../services/exportService';
import logger from '../utils/logger';

const eventRepository = AppDataSource.getRepository(Event);
const participantRepository = AppDataSource.getRepository(Participant);
const userRepository = AppDataSource.getRepository(User);
const categoryRepository = AppDataSource.getRepository(KategoriKegiatan);

export class AdminController {
    // Get comprehensive dashboard statistics
    static async getDashboardStats(_req: Request, res: Response) {
        try {

            const currentYear = new Date().getFullYear();
            const startOfYear = new Date(currentYear, 0, 1);
            const endOfYear = new Date(currentYear, 11, 31);

            // 1. Monthly event counts (Januari - Desember)
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

            // 2. Monthly participant counts (Januari - Desember)
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

            // 3. Top 10 events by participant count
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

            // 4. Overall statistics
            const totalEvents = await eventRepository.count();
            const totalParticipants = await participantRepository.count();
            const totalUsers = await userRepository.count();
            const totalAttendance = await participantRepository.count({
                where: { hasAttended: true }
            });

            // 5. Recent activities
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
        } catch (error) {
            console.error('Get dashboard stats error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil statistik dashboard' });
        }
    }

    // Export dashboard data to Excel
    static async exportDashboardData(req: Request, res: Response): Promise<void> {
        try {
    
            const { format = 'xlsx' } = req.query;
            const currentYear = new Date().getFullYear();
    
            // Get all data for export
            const events = await eventRepository.find({
                relations: ['participants'],
                order: { date: 'ASC' }
            });
    
            const participants = await participantRepository.find({
                relations: ['user', 'event'],
                order: { createdAt: 'DESC' }
            });
    
            let buffer: Buffer;
            let filename: string;
            let contentType: string;
    
            if (format === 'csv') {
                const csvData = await ExportService.exportDashboardToCSV(events, participants, currentYear);
                buffer = Buffer.from(csvData);
                filename = `dashboard_data_${currentYear}.csv`;
                contentType = 'text/csv';
            } else {
                buffer = await ExportService.exportDashboardToExcel(events, participants, currentYear);
                filename = `dashboard_data_${currentYear}.xlsx`;
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            }
    
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(buffer);
    
        } catch (error) {
            console.error('Export dashboard data error:', error);
            res.status(500).json({ message: 'Terjadi kesalahan saat mengexport data dashboard' });
        }
    }

    // Get user management data
    static async getUserManagement(req: Request, res: Response) {
        try {

            const { page = 1, limit = 10, search = '', role = '' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            let query = userRepository.createQueryBuilder('user');

            // Apply search filter
            if (search) {
                query = query.where(
                    'LOWER(user.name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search)',
                    { search: `%${search}%` }
                );
            }

            // Apply role filter
            if (role) {
                query = query.andWhere('user.role = :role', { role });
            }

            // Get total count
            const total = await query.getCount();

            // Get paginated results
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
        } catch (error) {
            console.error('Get user management error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data user' });
        }
    }

    // Update user role
    static async updateUserRole(req: Request, res: Response) {
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

            // Prevent admin from changing their own role
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
        } catch (error) {
            console.error('Update user role error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate role user' });
        }
    }

    // Create new event with H-3 validation
    static async createEvent(req: Request, res: Response): Promise<void> {
        try {
            const { 
                title, 
                description, 
                date, 
                time, 
                location, 
                flyerUrl, 
                certificateUrl, 
                categoryId,
                price,
                maxParticipants,
                registrationDeadline,
                eventType,
                contactPersonName,
                contactPersonPhone,
                contactPersonEmail,
                meetingLink,
                requirements,
                benefits,
                isFeatured,
                tags
            } = req.body;

            // Validate required fields
            if (!title || !description || !date || !time || !location || !categoryId) {
                res.status(400).json({ 
                    message: 'Semua field wajib diisi' 
                });
                return;
            }

            // Validate H-3 rule (event can only be created max 3 days before event date)
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

            // Check if category exists
            const category = await categoryRepository.findOne({
                where: { id: categoryId }
            });

            if (!category) {
                res.status(400).json({ 
                    message: 'Kategori kegiatan tidak ditemukan' 
                });
                return;
            }

            // Handle file uploads or use URLs
            let flyerPath = flyerUrl || '';
            let certificatePath = certificateUrl || null;

            // Get uploaded files from multer
            const files = (req as any).files || [];
            const flyerFile = files.find((f: any) => f.fieldname === 'flyerFile');
            const certificateFile = files.find((f: any) => f.fieldname === 'certificateFile');

            // If flyer file uploaded, save it
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

            // If certificate file uploaded, save it
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

            // Create event
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
                createdBy: req.adminUser?.id
            });

            const savedEvent = await eventRepository.save(event);

            logger.info(`Admin ${req.adminUser?.email} created event: ${savedEvent.title}`);

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

        } catch (error) {
            logger.error('Create event error:', error);
            res.status(500).json({ 
                message: 'Terjadi kesalahan saat membuat kegiatan' 
            });
        }
    }

    // Get all events for admin
    static async getEvents(req: Request, res: Response) {
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

            // Apply search filter
            if (search) {
                query = query.where(
                    'LOWER(event.title) LIKE LOWER(:search) OR LOWER(event.description) LIKE LOWER(:search)',
                    { search: `%${search}%` }
                );
            }

            // Apply category filter
            if (categoryId) {
                query = query.andWhere('event.category = :categoryId', { categoryId });
            }

            // Get total count (need a separate query for accurate count)
            const totalQuery = eventRepository.createQueryBuilder('event');
            if (search) {
                totalQuery.where(
                    'LOWER(event.title) LIKE LOWER(:search) OR LOWER(event.description) LIKE LOWER(:search)',
                    { search: `%${search}%` }
                );
            }
            if (categoryId) {
                totalQuery.andWhere('event.category = :categoryId', { categoryId });
            }
            const total = await totalQuery.getCount();

            // Get paginated results
            const events = await query
                .skip(skip)
                .take(Number(limit))
                .orderBy('event.date', 'ASC')
                .getRawMany();

            // Format the results
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

        } catch (error) {
            logger.error('Get events error:', error);
            res.status(500).json({ 
                message: 'Terjadi kesalahan saat mengambil data kegiatan' 
            });
        }
    }

    // Get event by ID
    static async getEventById(req: Request, res: Response): Promise<void> {
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
                    participantCount: event.participants?.length || 0,
                    attendanceCount: event.participants?.filter(p => p.hasAttended).length || 0
                }
            });

        } catch (error) {
            logger.error('Get event by ID error:', error);
            res.status(500).json({ 
                message: 'Terjadi kesalahan saat mengambil data kegiatan' 
            });
        }
    }

    // Update event
    static async updateEvent(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { 
                title, 
                description, 
                date, 
                time, 
                location, 
                flyerUrl, 
                certificateUrl, 
                categoryId,
                price,
                maxParticipants,
                registrationDeadline,
                eventType,
                contactPersonName,
                contactPersonPhone,
                contactPersonEmail,
                meetingLink,
                requirements,
                benefits,
                isFeatured,
                tags
            } = req.body;

            const event = await eventRepository.findOne({
                where: { id }
            });

            if (!event) {
                res.status(404).json({ 
                    message: 'Kegiatan tidak ditemukan' 
                });
                return;
            }

            // Validate H-3 rule for date changes
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

            // Handle file uploads or use URLs
            let flyerPath = event.flyer;
            let certificatePath = event.certificate;

            // Get uploaded files from multer
            const files = (req as any).files || [];
            const flyerFile = files.find((f: any) => f.fieldname === 'flyerFile');
            const certificateFile = files.find((f: any) => f.fieldname === 'certificateFile');

            // If flyer file uploaded, save it
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
            } else if (flyerUrl !== undefined) {
                flyerPath = flyerUrl;
            }

            // If certificate file uploaded, save it
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
            } else if (certificateUrl !== undefined) {
                certificatePath = certificateUrl;
            }

            // Update event fields
            if (title) event.title = title;
            if (description) event.description = description;
            if (date) event.date = new Date(date);
            if (time) event.time = time;
            if (location) event.location = location;
            event.flyer = flyerPath;
            event.certificate = certificatePath;
            if (price !== undefined) event.price = parseFloat(price);
            if (maxParticipants !== undefined) event.maxParticipants = maxParticipants ? parseInt(maxParticipants) : null;
            if (registrationDeadline !== undefined) event.registrationDeadline = registrationDeadline ? new Date(registrationDeadline) : null;
            if (eventType !== undefined) event.eventType = eventType;
            if (contactPersonName !== undefined) event.contactPersonName = contactPersonName;
            if (contactPersonPhone !== undefined) event.contactPersonPhone = contactPersonPhone;
            if (contactPersonEmail !== undefined) event.contactPersonEmail = contactPersonEmail;
            if (meetingLink !== undefined) event.meetingLink = meetingLink;
            if (requirements !== undefined) event.requirements = requirements;
            if (benefits !== undefined) event.benefits = benefits;
            if (isFeatured !== undefined) event.isFeatured = isFeatured === 'true' || isFeatured === true;
            if (tags !== undefined) event.tags = tags ? (typeof tags === 'string' ? tags : tags.join(',')) : null;

            // Update category if provided
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

            logger.info(`Admin ${req.adminUser?.email} updated event: ${updatedEvent.title}`);

            res.json({
                message: 'Kegiatan berhasil diupdate',
                event: updatedEvent
            });

        } catch (error) {
            logger.error('Update event error:', error);
            res.status(500).json({ 
                message: 'Terjadi kesalahan saat mengupdate kegiatan' 
            });
        }
    }

    // Delete event
    static async deleteEvent(req: Request, res: Response): Promise<void> {
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

            // Check if event has participants
            if (event.participants && event.participants.length > 0) {
                res.status(400).json({ 
                    message: 'Tidak dapat menghapus kegiatan yang sudah memiliki peserta' 
                });
                return;
            }

            await eventRepository.remove(event);

            logger.info(`Admin ${req.adminUser?.email} deleted event: ${event.title}`);

            res.json({
                message: 'Kegiatan berhasil dihapus'
            });

        } catch (error) {
            logger.error('Delete event error:', error);
            res.status(500).json({ 
                message: 'Terjadi kesalahan saat menghapus kegiatan' 
            });
        }
    }

    // Get event participants
    static async getEventParticipants(req: Request, res: Response): Promise<void> {
        try {
            const { eventId } = req.params;
            const { page = 1, limit = 10, search = '', hasAttended = '' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            // Check if event exists
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

            // Apply search filter
            if (search) {
                query = query.andWhere(
                    'LOWER(user.name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search)',
                    { search: `%${search}%` }
                );
            }

            // Apply attendance filter
            if (hasAttended !== '') {
                query = query.andWhere('participant.hasAttended = :hasAttended', { 
                    hasAttended: hasAttended === 'true' 
                });
            }

            // Get total count
            const total = await query.getCount();

            // Get paginated results
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

        } catch (error) {
            logger.error('Get event participants error:', error);
            res.status(500).json({ 
                message: 'Terjadi kesalahan saat mengambil data peserta' 
            });
        }
    }

    // Export event participants to Excel/CSV
    static async exportEventParticipants(req: Request, res: Response): Promise<void> {
        try {
            const { eventId } = req.params;
            const { format = 'xlsx' } = req.query;

            // Check if event exists
            const event = await eventRepository.findOne({
                where: { id: eventId }
            });

            if (!event) {
                res.status(404).json({ 
                    message: 'Kegiatan tidak ditemukan' 
                });
                return;
            }

            // Get all participants for this event
            const participants = await participantRepository.find({
                where: { event: { id: eventId } },
                relations: ['user', 'event']
            });

            let buffer: Buffer;
            let filename: string;
            let contentType: string;

            if (format === 'csv') {
                const csvData = await ExportService.exportEventParticipantsToCSV(participants, event);
                buffer = Buffer.from(csvData);
                filename = `peserta_${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
                contentType = 'text/csv';
            } else {
                buffer = await ExportService.exportEventParticipantsToExcel(participants, event);
                filename = `peserta_${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            }

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(buffer);

        } catch (error) {
            logger.error('Export event participants error:', error);
            res.status(500).json({ 
                message: 'Terjadi kesalahan saat mengexport data peserta' 
            });
        }
    }
}