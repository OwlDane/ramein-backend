"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipantController = void 0;
const database_1 = __importDefault(require("../config/database"));
const Participant_1 = require("../entities/Participant");
const Event_1 = require("../entities/Event");
const Transaction_1 = require("../entities/Transaction");
const emailService_1 = require("../services/emailService");
const typeorm_1 = require("typeorm");
const exportService_1 = __importDefault(require("../services/exportService"));
const certificateService_1 = require("../services/certificateService");
const participantRepository = database_1.default.getRepository(Participant_1.Participant);
const eventRepository = database_1.default.getRepository(Event_1.Event);
const transactionRepository = database_1.default.getRepository(Transaction_1.Transaction);
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
            if (event.price > 0) {
                const paidTransaction = await transactionRepository.findOne({
                    where: {
                        userId,
                        eventId,
                        paymentStatus: Transaction_1.PaymentStatus.PAID
                    }
                });
                if (!paidTransaction) {
                    return res.status(400).json({
                        message: 'Event berbayar. Silakan lakukan pembayaran terlebih dahulu.',
                        requiresPayment: true,
                        eventPrice: event.price
                    });
                }
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
            try {
                const certificate = await certificateService_1.certificateService.generateCertificate(participant.id, participant.eventId, 'SYSTEM');
                participant.certificateUrl = certificate.certificateUrl;
                await participantRepository.save(participant);
                return res.json({
                    message: 'Daftar hadir berhasil diisi dan sertifikat telah digenerate',
                    participant,
                    certificate: {
                        certificateUrl: certificate.certificateUrl,
                        certificateNumber: certificate.certificateNumber
                    }
                });
            }
            catch (certError) {
                console.error('Certificate generation error:', certError);
                return res.json({
                    message: 'Daftar hadir berhasil diisi. Sertifikat akan digenerate secara manual.',
                    participant,
                    certificateWarning: 'Sertifikat gagal digenerate otomatis'
                });
            }
        }
        catch (error) {
            console.error('Mark attendance error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengisi daftar hadir' });
        }
    }
    static async checkRegistrationStatus(req, res) {
        try {
            const userId = req.user.id;
            const { eventIds } = req.query;
            console.log('📥 Check registration request - userId:', userId, 'eventIds:', eventIds);
            if (!eventIds) {
                return res.status(400).json({ message: 'Event IDs required' });
            }
            const eventIdArray = typeof eventIds === 'string'
                ? eventIds.split(',').map(id => id.trim())
                : Array.isArray(eventIds)
                    ? eventIds.map(id => String(id).trim())
                    : [String(eventIds).trim()];
            console.log('🔍 Parsed event IDs:', eventIdArray);
            const registrations = await participantRepository.find({
                where: {
                    userId,
                    eventId: (0, typeorm_1.In)(eventIdArray)
                },
                select: ['eventId', 'id']
            });
            console.log('✅ Found registrations:', registrations.length, registrations.map(r => r.eventId));
            const statusMap = {};
            eventIdArray.forEach(eventId => {
                const eventIdStr = String(eventId);
                statusMap[eventIdStr] = registrations.some(r => r.eventId === eventIdStr);
            });
            console.log('📊 Status map:', statusMap);
            return res.json(statusMap);
        }
        catch (error) {
            console.error('❌ Check registration status error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengecek status pendaftaran' });
        }
    }
    static async getUserEvents(req, res) {
        try {
            const participants = await participantRepository
                .createQueryBuilder('participant')
                .leftJoinAndSelect('participant.event', 'event')
                .leftJoin('certificate', 'cert', 'cert.participantId = participant.id')
                .addSelect([
                'cert.id',
                'cert.certificateNumber',
                'cert.certificateUrl',
                'cert.verificationCode',
                'cert.isVerified',
                'cert.issuedAt'
            ])
                .where('participant.userId = :userId', { userId: req.user.id })
                .orderBy('participant.createdAt', 'DESC')
                .getMany();
            const result = participants.map(p => ({
                ...p,
                certificate: p.cert || null
            }));
            return res.json(result);
        }
        catch (error) {
            console.error('Get user events error:', error);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data event' });
        }
    }
    static async getUserCertificates(req, res) {
        try {
            console.log('[getUserCertificates] Fetching certificates for user:', req.user.id);
            const certificateRepository = database_1.default.getRepository('Certificate');
            const certificates = await certificateRepository
                .createQueryBuilder('certificate')
                .leftJoinAndSelect('certificate.participant', 'participant')
                .leftJoinAndSelect('certificate.event', 'event')
                .leftJoinAndSelect('participant.user', 'user')
                .where('participant.userId = :userId', { userId: req.user.id })
                .orderBy('certificate.issuedAt', 'DESC')
                .getMany();
            console.log('[getUserCertificates] Found certificates:', certificates.length);
            return res.json(certificates);
        }
        catch (error) {
            console.error('[getUserCertificates] Error:', error);
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