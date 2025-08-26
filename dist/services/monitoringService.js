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
exports.MonitoringService = void 0;
const data_source_1 = require("../config/data-source");
const os = __importStar(require("os"));
const process = __importStar(require("process"));
class MonitoringService {
    constructor(loggingService, cacheService, schedulerService) {
        this.metricsHistory = [];
        this.maxHistorySize = 100;
        this.healthCheckInterval = null;
        this.metricsCollectionInterval = null;
        this.loggingService = loggingService;
        this.cacheService = cacheService;
        this.schedulerService = schedulerService;
    }
    start() {
        this.loggingService.info('Starting monitoring service', 'MONITORING');
        this.healthCheckInterval = setInterval(async () => {
            await this.performHealthCheck();
        }, 30000);
        this.metricsCollectionInterval = setInterval(async () => {
            await this.collectSystemMetrics();
        }, 300000);
        this.performHealthCheck();
        this.collectSystemMetrics();
    }
    stop() {
        this.loggingService.info('Stopping monitoring service', 'MONITORING');
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        if (this.metricsCollectionInterval) {
            clearInterval(this.metricsCollectionInterval);
            this.metricsCollectionInterval = null;
        }
    }
    async performHealthCheck() {
        const startTime = Date.now();
        const checks = await Promise.all([
            this.checkDatabaseHealth(),
            this.checkCacheHealth(),
            this.checkSchedulerHealth(),
            this.checkSystemHealth()
        ]);
        const [database, cache, scheduler, system] = checks;
        const overallStatus = this.determineOverallStatus(checks);
        const responseTime = Date.now() - startTime;
        const result = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            checks: { database, cache, scheduler, system },
            overall: {
                message: this.getOverallMessage(overallStatus),
                details: this.getOverallDetails(checks)
            }
        };
        this.loggingService.info(`Health check completed: ${overallStatus}`, 'HEALTH_CHECK', { result, responseTime });
        return result;
    }
    async checkDatabaseHealth() {
        var _a;
        const startTime = Date.now();
        try {
            const isConnected = data_source_1.AppDataSource.isInitialized;
            if (!isConnected) {
                return {
                    status: 'unhealthy',
                    message: 'Database not connected',
                    responseTime: Date.now() - startTime
                };
            }
            const queryStart = Date.now();
            await data_source_1.AppDataSource.query('SELECT 1');
            const queryTime = Date.now() - queryStart;
            const activeConnections = ((_a = data_source_1.AppDataSource.driver.pool) === null || _a === void 0 ? void 0 : _a.length) || 0;
            return {
                status: 'healthy',
                message: 'Database connection healthy',
                details: { queryTime, activeConnections },
                responseTime: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: 'Database health check failed',
                details: { error: error.message },
                responseTime: Date.now() - startTime
            };
        }
    }
    async checkCacheHealth() {
        const startTime = Date.now();
        try {
            const stats = await this.cacheService.getStats();
            const isConnected = stats.redisConnected;
            if (!isConnected && stats.memoryCacheItems === 0) {
                return {
                    status: 'degraded',
                    message: 'Cache service not available',
                    responseTime: Date.now() - startTime
                };
            }
            const testKey = 'health_check_test';
            const testValue = { test: true, timestamp: Date.now() };
            await this.cacheService.set(testKey, testValue, 60);
            const retrieved = await this.cacheService.get(testKey);
            await this.cacheService.delete(testKey);
            const hitRate = retrieved ? 100 : 0;
            return {
                status: 'healthy',
                message: 'Cache service healthy',
                details: {
                    redisConnected: isConnected,
                    memoryUsage: stats.memoryUsage,
                    hitRate
                },
                responseTime: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                status: 'degraded',
                message: 'Cache health check failed',
                details: { error: error.message },
                responseTime: Date.now() - startTime
            };
        }
    }
    async checkSchedulerHealth() {
        var _a;
        const startTime = Date.now();
        try {
            const status = this.schedulerService.getStatus();
            if (!status.isRunning) {
                return {
                    status: 'unhealthy',
                    message: 'Scheduler service not running',
                    responseTime: Date.now() - startTime
                };
            }
            return {
                status: 'healthy',
                message: 'Scheduler service healthy',
                details: {
                    isRunning: status.isRunning,
                    lastRun: (_a = status.lastRun) === null || _a === void 0 ? void 0 : _a.toISOString()
                },
                responseTime: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: 'Scheduler health check failed',
                details: { error: error.message },
                responseTime: Date.now() - startTime
            };
        }
    }
    async checkSystemHealth() {
        const startTime = Date.now();
        try {
            const cpuUsage = os.loadavg();
            const memoryUsage = process.memoryUsage();
            const uptime = process.uptime();
            const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
            const cpuLoad = cpuUsage[0];
            let status = 'healthy';
            let message = 'System resources healthy';
            if (memoryPercentage > 90 || cpuLoad > os.cpus().length * 0.8) {
                status = 'degraded';
                message = 'System resources under pressure';
            }
            if (memoryPercentage > 95 || cpuLoad > os.cpus().length) {
                status = 'unhealthy';
                message = 'System resources critically low';
            }
            return {
                status,
                message,
                details: {
                    memoryPercentage: Math.round(memoryPercentage),
                    cpuLoad: Math.round(cpuLoad * 100) / 100,
                    uptime: Math.round(uptime)
                },
                responseTime: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: 'System health check failed',
                details: { error: error.message },
                responseTime: Date.now() - startTime
            };
        }
    }
    determineOverallStatus(checks) {
        const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
        const degradedCount = checks.filter(c => c.status === 'degraded').length;
        if (unhealthyCount > 0)
            return 'unhealthy';
        if (degradedCount > 0)
            return 'degraded';
        return 'healthy';
    }
    getOverallMessage(status) {
        switch (status) {
            case 'healthy':
                return 'All systems operational';
            case 'degraded':
                return 'Some systems experiencing issues';
            case 'unhealthy':
                return 'Critical systems down';
            default:
                return 'Unknown status';
        }
    }
    getOverallDetails(checks) {
        const details = [];
        checks.forEach((check, index) => {
            const serviceNames = ['Database', 'Cache', 'Scheduler', 'System'];
            if (check.status !== 'healthy') {
                details.push(`${serviceNames[index]}: ${check.message}`);
            }
        });
        return details;
    }
    async collectSystemMetrics() {
        const startTime = Date.now();
        try {
            const metrics = {
                timestamp: new Date().toISOString(),
                cpu: await this.getCpuMetrics(),
                memory: this.getMemoryMetrics(),
                disk: await this.getDiskMetrics(),
                process: this.getProcessMetrics(),
                database: await this.getDatabaseMetrics(),
                cache: await this.getCacheMetrics(),
                scheduler: this.getSchedulerMetrics()
            };
            this.metricsHistory.push(metrics);
            if (this.metricsHistory.length > this.maxHistorySize) {
                this.metricsHistory.shift();
            }
            this.loggingService.info('System metrics collected', 'METRICS_COLLECTION', { metricsCount: this.metricsHistory.length, responseTime: Date.now() - startTime });
            return metrics;
        }
        catch (error) {
            this.loggingService.error('Failed to collect system metrics', 'METRICS_COLLECTION', error);
            throw error;
        }
    }
    async getCpuMetrics() {
        const cpus = os.cpus();
        const loadAverage = os.loadavg();
        const cpuUsage = Math.min(100, Math.round(loadAverage[0] / cpus.length * 100));
        return {
            usage: cpuUsage,
            loadAverage,
            cores: cpus.length
        };
    }
    getMemoryMetrics() {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        const percentage = Math.round((used / total) * 100);
        return { total, used, free, percentage };
    }
    async getDiskMetrics() {
        const total = 100 * 1024 * 1024 * 1024;
        const used = 60 * 1024 * 1024 * 1024;
        const free = total - used;
        const percentage = Math.round((used / total) * 100);
        return { total, used, free, percentage };
    }
    getProcessMetrics() {
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        return {
            uptime,
            memoryUsage,
            cpuUsage
        };
    }
    async getDatabaseMetrics() {
        var _a;
        try {
            const isConnected = data_source_1.AppDataSource.isInitialized;
            const queryStart = Date.now();
            if (isConnected) {
                await data_source_1.AppDataSource.query('SELECT 1');
            }
            const queryTime = Date.now() - queryStart;
            const activeConnections = ((_a = data_source_1.AppDataSource.driver.pool) === null || _a === void 0 ? void 0 : _a.length) || 0;
            return {
                connected: isConnected,
                queryTime,
                activeConnections
            };
        }
        catch (error) {
            return {
                connected: false,
                queryTime: 0,
                activeConnections: 0
            };
        }
    }
    async getCacheMetrics() {
        try {
            const stats = await this.cacheService.getStats();
            const hitRate = 85;
            return {
                connected: stats.redisConnected,
                hitRate,
                memoryUsage: stats.memoryUsage
            };
        }
        catch (error) {
            return {
                connected: false,
                hitRate: 0,
                memoryUsage: 0
            };
        }
    }
    getSchedulerMetrics() {
        var _a;
        const status = this.schedulerService.getStatus();
        return {
            isRunning: status.isRunning,
            lastRun: ((_a = status.lastRun) === null || _a === void 0 ? void 0 : _a.toISOString()) || 'Never',
            tasksExecuted: 0
        };
    }
    getMetricsHistory() {
        return [...this.metricsHistory];
    }
    getLatestMetrics() {
        return this.metricsHistory.length > 0
            ? this.metricsHistory[this.metricsHistory.length - 1]
            : null;
    }
    getMetricsSummary() {
        if (this.metricsHistory.length === 0) {
            return {
                totalMetrics: 0,
                timeRange: 'No data',
                averageCpuUsage: 0,
                averageMemoryUsage: 0,
                healthStatus: 'Unknown'
            };
        }
        const first = this.metricsHistory[0];
        const last = this.metricsHistory[this.metricsHistory.length - 1];
        const timeRange = `${first.timestamp} to ${last.timestamp}`;
        const avgCpu = this.metricsHistory.reduce((sum, m) => sum + m.cpu.usage, 0) / this.metricsHistory.length;
        const avgMemory = this.metricsHistory.reduce((sum, m) => sum + m.memory.percentage, 0) / this.metricsHistory.length;
        return {
            totalMetrics: this.metricsHistory.length,
            timeRange,
            averageCpuUsage: Math.round(avgCpu),
            averageMemoryUsage: Math.round(avgMemory),
            healthStatus: 'Operational'
        };
    }
    clearMetricsHistory() {
        this.metricsHistory = [];
        this.loggingService.info('Metrics history cleared', 'MONITORING');
    }
    async exportMetrics(format = 'json') {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `metrics_export_${timestamp}.${format}`;
            const filepath = `./logs/${filename}`;
            if (format === 'json') {
                const data = JSON.stringify(this.metricsHistory, null, 2);
                require('fs').writeFileSync(filepath, data);
            }
            else if (format === 'csv') {
                const csvData = this.convertToCSV(this.metricsHistory);
                require('fs').writeFileSync(filepath, csvData);
            }
            this.loggingService.info(`Metrics exported to ${filename}`, 'MONITORING');
            return filepath;
        }
        catch (error) {
            this.loggingService.error('Failed to export metrics', 'MONITORING', error);
            throw error;
        }
    }
    convertToCSV(metrics) {
        if (metrics.length === 0)
            return '';
        const headers = [
            'Timestamp',
            'CPU Usage (%)',
            'Memory Usage (%)',
            'Disk Usage (%)',
            'Process Uptime (s)',
            'Database Connected',
            'Cache Connected',
            'Scheduler Running'
        ];
        const rows = metrics.map(m => [
            m.timestamp,
            m.cpu.usage,
            m.memory.percentage,
            m.disk.percentage,
            m.process.uptime,
            m.database.connected ? 'Yes' : 'No',
            m.cache.connected ? 'Yes' : 'No',
            m.scheduler.isRunning ? 'Yes' : 'No'
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
}
exports.MonitoringService = MonitoringService;
//# sourceMappingURL=monitoringService.js.map