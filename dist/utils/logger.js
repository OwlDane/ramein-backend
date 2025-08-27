"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
require("winston-daily-rotate-file");
const { combine, timestamp, printf, colorize, errors } = winston_1.default.format;
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    const errorStack = stack ? `\n${stack}` : '';
    return `${timestamp} [${level}]: ${message}${metaString}${errorStack}`;
});
const logsDir = path_1.default.join(process.cwd(), 'logs');
const logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json()),
    defaultMeta: { service: 'ramein-backend' },
    transports: [
        new winston_1.default.transports.Console({
            format: combine(colorize(), logFormat),
            level: 'debug',
        }),
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logsDir, 'application-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: 'info',
            format: logFormat,
        }),
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logsDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            level: 'error',
            format: logFormat,
        }),
    ],
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'exceptions.log'),
            format: logFormat,
        }),
    ],
    exitOnError: false,
});
exports.stream = {
    write: (message) => {
        logger.info(message.trim());
    },
};
exports.default = logger;
//# sourceMappingURL=logger.js.map