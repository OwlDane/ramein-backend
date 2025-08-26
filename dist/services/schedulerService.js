"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const eventStatusService_1 = require("./eventStatusService");
const data_source_1 = require("../config/data-source");
const Event_1 = require("../entities/Event");
class SchedulerService {
    constructor() {
        this.eventStatusService = new eventStatusService_1.EventStatusService();
        this.eventRepository = data_source_1.AppDataSource.getRepository(Event_1.Event);
        this.intervalId = null;
        this.lastRunTime = new Date();
    }
    start() {
        console.log("Starting Scheduler Service...");
        this.intervalId = setInterval(async () => {
            try {
                await this.runScheduledTasks();
            }
            catch (error) {
                console.error("Error in scheduled task:", error);
            }
        }, 60000);
        this.runScheduledTasks();
    }
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log("Scheduler Service stopped");
        }
    }
    async runScheduledTasks() {
        console.log("Running scheduled tasks...");
        await this.autoCloseExpiredRegistrations();
        await this.cleanupOldEvents();
        await this.updateEventStatuses();
        console.log("Scheduled tasks completed");
    }
    async autoCloseExpiredRegistrations() {
        try {
            await this.eventStatusService.autoCloseExpiredRegistrations();
            console.log("Auto-close expired registrations completed");
        }
        catch (error) {
            console.error("Error in auto-close expired registrations:", error);
        }
    }
    async cleanupOldEvents() {
        try {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            const oldEvents = await this.eventRepository
                .createQueryBuilder("event")
                .leftJoin("event.participants", "participant")
                .where("event.date < :oneYearAgo", { oneYearAgo })
                .andWhere("event.isPublished = :published", { published: false })
                .andWhere("participant.id IS NULL")
                .getMany();
            if (oldEvents.length > 0) {
                await this.eventRepository.remove(oldEvents);
                console.log(`Cleaned up ${oldEvents.length} old events`);
            }
        }
        catch (error) {
            console.error("Error in cleanup old events:", error);
        }
    }
    async updateEventStatuses() {
        try {
            const now = new Date();
            const eventsToUpdate = await this.eventRepository
                .createQueryBuilder("event")
                .where("event.allowRegistration = :allowReg", { allowReg: true })
                .andWhere("CONCAT(event.date, ' ', event.time) <= :now", { now: now.toISOString() })
                .getMany();
            for (const event of eventsToUpdate) {
                event.allowRegistration = false;
                await this.eventRepository.save(event);
            }
            if (eventsToUpdate.length > 0) {
                console.log(`Updated status for ${eventsToUpdate.length} events`);
            }
        }
        catch (error) {
            console.error("Error in update event statuses:", error);
        }
    }
    getStatus() {
        return {
            isRunning: this.intervalId !== null,
            lastRun: this.lastRunTime
        };
    }
    async triggerManualRun() {
        console.log("Manual trigger of scheduled tasks");
        this.lastRunTime = new Date();
        await this.runScheduledTasks();
    }
}
exports.SchedulerService = SchedulerService;
//# sourceMappingURL=schedulerService.js.map