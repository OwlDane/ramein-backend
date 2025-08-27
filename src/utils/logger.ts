import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Define log format
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    const errorStack = stack ? `\n${stack}` : '';
    return `${timestamp} [${level}]: ${message}${metaString}${errorStack}`;
});

// Create logs directory
const logsDir = path.join(process.cwd(), 'logs');

// Create logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', // Log level based on environment
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }), // Add stack traces when available
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'ramein-backend' },
    transports: [
        // Console transport for development
        new winston.transports.Console({
            format: combine(
                colorize(),
                logFormat
            ),
            level: 'debug', // Show all logs in console during development
        }),
        // Daily rotate file transport for all logs
        new DailyRotateFile({
            filename: path.join(logsDir, 'application-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d', // Keep logs for 14 days
            level: 'info',
            format: logFormat,
        }),
        // Error logs (only errors)
        new DailyRotateFile({
            filename: path.join(logsDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d', // Keep error logs for 30 days
            level: 'error',
            format: logFormat,
        }),
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            format: logFormat,
        }),
    ],
    exitOnError: false, // Don't exit on handled exceptions
});

// Create a stream for morgan (HTTP request logging)
export const stream = {
    write: (message: string) => {
        logger.info(message.trim());
    },
};

export default logger;
