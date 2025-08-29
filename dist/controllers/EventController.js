"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventController = void 0;
const database_1 = __importDefault(require("../config/database"));
const Event_1 = require("../entities/Event");
const eventRepository = database_1.default.getRepository(Event_1.Event);
class EventController {
    static async create(req, res) {
        try {
            const { title, date, time, location, flyer, description } = req.body;
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Hanya admin yang dapat membuat event' });
            }
            const eventDate = new Date(date);
            const today = new Date();
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(today.getDate() + 3);
            if (eventDate < threeDaysFromNow) {
                return res.status(400).json({
                    message: 'Event hanya dapat dibuat minimal 3 hari sebelum tanggal pelaksanaan'
                });
            }
            const event = new Event_1.Event();
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
        }
        catch (error) {
            console.error('Create event error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat membuat event' });
        }
    }
    static async getAll(req, res) {
        try {
            const { search, sort, category } = req.query;
            let query = eventRepository.createQueryBuilder('event');
            if (search) {
                query = query.where('LOWER(event.title) LIKE LOWER(:search) OR LOWER(event.description) LIKE LOWER(:search)', { search: `%${search}%` });
            }
            if (category && String(category).toLowerCase() !== 'all') {
                query = query.andWhere('LOWER(event.category) = LOWER(:category)', { category });
            }
            switch (sort) {
                case 'nearest':
                    query = query.orderBy('event.date', 'ASC');
                    break;
                case 'furthest':
                    query = query.orderBy('event.date', 'DESC');
                    break;
                case 'price-asc':
                    query = query.orderBy('event.price', 'ASC');
                    break;
                case 'price-desc':
                    query = query.orderBy('event.price', 'DESC');
                    break;
                default:
                    query = query.orderBy('event.date', 'ASC');
            }
            query = query
                .andWhere('event.isPublished = :isPublished', { isPublished: true })
                .andWhere('event.date >= :today', { today: new Date() });
            const events = await query.getMany();
            return res.json(events);
        }
        catch (error) {
            console.error('Get events error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data event' });
        }
    }
    static async publish(req, res) {
        try {
            const { id } = req.params;
            const event = await eventRepository.findOne({ where: { id } });
            if (!event) {
                return res.status(404).json({ message: 'Event tidak ditemukan' });
            }
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Hanya admin yang dapat mempublikasi event' });
            }
            event.isPublished = true;
            await eventRepository.save(event);
            return res.json({ message: 'Event berhasil dipublikasikan', event });
        }
        catch (error) {
            console.error('Publish event error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mempublikasi event' });
        }
    }
    static async unpublish(req, res) {
        try {
            const { id } = req.params;
            const event = await eventRepository.findOne({ where: { id } });
            if (!event) {
                return res.status(404).json({ message: 'Event tidak ditemukan' });
            }
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Hanya admin yang dapat membatalkan publikasi event' });
            }
            event.isPublished = false;
            await eventRepository.save(event);
            return res.json({ message: 'Event berhasil dibatalkan publikasinya', event });
        }
        catch (error) {
            console.error('Unpublish event error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat membatalkan publikasi event' });
        }
    }
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const event = await eventRepository.findOne({
                where: { id }
            });
            if (!event) {
                return res.status(404).json({ message: 'Event tidak ditemukan' });
            }
            return res.json(event);
        }
        catch (error) {
            console.error('Get event error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data event' });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { title, date, time, location, flyer, description, isPublished } = req.body;
            const event = await eventRepository.findOne({
                where: { id }
            });
            if (!event) {
                return res.status(404).json({ message: 'Event tidak ditemukan' });
            }
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Hanya admin yang dapat mengubah event' });
            }
            if (title)
                event.title = title;
            if (date)
                event.date = new Date(date);
            if (time)
                event.time = time;
            if (location)
                event.location = location;
            if (flyer)
                event.flyer = flyer;
            if (description)
                event.description = description;
            if (typeof isPublished === 'boolean')
                event.isPublished = isPublished;
            await eventRepository.save(event);
            return res.json({
                message: 'Event berhasil diupdate',
                event
            });
        }
        catch (error) {
            console.error('Update event error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate event' });
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const event = await eventRepository.findOne({
                where: { id }
            });
            if (!event) {
                return res.status(404).json({ message: 'Event tidak ditemukan' });
            }
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Hanya admin yang dapat menghapus event' });
            }
            await eventRepository.remove(event);
            return res.json({ message: 'Event berhasil dihapus' });
        }
        catch (error) {
            console.error('Delete event error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat menghapus event' });
        }
    }
    static async getStatistics(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Hanya admin yang dapat melihat statistik' });
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
                .getRawMany();
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
        }
        catch (error) {
            console.error('Get statistics error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil statistik' });
        }
    }
}
exports.EventController = EventController;
//# sourceMappingURL=EventController.js.map