"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsService = void 0;
const data_source_1 = require("../config/data-source");
const Event_1 = require("../entities/Event");
const Participant_1 = require("../entities/Participant");
const User_1 = require("../entities/User");
const ExcelJS = __importStar(require("exceljs"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class StatisticsService {
    constructor() {
        this.eventRepository = data_source_1.AppDataSource.getRepository(Event_1.Event);
        this.participantRepository = data_source_1.AppDataSource.getRepository(Participant_1.Participant);
        this.userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
    }
    async getMonthlyEventStats(year = new Date().getFullYear()) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const stats = [];
        for (let month = 1; month <= 12; month++) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            const eventCount = await this.eventRepository
                .createQueryBuilder("event")
                .where("event.date >= :startDate", { startDate })
                .andWhere("event.date <= :endDate", { endDate })
                .andWhere("event.isPublished = :published", { published: true })
                .getCount();
            const participantCount = await this.participantRepository
                .createQueryBuilder("participant")
                .innerJoin("participant.event", "event")
                .where("event.date >= :startDate", { startDate })
                .andWhere("event.date <= :endDate", { endDate })
                .andWhere("participant.hasAttended = :attended", { attended: true })
                .getCount();
            stats.push({
                month: months[month - 1],
                eventCount,
                participantCount
            });
        }
        return stats;
    }
    async getTopEventsByParticipants(limit = 10) {
        return await this.eventRepository
            .createQueryBuilder("event")
            .select([
            "event.id as eventId",
            "event.title as eventTitle",
            "event.date as eventDate",
            "COUNT(participant.id) as participantCount"
        ])
            .leftJoin("event.participants", "participant")
            .where("event.isPublished = :published", { published: true })
            .groupBy("event.id, event.title, event.date")
            .orderBy("participantCount", "DESC")
            .limit(limit)
            .getRawMany();
    }
    async getOverallStats() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const [totalEvents, totalParticipants, totalUsers, eventsThisMonth, participantsThisMonth, upcomingEvents, completedEvents] = await Promise.all([
            this.eventRepository.count({ where: { isPublished: true } }),
            this.participantRepository.count({ where: { hasAttended: true } }),
            this.userRepository.count(),
            this.eventRepository.count({
                where: {
                    date: { gte: startOfMonth, lte: endOfMonth },
                    isPublished: true
                }
            }),
            this.participantRepository
                .createQueryBuilder("participant")
                .innerJoin("participant.event", "event")
                .where("event.date >= :startDate", { startDate: startOfMonth })
                .andWhere("event.date <= :endDate", { endDate: endOfMonth })
                .andWhere("participant.hasAttended = :attended", { attended: true })
                .getCount(),
            this.eventRepository.count({
                where: {
                    date: { gt: now },
                    isPublished: true,
                    allowRegistration: true
                }
            }),
            this.eventRepository.count({
                where: {
                    date: { lt: now },
                    isPublished: true
                }
            })
        ]);
        return {
            totalEvents,
            totalParticipants,
            totalUsers,
            eventsThisMonth,
            participantsThisMonth,
            upcomingEvents,
            completedEvents
        };
    }
    async exportEventsToExcel(startDate, endDate, categoryId) {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Events Data');
            worksheet.columns = [
                { header: 'Event ID', key: 'id', width: 36 },
                { header: 'Title', key: 'title', width: 30 },
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Time', key: 'time', width: 10 },
                { header: 'Location', key: 'location', width: 25 },
                { header: 'Description', key: 'description', width: 40 },
                { header: 'Max Participants', key: 'maxParticipants', width: 15 },
                { header: 'Current Participants', key: 'currentParticipants', width: 15 },
                { header: 'Registration Open', key: 'allowRegistration', width: 15 },
                { header: 'Published', key: 'isPublished', width: 12 },
                { header: 'Created At', key: 'createdAt', width: 20 }
            ];
            const queryBuilder = this.eventRepository
                .createQueryBuilder("event")
                .orderBy("event.date", "DESC");
            if (startDate) {
                queryBuilder.andWhere("event.date >= :startDate", { startDate });
            }
            if (endDate) {
                queryBuilder.andWhere("event.date <= :endDate", { endDate });
            }
            if (categoryId) {
                queryBuilder.andWhere("event.categoryId = :categoryId", { categoryId });
            }
            const events = await queryBuilder.getMany();
            events.forEach(event => {
                worksheet.addRow({
                    id: event.id,
                    title: event.title,
                    date: event.date.toLocaleDateString(),
                    time: event.time,
                    location: event.location,
                    description: event.description,
                    maxParticipants: event.maxParticipants || 'Unlimited',
                    currentParticipants: event.currentParticipants,
                    allowRegistration: event.allowRegistration ? 'Yes' : 'No',
                    isPublished: event.isPublished ? 'Yes' : 'No',
                    createdAt: event.createdAt.toLocaleDateString()
                });
            });
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `events_export_${timestamp}.xlsx`;
            const filepath = path.join(__dirname, '../../public/exports', filename);
            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            await workbook.xlsx.writeFile(filepath);
            return { success: true, filePath: `/exports/${filename}` };
        }
        catch (error) {
            console.error("Error exporting events to Excel:", error);
            return { success: false, error: "Failed to export events" };
        }
    }
    async exportParticipantsToExcel(eventId, startDate, endDate) {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Participants Data');
            worksheet.columns = [
                { header: 'Participant ID', key: 'id', width: 36 },
                { header: 'User ID', key: 'userId', width: 36 },
                { header: 'Event ID', key: 'eventId', width: 36 },
                { header: 'Token Number', key: 'tokenNumber', width: 15 },
                { header: 'Has Attended', key: 'hasAttended', width: 15 },
                { header: 'Attended At', key: 'attendedAt', width: 20 },
                { header: 'Certificate URL', key: 'certificateUrl', width: 50 },
                { header: 'Notes', key: 'notes', width: 30 },
                { header: 'Created At', key: 'createdAt', width: 20 }
            ];
            const queryBuilder = this.participantRepository
                .createQueryBuilder("participant")
                .leftJoin("participant.event", "event")
                .leftJoin("participant.user", "user")
                .addSelect([
                "user.fullName",
                "user.email",
                "user.phoneNumber",
                "event.title",
                "event.date"
            ])
                .orderBy("participant.createdAt", "DESC");
            if (eventId) {
                queryBuilder.andWhere("participant.eventId = :eventId", { eventId });
            }
            if (startDate) {
                queryBuilder.andWhere("event.date >= :startDate", { startDate });
            }
            if (endDate) {
                queryBuilder.andWhere("event.date <= :endDate", { endDate });
            }
            const participants = await queryBuilder.getMany();
            participants.forEach(participant => {
                worksheet.addRow({
                    id: participant.id,
                    userId: participant.userId,
                    eventId: participant.eventId,
                    tokenNumber: participant.tokenNumber,
                    hasAttended: participant.hasAttended ? 'Yes' : 'No',
                    attendedAt: participant.attendedAt ? participant.attendedAt.toLocaleDateString() : 'N/A',
                    certificateUrl: participant.certificateUrl || 'N/A',
                    notes: participant.notes || 'N/A',
                    createdAt: participant.createdAt.toLocaleDateString()
                });
            });
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `participants_export_${timestamp}.xlsx`;
            const filepath = path.join(__dirname, '../../public/exports', filename);
            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            await workbook.xlsx.writeFile(filepath);
            return { success: true, filePath: `/exports/${filename}` };
        }
        catch (error) {
            console.error("Error exporting participants to Excel:", error);
            return { success: false, error: "Failed to export participants" };
        }
    }
    async getCategoryEventStats() {
        return await this.eventRepository
            .createQueryBuilder("event")
            .leftJoin("event.category", "category")
            .leftJoin("event.participants", "participant")
            .select([
            "category.id as categoryId",
            "category.name as categoryName",
            "COUNT(DISTINCT event.id) as eventCount",
            "COUNT(participant.id) as participantCount"
        ])
            .where("event.isPublished = :published", { published: true })
            .groupBy("category.id, category.name")
            .orderBy("eventCount", "DESC")
            .getRawMany();
    }
    async getUserRegistrationStats(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const stats = [];
        const currentDate = new Date(startDate);
        while (currentDate <= new Date()) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + 1);
            const newUsers = await this.userRepository.count({
                where: {
                    createdAt: { gte: currentDate, lt: nextDate }
                }
            });
            const totalUsers = await this.userRepository.count({
                where: {
                    createdAt: { lte: nextDate }
                }
            });
            stats.push({
                date: dateStr,
                newUsers,
                totalUsers
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return stats;
    }
}
exports.StatisticsService = StatisticsService;
//# sourceMappingURL=statisticsService.js.map