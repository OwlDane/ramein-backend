"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipantController = void 0;
const database_1 = __importDefault(require("../config/database"));
const Participant_1 = require("../entities/Participant");
const Event_1 = require("../entities/Event");
const emailService_1 = require("../services/emailService");
const typeorm_1 = require("typeorm");
const exportService_1 = __importDefault(require("../services/exportService"));
const certificateService_1 = require("../services/certificateService");
const participantRepository = database_1.default.getRepository(Participant_1.Participant);
const eventRepository = database_1.default.getRepository(Event_1.Event);
class ParticipantController {
    static async register(req, res) {
        try {
            const { eventId } = req.body;
            const userId = req.user.id;
            const event = await eventRepository.findOne({
                where: { id: eventId, isPublished: true }
            });
            if (!event) {
                return res.status(404).json({ message: 'Event tidak ditemukan' });
            }
            const now = new Date();
            const eventDateTime = new Date(event.date);
            eventDateTime.setHours(parseInt(event.time.split(':')[0]));
            eventDateTime.setMinutes(parseInt(event.time.split(':')[1]));
            if (now >= eventDateTime) {
                return res.status(400).json({ message: 'Pendaftaran event sudah ditutup' });
            }
            const existingRegistration = await participantRepository.findOne({
                where: { userId, eventId }
            });
            if (existingRegistration) {
                return res.status(400).json({ message: 'Anda sudah terdaftar di event ini' });
            }
            const tokenNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            const participant = new Participant_1.Participant();
            participant.userId = userId;
            participant.eventId = eventId;
            participant.tokenNumber = tokenNumber;
            await participantRepository.save(participant);
            await (0, emailService_1.sendEventRegistrationEmail)(req.user.email, event.title, tokenNumber);
            return res.status(201).json({
                message: 'Berhasil mendaftar event. Silakan cek email Anda untuk token kehadiran.',
                participant
            });
        }
        catch (error) {
            console.error('Event registration error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mendaftar event' });
        }
    }
    static async markAttendance(req, res) {
        try {
            const { eventId, token } = req.body;
            const userId = req.user.id;
            const participant = await participantRepository.findOne({
                where: {
                    eventId,
                    userId,
                    tokenNumber: token
                },
                relations: ['event']
            });
            if (!participant) {
                return res.status(404).json({ message: 'Data pendaftaran tidak ditemukan atau token tidak valid' });
            }
            if (participant.hasAttended) {
                return res.status(400).json({ message: 'Anda sudah mengisi daftar hadir' });
            }
            const now = new Date();
            const eventDateTime = new Date(participant.event.date);
            eventDateTime.setHours(parseInt(participant.event.time.split(':')[0]));
            eventDateTime.setMinutes(parseInt(participant.event.time.split(':')[1]));
            if (now < eventDateTime) {
                return res.status(400).json({ message: 'Daftar hadir belum dibuka' });
            }
            participant.hasAttended = true;
            participant.attendedAt = new Date();
            await participantRepository.save(participant);
            return res.json({
                message: 'Daftar hadir berhasil diisi',
                participant
            });
        }
        catch (error) {
            console.error('Mark attendance error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengisi daftar hadir' });
        }
    }
    static async getUserEvents(req, res) {
        try {
            const participants = await participantRepository.find({
                where: { userId: req.user.id },
                relations: ['event'],
                order: { createdAt: 'DESC' }
            });
            return res.json(participants);
        }
        catch (error) {
            console.error('Get user events error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data event' });
        }
    }
    static async getUserCertificates(req, res) {
        try {
            const certificates = await participantRepository.find({
                where: {
                    userId: req.user.id,
                    hasAttended: true,
                    certificateUrl: (0, typeorm_1.MoreThan)("")
                },
                relations: ['event'],
                order: { attendedAt: 'DESC' }
            });
            return res.json(certificates);
        }
        catch (error) {
            console.error('Get certificates error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data sertifikat' });
        }
    }
    static async getEventParticipants(req, res) {
        try {
            const { eventId } = req.params;
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            const participants = await participantRepository.find({
                where: { eventId },
                relations: ['user', 'event'],
                order: { createdAt: 'DESC' }
            });
            return res.json(participants);
        }
        catch (error) {
            console.error('Get event participants error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data peserta' });
        }
    }
    static async uploadCertificate(req, res) {
        try {
            const { participantId } = req.params;
            const { certificateUrl } = req.body;
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            const participant = await participantRepository.findOne({
                where: {
                    id: participantId,
                    hasAttended: true
                }
            });
            if (!participant) {
                return res.status(404).json({ message: 'Data peserta tidak ditemukan atau peserta belum hadir' });
            }
            participant.certificateUrl = certificateUrl;
            await participantRepository.save(participant);
            return res.json({
                message: 'Sertifikat berhasil diunggah',
                participant
            });
        }
        catch (error) {
            console.error('Upload certificate error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengunggah sertifikat' });
        }
    }
    static async generateCertificate(req, res) {
        try {
            const { participantId } = req.params;
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            const participant = await participantRepository.findOne({ where: { id: participantId } });
            if (!participant) {
                return res.status(404).json({ message: 'Peserta tidak ditemukan' });
            }
            const created = await certificateService_1.certificateService.generateCertificate(participantId, participant.eventId, req.user.id);
            return res.json({
                message: 'Sertifikat berhasil dibuat',
                certificateUrl: created.certificateUrl
            });
        }
        catch (error) {
            console.error('Generate certificate error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat membuat sertifikat' });
        }
    }
    static async getMonthlyStatistics(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            const currentYear = new Date().getFullYear();
            const monthlyStats = await participantRepository
                .createQueryBuilder('participant')
                .select('EXTRACT(MONTH FROM participant.createdAt)', 'month')
                .addSelect('COUNT(*)', 'registrations')
                .addSelect('COUNT(CASE WHEN participant.hasAttended = true THEN 1 END)', 'attendance')
                .where('EXTRACT(YEAR FROM participant.createdAt) = :year', { year: currentYear })
                .groupBy('month')
                .orderBy('month', 'ASC')
                .getRawMany();
            return res.json(monthlyStats);
        }
        catch (error) {
            console.error('Get monthly statistics error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil statistik' });
        }
    }
    static async exportParticipants(req, res) {
        try {
            const { eventId } = req.params;
            const { format = 'xlsx' } = req.query;
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            const participants = await participantRepository.find({
                where: { eventId },
                relations: ['user', 'event'],
                order: { createdAt: 'DESC' }
            });
            const event = await eventRepository.findOne({
                where: { id: eventId }
            });
            if (!event) {
                return res.status(404).json({ message: 'Event tidak ditemukan' });
            }
            let buffer;
            let filename;
            let contentType;
            if (format === 'csv') {
                const csvData = await exportService_1.default.exportParticipantsToCSV(participants, event);
                buffer = Buffer.from(csvData);
                filename = `participants_${eventId}.csv`;
                contentType = 'text/csv';
            }
            else {
                buffer = await exportService_1.default.exportParticipantsToExcel(participants, event);
                filename = `participants_${eventId}.xlsx`;
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            }
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(buffer);
            return res;
        }
        catch (error) {
            console.error('Export participants error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengexport data peserta' });
        }
    }
    static async exportMonthlyStatistics(req, res) {
        try {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            const currentYear = new Date().getFullYear();
            const statistics = await participantRepository
                .createQueryBuilder('participant')
                .select('EXTRACT(MONTH FROM participant.createdAt)', 'month')
                .addSelect('COUNT(*)', 'registrations')
                .addSelect('COUNT(CASE WHEN participant.hasAttended = true THEN 1 END)', 'attendance')
                .where('EXTRACT(YEAR FROM participant.createdAt) = :year', { year: currentYear })
                .groupBy('month')
                .orderBy('month', 'ASC')
                .getRawMany();
            const buffer = await exportService_1.default.exportMonthlyStatisticsToExcel(statistics);
            const filename = `monthly_statistics_${currentYear}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.send(buffer);
            return res;
        }
        catch (error) {
            console.error('Export statistics error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengexport statistik' });
        }
    }
}
exports.ParticipantController = ParticipantController;
//# sourceMappingURL=ParticipantController.js.map