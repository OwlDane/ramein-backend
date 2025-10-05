"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const typeorm_1 = require("typeorm");
const database_1 = __importDefault(require("../config/database"));
const Event_1 = require("../entities/Event");
const Participant_1 = require("../entities/Participant");
const date_fns_1 = require("date-fns");
class ReportService {
    constructor() {
        this.eventRepository = database_1.default.getRepository(Event_1.Event);
        this.participantRepository = database_1.default.getRepository(Participant_1.Participant);
    }
    async getMonthlyStatistics(months = 12) {
        if (!database_1.default.isInitialized) {
            await database_1.default.initialize();
        }
        const endDate = new Date();
        const startDate = (0, date_fns_1.subMonths)(endDate, months - 1);
        const monthsInRange = (0, date_fns_1.eachMonthOfInterval)({
            start: (0, date_fns_1.startOfMonth)(startDate),
            end: (0, date_fns_1.endOfMonth)(endDate)
        });
        const [events, participants] = await Promise.all([
            this.eventRepository.find({
                where: {
                    date: (0, typeorm_1.Between)((0, date_fns_1.startOfMonth)(startDate), (0, date_fns_1.endOfMonth)(endDate))
                },
                relations: ['participants']
            }),
            this.participantRepository.find({
                where: {
                    createdAt: (0, typeorm_1.Between)((0, date_fns_1.startOfMonth)(startDate), (0, date_fns_1.endOfMonth)(endDate))
                }
            })
        ]);
        const monthlyData = monthsInRange.map(month => {
            const monthKey = (0, date_fns_1.format)(month, 'yyyy-MM');
            const monthStart = (0, date_fns_1.startOfMonth)(month);
            const monthEnd = (0, date_fns_1.endOfMonth)(month);
            const monthEvents = events.filter(event => event.date >= monthStart && event.date <= monthEnd);
            const monthParticipants = participants.filter(participant => participant.createdAt >= monthStart && participant.createdAt <= monthEnd);
            const totalEvents = monthEvents.length;
            const totalParticipants = monthParticipants.length;
            const avgParticipantsPerEvent = totalEvents > 0
                ? Number((totalParticipants / totalEvents).toFixed(1))
                : 0;
            const topEvents = [...monthEvents]
                .sort((a, b) => b.participants.length - a.participants.length)
                .slice(0, 3)
                .map(event => ({
                id: event.id,
                title: event.title,
                participants: event.participants.length,
                date: event.date
            }));
            return {
                month: monthKey,
                totalEvents,
                totalParticipants,
                avgParticipantsPerEvent,
                topEvents
            };
        });
        const totalEvents = events.length;
        const totalParticipants = participants.length;
        const avgParticipantsPerEvent = totalEvents > 0
            ? Number((totalParticipants / totalEvents).toFixed(1))
            : 0;
        const topEventsOverall = [...events]
            .sort((a, b) => b.participants.length - a.participants.length)
            .slice(0, 10)
            .map(event => ({
            id: event.id,
            title: event.title,
            participants: event.participants.length,
            date: event.date
        }));
        return {
            period: {
                start: (0, date_fns_1.format)(startDate, 'yyyy-MM-dd'),
                end: (0, date_fns_1.format)(endDate, 'yyyy-MM-dd'),
                months: months
            },
            monthlyData,
            summary: {
                totalEvents,
                totalParticipants,
                avgParticipantsPerEvent,
                topEvents: topEventsOverall
            }
        };
    }
    async getTopEventsByParticipants(limit = 10) {
        if (!database_1.default.isInitialized) {
            await database_1.default.initialize();
        }
        const events = await this.eventRepository.find({
            relations: ['participants', 'participants.user']
        });
        return events
            .map(event => ({
            id: event.id,
            title: event.title,
            date: event.date,
            location: event.location,
            totalParticipants: event.participants.length,
            participants: event.participants.map(p => {
                var _a, _b;
                return ({
                    id: p.id,
                    name: ((_a = p.user) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown',
                    email: ((_b = p.user) === null || _b === void 0 ? void 0 : _b.email) || 'Unknown',
                    hasAttended: p.hasAttended
                });
            })
        }))
            .sort((a, b) => b.totalParticipants - a.totalParticipants)
            .slice(0, limit);
    }
    async getEventParticipationStats(eventId) {
        if (!database_1.default.isInitialized) {
            await database_1.default.initialize();
        }
        const event = await this.eventRepository.findOne({
            where: { id: eventId },
            relations: ['participants', 'participants.user']
        });
        if (!event) {
            throw new Error('Event not found');
        }
        const totalParticipants = event.participants.length;
        const attendedParticipants = event.participants.filter(p => p.hasAttended).length;
        const attendanceRate = totalParticipants > 0
            ? Number(((attendedParticipants / totalParticipants) * 100).toFixed(2))
            : 0;
        const registrationsByDate = event.participants.reduce((acc, participant) => {
            const date = participant.createdAt.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
        const registrationTimeline = Object.entries(registrationsByDate)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const demographics = event.participants.reduce((acc, participant) => {
            const status = participant.hasAttended ? 'attended' : 'registered';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        return {
            event: {
                id: event.id,
                title: event.title,
                date: event.date,
                location: event.location
            },
            statistics: {
                totalParticipants,
                attendedParticipants,
                attendanceRate,
                pendingParticipants: totalParticipants - attendedParticipants
            },
            registrationTimeline,
            demographics
        };
    }
}
exports.ReportService = ReportService;
exports.default = new ReportService();
//# sourceMappingURL=reportService.js.map