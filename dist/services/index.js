"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceManager = exports.MonitoringService = exports.CacheKeys = exports.CacheService = exports.LogLevel = exports.LoggingService = exports.RateLimitRules = exports.RateLimitService = exports.AttendanceService = exports.StatisticsService = exports.CertificateService = exports.SchedulerService = exports.EventStatusService = void 0;
const eventStatusService_1 = require("./eventStatusService");
const schedulerService_1 = require("./schedulerService");
const certificateService_1 = require("./certificateService");
const statisticsService_1 = require("./statisticsService");
const attendanceService_1 = require("./attendanceService");
const rateLimitService_1 = require("./rateLimitService");
const loggingService_1 = require("./loggingService");
const cacheService_1 = require("./cacheService");
const monitoringService_1 = require("./monitoringService");
var eventStatusService_2 = require("./eventStatusService");
Object.defineProperty(exports, "EventStatusService", { enumerable: true, get: function () { return eventStatusService_2.EventStatusService; } });
var schedulerService_2 = require("./schedulerService");
Object.defineProperty(exports, "SchedulerService", { enumerable: true, get: function () { return schedulerService_2.SchedulerService; } });
var certificateService_2 = require("./certificateService");
Object.defineProperty(exports, "CertificateService", { enumerable: true, get: function () { return certificateService_2.CertificateService; } });
var statisticsService_2 = require("./statisticsService");
Object.defineProperty(exports, "StatisticsService", { enumerable: true, get: function () { return statisticsService_2.StatisticsService; } });
var attendanceService_2 = require("./attendanceService");
Object.defineProperty(exports, "AttendanceService", { enumerable: true, get: function () { return attendanceService_2.AttendanceService; } });
var rateLimitService_2 = require("./rateLimitService");
Object.defineProperty(exports, "RateLimitService", { enumerable: true, get: function () { return rateLimitService_2.RateLimitService; } });
Object.defineProperty(exports, "RateLimitRules", { enumerable: true, get: function () { return rateLimitService_2.RateLimitRules; } });
var loggingService_2 = require("./loggingService");
Object.defineProperty(exports, "LoggingService", { enumerable: true, get: function () { return loggingService_2.LoggingService; } });
Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function () { return loggingService_2.LogLevel; } });
var cacheService_2 = require("./cacheService");
Object.defineProperty(exports, "CacheService", { enumerable: true, get: function () { return cacheService_2.CacheService; } });
Object.defineProperty(exports, "CacheKeys", { enumerable: true, get: function () { return cacheService_2.CacheKeys; } });
var monitoringService_2 = require("./monitoringService");
Object.defineProperty(exports, "MonitoringService", { enumerable: true, get: function () { return monitoringService_2.MonitoringService; } });
class ServiceManager {
    constructor() {
        this.services = new Map();
        this.initialized = false;
    }
    static getInstance() {
        if (!ServiceManager.instance) {
            ServiceManager.instance = new ServiceManager();
        }
        return ServiceManager.instance;
    }
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            console.log('Initializing services...');
            const eventStatusService = new eventStatusService_1.EventStatusService();
            const schedulerService = new schedulerService_1.SchedulerService();
            const certificateService = new certificateService_1.CertificateService();
            const statisticsService = new statisticsService_1.StatisticsService();
            const attendanceService = new attendanceService_1.AttendanceService();
            const rateLimitService = new rateLimitService_1.RateLimitService();
            const loggingService = new loggingService_1.LoggingService();
            const cacheService = new cacheService_1.CacheService();
            const monitoringService = new monitoringService_1.MonitoringService(loggingService, cacheService, schedulerService);
            this.services.set('eventStatus', eventStatusService);
            this.services.set('scheduler', schedulerService);
            this.services.set('certificate', certificateService);
            this.services.set('statistics', statisticsService);
            this.services.set('attendance', attendanceService);
            this.services.set('rateLimit', rateLimitService);
            this.services.set('logging', loggingService);
            this.services.set('cache', cacheService);
            this.services.set('monitoring', monitoringService);
            schedulerService.start();
            loggingService.startCleanupInterval();
            monitoringService.start();
            this.initialized = true;
            console.log('All services initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize services:', error);
            throw error;
        }
    }
    getService(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service '${name}' not found`);
        }
        return service;
    }
    getAllServices() {
        return new Map(this.services);
    }
    isInitialized() {
        return this.initialized;
    }
    async shutdown() {
        if (!this.initialized) {
            return;
        }
        console.log('Shutting down services...');
        try {
            const monitoringService = this.services.get('monitoring');
            if (monitoringService) {
                monitoringService.stop();
            }
            const schedulerService = this.services.get('scheduler');
            if (schedulerService) {
                schedulerService.stop();
            }
            const promises = [];
            const loggingService = this.services.get('logging');
            if (loggingService) {
                promises.push(loggingService.shutdown());
            }
            const cacheService = this.services.get('cache');
            if (cacheService) {
                promises.push(cacheService.shutdown());
            }
            await Promise.all(promises);
            this.services.clear();
            this.initialized = false;
            console.log('All services shut down successfully');
        }
        catch (error) {
            console.error('Error during service shutdown:', error);
            throw error;
        }
    }
    getServiceStatus() {
        const services = Array.from(this.services.keys());
        let health = {};
        try {
            const monitoringService = this.services.get('monitoring');
            if (monitoringService) {
                health = monitoringService.getMetricsSummary();
            }
        }
        catch (error) {
            health = { error: 'Failed to get health status' };
        }
        return {
            initialized: this.initialized,
            services,
            health
        };
    }
}
exports.ServiceManager = ServiceManager;
exports.default = ServiceManager;
//# sourceMappingURL=index.js.map