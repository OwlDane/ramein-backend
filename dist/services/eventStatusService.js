"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStatusService = void 0;
const Event_1 = require("../entities/Event");
const data_source_1 = require("../config/data-source");
class EventStatusService {
    constructor() {
        this.eventRepository = data_source_1.AppDataSource.getRepository(Event_1.Event);
    }
    async isRegistrationOpen(eventId) {
        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        if (!event)
            return false;
        const now = new Date();
        const eventDateTime = this.combineDateAndTime(event.date, event.time);
        return now < eventDateTime && event.allowRegistration;
    }
    async isAttendanceFormActive(eventId) {
        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        if (!event)
            return false;
        const now = new Date();
        const eventDateTime = this.combineDateAndTime(event.date, event.time);
        const eventDate = new Date(event.date);
        const isSameDay = now.toDateString() === eventDate.toDateString();
        const hasEventStarted = now >= eventDateTime;
        return isSameDay && hasEventStarted;
    }
    canCreateEvent(eventDate) {
        const now = new Date();
        const threeDaysBefore = new Date(eventDate);
        threeDaysBefore.setDate(eventDate.getDate() - 3);
        return now <= threeDaysBefore;
    }
    async autoCloseExpiredRegistrations() {
        const now = new Date();
        const expiredEvents = await this.eventRepository
            .createQueryBuilder("event")
            .where("event.allowRegistration = :allowReg", { allowReg: true })
            .andWhere("CONCAT(event.date, ' ', event.time) <= :now", { now: now.toISOString() })
            .getMany();
        for (const event of expiredEvents) {
            event.allowRegistration = false;
            await this.eventRepository.save(event);
        }
    }
    async getEventStatus(eventId) {
        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        if (!event) {
            throw new Error("Event not found");
        }
        const now = new Date();
        const eventDateTime = this.combineDateAndTime(event.date, event.time);
        const isRegistrationOpen = await this.isRegistrationOpen(eventId);
        const isAttendanceFormActive = await this.isAttendanceFormActive(eventId);
        const timeUntilEvent = this.getTimeDifference(now, eventDateTime);
        const timeUntilRegistrationCloses = this.getTimeDifference(now, eventDateTime);
        const canRegister = isRegistrationOpen && event.currentParticipants < event.maxParticipants;
        return {
            isRegistrationOpen,
            isAttendanceFormActive,
            timeUntilEvent,
            timeUntilRegistrationCloses,
            canRegister
        };
    }
    combineDateAndTime(date, time) {
        const dateObj = new Date(date);
        const [hours, minutes] = time.split(':').map(Number);
        dateObj.setHours(hours, minutes, 0, 0);
        return dateObj;
    }
    getTimeDifference(from, to) {
        const diff = to.getTime() - from.getTime();
        if (diff <= 0)
            return "Event has started";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (days > 0)
            return `${days} day(s), ${hours} hour(s)`;
        if (hours > 0)
            return `${hours} hour(s), ${minutes} minute(s)`;
        return `${minutes} minute(s)`;
    }
    validateEventCreationTime(eventDate) {
        if (!this.canCreateEvent(eventDate)) {
            return {
                isValid: false,
                message: "Event must be created at least 3 days before the event date"
            };
        }
        return { isValid: true, message: "Event creation time is valid" };
    }
    async getUpcomingEvents(limit = 10) {
        const now = new Date();
        return await this.eventRepository
            .createQueryBuilder("event")
            .where("event.isPublished = :published", { published: true })
            .andWhere("CONCAT(event.date, ' ', event.time) > :now", { now: now.toISOString() })
            .andWhere("event.allowRegistration = :allowReg", { allowReg: true })
            .orderBy("event.date", "ASC")
            .addOrderBy("event.time", "ASC")
            .limit(limit)
            .getMany();
    }
    async searchEvents(keyword, categoryId, startDate, endDate, sortBy = 'date', sortOrder = 'ASC', page = 1, limit = 10) {
        const queryBuilder = this.eventRepository
            .createQueryBuilder("event")
            .where("event.isPublished = :published", { published: true });
        if (keyword) {
            queryBuilder.andWhere("(event.title ILIKE :keyword OR event.description ILIKE :keyword OR event.location ILIKE :keyword)", { keyword: `%${keyword}%` });
        }
        if (categoryId) {
            queryBuilder.andWhere("event.categoryId = :categoryId", { categoryId });
        }
        if (startDate) {
            queryBuilder.andWhere("event.date >= :startDate", { startDate });
        }
        if (endDate) {
            queryBuilder.andWhere("event.date <= :endDate", { endDate });
        }
        const total = await queryBuilder.getCount();
        queryBuilder
            .orderBy(`event.${sortBy}`, sortOrder)
            .addOrderBy("event.date", "ASC")
            .addOrderBy("event.time", "ASC")
            .skip((page - 1) * limit)
            .limit(limit);
        const events = await queryBuilder.getMany();
        const totalPages = Math.ceil(total / limit);
        return {
            events,
            total,
            page,
            totalPages
        };
    }
}
exports.EventStatusService = EventStatusService;
//# sourceMappingURL=eventStatusService.js.map