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
const eventCategoryRoutes_1 = __importDefault(require("./routes/eventCategoryRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const events_1 = __importDefault(require("./routes/events"));
const participants_1 = __importDefault(require("./routes/participants"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const fileRoutes_1 = __importDefault(require("./routes/fileRoutes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const sessionTimeout_1 = __importDefault(require("./middlewares/sessionTimeout"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, morgan_1.default)('dev'));
app.use(sessionTimeout_1.default);
app.use('/api/files', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use('/api/auth', authRoutes_1.default);
app.use('/api/categories', eventCategoryRoutes_1.default);
app.use('/api/events', events_1.default);
app.use('/api/participants', participants_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/files', fileRoutes_1.default);
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map