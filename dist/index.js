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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = __importDefault(require("./config/database"));
const app_1 = __importDefault(require("./app"));
const logger_1 = __importDefault(require("./utils/logger"));
const dotenv = __importStar(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv.config();
const PORT = process.env.PORT || 3001;
const logsDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir);
}
const gracefulShutdown = (signal) => {
    logger_1.default.info(`Received ${signal}. Starting graceful shutdown...`);
    if (database_1.default.isInitialized) {
        database_1.default.destroy()
            .then(() => {
            logger_1.default.info('Database connection closed.');
            process.exit(0);
        })
            .catch((error) => {
            logger_1.default.error('Error closing database connection:', error);
            process.exit(1);
        });
    }
    else {
        process.exit(0);
    }
};
process.on('uncaughtException', (error) => {
    logger_1.default.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
    gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Unhandled Rejection', { reason, promise });
    gracefulShutdown('unhandledRejection');
});
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.warn('Unhandled Rejection at:', { promise, reason });
});
async function startServer() {
    try {
        await database_1.default.initialize();
        console.log("✅ Database connection has been established!");
        const server = app_1.default.listen(PORT, () => {
            console.log(`🚀 Ramein Server is running on http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
        server.on('error', (error) => {
            console.error('Server error:', error);
            gracefulShutdown('serverError');
        });
    }
    catch (error) {
        console.error("❌ Error during server initialization:", error);
        process.exit(1);
    }
}
startServer().catch(error => {
    logger_1.default.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map