import "reflect-metadata";
import AppDataSource from "./config/database";
import app from "./app";
import logger from "./utils/logger";
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Graceful shutdown function
const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    // Close database connection
    if (AppDataSource.isInitialized) {
        AppDataSource.destroy()
            .then(() => {
                logger.info('Database connection closed.');
                process.exit(0);
            })
            .catch((error) => {
                logger.error('Error closing database connection:', error);
                process.exit(1);
            });
    } else {
        process.exit(0);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection', { reason, promise });
    gracefulShutdown('unhandledRejection');
});

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Log unhandled promise rejections (for Node.js < 15)
process.on('unhandledRejection', (reason, promise) => {
    logger.warn('Unhandled Rejection at:', { promise, reason });
});

// Initialize TypeORM and start server
async function startServer() {
    try {
        // Initialize database connection
        await AppDataSource.initialize();
        console.log("✅ Database connection has been established!");

        // Start the server
        const server = app.listen(PORT, () => {
            console.log(`🚀 Ramein Server is running on http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });



        // Handle server errors
        server.on('error', (error) => {
            console.error('Server error:', error);
            gracefulShutdown('serverError');
        });

    } catch (error) {
        console.error("❌ Error during server initialization:", error);
        process.exit(1);
    }
}

// Start the server
startServer().catch(error => {
    logger.error('Failed to start server:', error);
    process.exit(1);
});
