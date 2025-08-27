"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const database_1 = __importDefault(require("../config/database"));
const Participant_1 = require("../entities/Participant");
class AttendanceService {
    constructor() {
        this.participantRepository = database_1.default.getRepository(Participant_1.Participant);
    }
    isAttendanceOpen(event) {
        const now = new Date();
        const eventDateTime = new Date(event.date);
        const [hh, mm] = event.time.split(':');
        eventDateTime.setHours(parseInt(hh, 10));
        eventDateTime.setMinutes(parseInt(mm, 10));
        return now >= eventDateTime;
    }
    async generateAttendanceToken(_eventId) {
        const token = Math.random().toString(36).slice(2, 10).toUpperCase();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        return { token, expiresAt };
    }
    async markAttendanceByRegistrationToken(eventId, userId, token) {
        if (!database_1.default.isInitialized) {
            await database_1.default.initialize();
        }
        const participant = await this.participantRepository.findOne({
            where: { eventId, userId, tokenNumber: token },
            relations: ['event']
        });
        if (!participant) {
            throw new Error('Invalid token or participant not found');
        }
        if (participant.hasAttended) {
            throw new Error('Attendance already marked');
        }
        if (!this.isAttendanceOpen(participant.event)) {
            throw new Error('Attendance is not open yet');
        }
        participant.hasAttended = true;
        participant.attendedAt = new Date();
        await this.participantRepository.save(participant);
        return true;
    }
    async markAttendance(participantId, token) {
        if (!database_1.default.isInitialized) {
            await database_1.default.initialize();
        }
        const participant = await this.participantRepository.findOne({ where: { id: participantId }, relations: ['event'] });
        if (!participant) {
            throw new Error('Participant not found');
        }
        return this.markAttendanceByRegistrationToken(participant.eventId, participant.userId, token);
    }
    async getEventAttendanceStats(eventId) {
        if (!database_1.default.isInitialized) {
            await database_1.default.initialize();
        }
        const [total, attended] = await Promise.all([
            this.participantRepository.count({ where: { eventId } }),
            this.participantRepository.count({ where: { eventId, hasAttended: true } })
        ]);
        return {
            totalParticipants: total,
            attended,
            notAttended: total - attended,
            attendanceRate: total > 0 ? Number(((attended / total) * 100).toFixed(2)) : 0
        };
    }
    async getEventAttendanceList(eventId) {
        if (!database_1.default.isInitialized) {
            await database_1.default.initialize();
        }
        const participants = await this.participantRepository.find({
            where: { eventId },
            relations: ['user'],
            select: {
                id: true,
                hasAttended: true,
                attendedAt: true,
                user: { id: true, name: true, email: true }
            },
            order: { hasAttended: 'DESC', attendedAt: 'ASC' }
        });
        return participants.map(p => ({
            id: p.id,
            user: { id: p.user.id, name: p.user.name, email: p.user.email },
            hasAttended: p.hasAttended,
            attendedAt: p.attendedAt,
            status: p.hasAttended ? 'Present' : 'Absent'
        }));
    }
}
exports.AttendanceService = AttendanceService;
exports.default = new AttendanceService();
//# sourceMappingURL=attendanceService.js.map