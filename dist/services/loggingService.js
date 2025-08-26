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
exports.LoggingService = exports.LogLevel = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["FATAL"] = "FATAL";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class LoggingService {
    constructor(config) {
        this.logQueue = [];
        this.isProcessing = false;
        this.logFileStream = null;
        this.currentLogFile = '';
        this.config = {
            level: LogLevel.INFO,
            enableConsole: true,
            enableFile: true,
            enableDatabase: false,
            logDirectory: path.join(__dirname, '../../logs'),
            maxFileSize: 10,
            maxFiles: 5,
            enableRequestLogging: true,
            enableErrorLogging: true,
            enablePerformanceLogging: true,
            ...config
        };
        this.initializeLogDirectory();
        this.startLogProcessor();
    }
    initializeLogDirectory() {
        if (this.config.enableFile && !fs.existsSync(this.config.logDirectory)) {
            fs.mkdirSync(this.config.logDirectory, { recursive: true });
        }
    }
    startLogProcessor() {
        setInterval(() => {
            this.processLogQueue();
        }, 1000);
    }
    async processLogQueue() {
        if (this.isProcessing || this.logQueue.length === 0)
            return;
        this.isProcessing = true;
        const logs = [...this.logQueue];
        this.logQueue = [];
        try {
            for (const log of logs) {
                await this.writeLog(log);
            }
        }
        catch (error) {
            console.error('Error processing logs:', error);
        }
        finally {
            this.isProcessing = false;
        }
    }
    async writeLog(log) {
        const logString = this.formatLogEntry(log);
        if (this.config.enableConsole) {
            this.writeToConsole(log);
        }
        if (this.config.enableFile) {
            await this.writeToFile(logString);
        }
        if (this.config.enableDatabase) {
            await this.writeToDatabase(log);
        }
    }
    writeToConsole(log) {
        const timestamp = new Date(log.timestamp).toISOString();
        const level = log.level.padEnd(5);
        const context = log.context ? `[${log.context}]` : '';
        const message = log.message;
        let consoleMessage = `${timestamp} ${level} ${context} ${message}`;
        if (log.error) {
            consoleMessage += `\nError: ${JSON.stringify(log.error, null, 2)}`;
        }
        switch (log.level) {
            case LogLevel.DEBUG:
                console.debug(consoleMessage);
                break;
            case LogLevel.INFO:
                console.info(consoleMessage);
                break;
            case LogLevel.WARN:
                console.warn(consoleMessage);
                break;
            case LogLevel.ERROR:
            case LogLevel.FATAL:
                console.error(consoleMessage);
                break;
        }
    }
    async writeToFile(logString) {
        try {
            const logFile = this.getCurrentLogFile();
            if (!this.logFileStream || this.currentLogFile !== logFile) {
                this.closeLogFileStream();
                this.currentLogFile = logFile;
                this.logFileStream = fs.createWriteStream(logFile, { flags: 'a' });
            }
            this.logFileStream.write(logString + '\n');
        }
        catch (error) {
            console.error('Error writing to log file:', error);
        }
    }
    getCurrentLogFile() {
        const date = new Date().toISOString().split('T')[0];
        return path.join(this.config.logDirectory, `app-${date}.log`);
    }
    closeLogFileStream() {
        if (this.logFileStream) {
            this.logFileStream.end();
            this.logFileStream = null;
        }
    }
    async writeToDatabase(log) {
    }
    formatLogEntry(log) {
        return JSON.stringify(log);
    }
    log(level, message, context, metadata) {
        if (this.shouldLog(level)) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                level,
                message,
                context,
                metadata
            };
            this.logQueue.push(logEntry);
        }
    }
    shouldLog(level) {
        const levels = Object.values(LogLevel);
        const configLevelIndex = levels.indexOf(this.config.level);
        const currentLevelIndex = levels.indexOf(level);
        return currentLevelIndex >= configLevelIndex;
    }
    debug(message, context, metadata) {
        this.log(LogLevel.DEBUG, message, context, metadata);
    }
    info(message, context, metadata) {
        this.log(LogLevel.INFO, message, context, metadata);
    }
    warn(message, context, metadata) {
        this.log(LogLevel.WARN, message, context, metadata);
    }
    error(message, context, error, metadata) {
        this.log(LogLevel.ERROR, message, context, { ...metadata, error });
    }
    fatal(message, context, error, metadata) {
        this.log(LogLevel.FATAL, message, context, { ...metadata, error });
    }
    logRequest(req, res, responseTime) {
        var _a;
        if (!this.config.enableRequestLogging)
            return;
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            message: `HTTP ${req.method} ${req.path}`,
            context: 'HTTP_REQUEST',
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            requestId: req.requestId,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            method: req.method,
            url: req.path,
            statusCode: res.statusCode,
            responseTime,
            metadata: {
                query: req.query,
                body: req.body,
                headers: req.headers
            }
        };
        this.logQueue.push(logEntry);
    }
    logError(req, res, error) {
        var _a;
        if (!this.config.enableErrorLogging)
            return;
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: LogLevel.ERROR,
            message: `HTTP Error: ${error.message || 'Unknown error'}`,
            context: 'HTTP_ERROR',
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            requestId: req.requestId,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            method: req.method,
            url: req.path,
            statusCode: res.statusCode,
            error,
            metadata: {
                query: req.query,
                body: req.body,
                headers: req.headers
            }
        };
        this.logQueue.push(logEntry);
    }
    logPerformance(operation, duration, context, metadata) {
        if (!this.config.enablePerformanceLogging)
            return;
        const level = duration > 1000 ? LogLevel.WARN : LogLevel.INFO;
        const message = `Performance: ${operation} took ${duration}ms`;
        this.log(level, message, context, { ...metadata, duration, operation });
    }
    logDatabaseQuery(query, duration, context) {
        this.logPerformance(`Database Query: ${query}`, duration, context || 'DATABASE');
    }
    logApiCall(url, method, duration, statusCode, context) {
        const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
        const message = `API Call: ${method} ${url} - ${statusCode}`;
        this.log(level, message, context || 'API_CALL', {
            url,
            method,
            duration,
            statusCode
        });
    }
    logUserActivity(userId, action, details, context) {
        this.info(`User Activity: ${action}`, context || 'USER_ACTIVITY', {
            userId,
            action,
            details
        });
    }
    logSecurityEvent(event, userId, ip, details) {
        this.warn(`Security Event: ${event}`, 'SECURITY', {
            event,
            userId,
            ip,
            details
        });
    }
    getLogStats() {
        return {
            queueSize: this.logQueue.length,
            isProcessing: this.isProcessing,
            config: this.config
        };
    }
    async cleanupOldLogs() {
        try {
            if (!this.config.enableFile)
                return;
            const files = fs.readdirSync(this.config.logDirectory);
            const logFiles = files
                .filter(file => file.startsWith('app-') && file.endsWith('.log'))
                .map(file => ({
                name: file,
                path: path.join(this.config.logDirectory, file),
                stats: fs.statSync(path.join(this.config.logDirectory, file))
            }))
                .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
            if (logFiles.length > this.config.maxFiles) {
                const filesToRemove = logFiles.slice(this.config.maxFiles);
                for (const file of filesToRemove) {
                    fs.unlinkSync(file.path);
                    this.info(`Removed old log file: ${file.name}`, 'LOG_CLEANUP');
                }
            }
            for (const file of logFiles) {
                const sizeInMB = file.stats.size / (1024 * 1024);
                if (sizeInMB > this.config.maxFileSize) {
                    const newName = file.name.replace('.log', `-${Date.now()}.log`);
                    fs.renameSync(file.path, path.join(this.config.logDirectory, newName));
                    this.info(`Rotated large log file: ${file.name} -> ${newName}`, 'LOG_CLEANUP');
                }
            }
        }
        catch (error) {
            this.error('Error cleaning up old logs', 'LOG_CLEANUP', error);
        }
    }
    startCleanupInterval(intervalMs = 24 * 60 * 60 * 1000) {
        setInterval(() => {
            this.cleanupOldLogs();
        }, intervalMs);
    }
    async shutdown() {
        this.info('Shutting down logging service', 'SHUTDOWN');
        await this.processLogQueue();
        this.closeLogFileStream();
        this.info('Logging service shutdown complete', 'SHUTDOWN');
    }
}
exports.LoggingService = LoggingService;
//# sourceMappingURL=loggingService.js.map