import "reflect-metadata";
import AppDataSource from "./config/database";
import app from "./app";

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;

// Graceful shutdown function
const gracefulShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    

    
    // Close database connection
    if (AppDataSource.isInitialized) {
        AppDataSource.destroy()
            .then(() => {
                console.log('Database connection closed.');
                process.exit(0);
            })
            .catch((error) => {
                console.error('Error closing database connection:', error);
                process.exit(1);
            });
    } else {
        process.exit(0);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

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
startServer();
