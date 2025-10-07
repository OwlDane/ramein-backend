"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("./utils/logger"));
const eventCategoryRoutes_1 = __importDefault(require("./routes/eventCategoryRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const events_1 = __importDefault(require("./routes/events"));
const participants_1 = __importDefault(require("./routes/participants"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const adminAuthRoutes_1 = __importDefault(require("./routes/adminAuthRoutes"));
const fileRoutes_1 = __importDefault(require("./routes/fileRoutes"));
const certificateRoutes_1 = __importDefault(require("./routes/certificateRoutes"));
const certificateTemplateRoutes_1 = __importDefault(require("./routes/certificateTemplateRoutes"));
const statisticsRoutes_1 = __importDefault(require("./routes/statisticsRoutes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const sessionTimeout_1 = __importDefault(require("./middlewares/sessionTimeout"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://172.16.12.194:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use((0, morgan_1.default)(morganFormat, {
    stream: { write: (message) => logger_1.default.http(message.trim()) }
}));
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.default.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});
app.use(sessionTimeout_1.default);
app.use('/api/files', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use('/api/auth', authRoutes_1.default);
app.use('/api/categories', eventCategoryRoutes_1.default);
app.use('/api/events', events_1.default);
app.use('/api/participants', participants_1.default);
app.use('/api/admin/auth', adminAuthRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/files', fileRoutes_1.default);
app.use('/api/certificates', certificateRoutes_1.default);
app.use('/api/certificate-templates', certificateTemplateRoutes_1.default);
app.use('/api/statistics', statisticsRoutes_1.default);
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'OK',
        application: 'Ramein Event Management System',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});
app.use(errorHandler_1.notFoundHandler);
app.use((err, req, _res, next) => {
    logger_1.default.error(`Error: ${err.message || 'Unknown error'}`, {
        path: req.path,
        method: req.method,
        body: req.body,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
    next(err);
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map