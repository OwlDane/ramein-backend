import { Request, Response } from 'express';
import AppDataSource from '../config/database';
import { Event } from '../entities/Event';
import { AuthRequest } from '../middlewares/auth';

const eventRepository = AppDataSource.getRepository(Event);

export class EventController {
    // Create a new event
    static async create(req: AuthRequest, res: Response) {
        try {
            const { title, date, time, location, flyer, description } = req.body;

            // Check if user is admin
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Hanya admin yang dapat membuat event' });
            }

            // Validate event date (H-3 rule)
            const eventDate = new Date(date);
            const today = new Date();
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(today.getDate() + 3);

            if (eventDate < threeDaysFromNow) {
                return res.status(400).json({
                    message: 'Event hanya dapat dibuat minimal 3 hari sebelum tanggal pelaksanaan'
                });
            }

            const event = new Event();
            event.title = title;
            event.date = eventDate;
            event.time = time;
            event.location = location;
            event.flyer = flyer;
            event.description = description;
            event.createdBy = req.user.id;

            await eventRepository.save(event);

            return res.status(201).json({
                message: 'Event berhasil dibuat',
                event
            });
        } catch (error) {
            console.error('Create event error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat membuat event' });
        }
    }

    // Get all events
    static async getAll(req: Request, res: Response) {
        try {
            const { search, sort } = req.query;
            
            let query = eventRepository.createQueryBuilder('event');

            // Search functionality
            if (search) {
                query = query.where(
                    'LOWER(event.title) LIKE LOWER(:search) OR LOWER(event.description) LIKE LOWER(:search)',
                    { search: `%${search}%` }
                );
            }

            // Sort by date
            if (sort === 'nearest') {
                query = query.orderBy('event.date', 'ASC');
            } else if (sort === 'furthest') {
                query = query.orderBy('event.date', 'DESC');
            }

            // Only show published events and future events
            query = query
                .andWhere('event.isPublished = :isPublished', { isPublished: true })
                .andWhere('event.date >= :today', { today: new Date() });

            const events = await query.getMany();

            return res.json(events);
        } catch (error) {
            console.error('Get events error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data event' });
        }
    }

    // Get event by ID
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const event = await eventRepository.findOne({
                where: { id }
            });

            if (!event) {
                return res.status(404).json({ message: 'Event tidak ditemukan' });
            }

            return res.json(event);
        } catch (error) {
            console.error('Get event error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data event' });
        }
    }

    // Update event
    static async update(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { title, date, time, location, flyer, description, isPublished } = req.body;

            const event = await eventRepository.findOne({
                where: { id }
            });

            if (!event) {
                return res.status(404).json({ message: 'Event tidak ditemukan' });
            }

            // Check if user is admin
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Hanya admin yang dapat mengubah event' });
            }

            // Update event properties
            if (title) event.title = title;
            if (date) event.date = new Date(date);
            if (time) event.time = time;
            if (location) event.location = location;
            if (flyer) event.flyer = flyer;
            if (description) event.description = description;
            if (typeof isPublished === 'boolean') event.isPublished = isPublished;

            await eventRepository.save(event);

            return res.json({
                message: 'Event berhasil diupdate',
                event
            });
        } catch (error) {
            console.error('Update event error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate event' });
        }
    }

    // Delete event
    static async delete(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            const event = await eventRepository.findOne({
                where: { id }
            });

            if (!event) {
                return res.status(404).json({ message: 'Event tidak ditemukan' });
            }

            // Check if user is admin
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Hanya admin yang dapat menghapus event' });
            }

            await eventRepository.remove(event);

            return res.json({ message: 'Event berhasil dihapus' });
        } catch (error) {
            console.error('Delete event error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat menghapus event' });
        }
    }

    // Get event statistics
    static async getStatistics(req: AuthRequest, res: Response) {
        try {
            // Check if user is admin
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Hanya admin yang dapat melihat statistik' });
            }

            const currentYear = new Date().getFullYear();
            const startOfYear = new Date(currentYear, 0, 1);
            const endOfYear = new Date(currentYear, 11, 31);

            // Get monthly event counts
            const monthlyEvents = await eventRepository
                .createQueryBuilder('event')
                .select('EXTRACT(MONTH FROM event.date) as month')
                .addSelect('COUNT(*)', 'count')
                .where('event.date BETWEEN :start AND :end', { 
                    start: startOfYear,
                    end: endOfYear
                })
                .groupBy('month')
                .getRawMany();

            // Get top 10 events by participant count
            const topEvents = await eventRepository
                .createQueryBuilder('event')
                .leftJoinAndSelect('event.participants', 'participant')
                .select(['event.title', 'COUNT(participant.id) as participantCount'])
                .groupBy('event.id')
                .orderBy('participantCount', 'DESC')
                .limit(10)
                .getRawMany();

            return res.json({
                monthlyEvents,
                topEvents
            });
        } catch (error) {
            console.error('Get statistics error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil statistik' });
        }
    }
}
