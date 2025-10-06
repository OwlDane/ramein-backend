"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsService = void 0;
const database_1 = __importDefault(require("../config/database"));
const Event_1 = require("../entities/Event");
const Participant_1 = require("../entities/Participant");
class StatisticsService {
    static async getMonthlyEventsStats() {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31);
        const events = await this.eventRepository
            .createQueryBuilder('event')
            .where('event.date BETWEEN :startDate AND :endDate', { startDate, endDate })
            .getMany();
        const monthlyStats = Array(12).fill(0);
        events.forEach(event => {
            const eventDate = new Date(event.date);
            const month = eventDate.getMonth();
            monthlyStats[month]++;
        });
        return monthlyStats;
    }
    static async getMonthlyParticipantsStats() {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31);
        const participants = await this.participantRepository
            .createQueryBuilder('participant')
            .leftJoinAndSelect('participant.event', 'event')
            .where('participant.hasAttended = :hasAttended', { hasAttended: true })
            .andWhere('event.date BETWEEN :startDate AND :endDate', { startDate, endDate })
            .getMany();
        const monthlyStats = Array(12).fill(0);
        participants.forEach(participant => {
            const eventDate = new Date(participant.event.date);
            const month = eventDate.getMonth();
            monthlyStats[month]++;
        });
        return monthlyStats;
    }
    static async getTopEvents() {
        const events = await this.eventRepository
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.participants', 'participants')
            .where('participants.hasAttended = :hasAttended', { hasAttended: true })
            .select(['event.id', 'event.title', 'event.date'])
            .addSelect('COUNT(participants.id)', 'participantCount')
            .groupBy('event.id')
            .orderBy('participantCount', 'DESC')
            .limit(10)
            .getRawMany();
        return events.map(event => ({
            id: event.event_id,
            title: event.event_title,
            date: event.event_date,
            participantCount: parseInt(event.participantCount)
        }));
    }
    static async getDashboardStats() {
        const [monthlyEvents, monthlyParticipants, topEvents] = await Promise.all([
            this.getMonthlyEventsStats(),
            this.getMonthlyParticipantsStats(),
            this.getTopEvents()
        ]);
        return {
            monthlyEvents,
            monthlyParticipants,
            topEvents,
            months: [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ]
        };
    }
}
exports.StatisticsService = StatisticsService;
StatisticsService.eventRepository = database_1.default.getRepository(Event_1.Event);
StatisticsService.participantRepository = database_1.default.getRepository(Participant_1.Participant);
//# sourceMappingURL=statisticsService.js.map