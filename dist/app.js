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
const multer_1 = __importDefault(require("multer"));
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
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const articleRoutes_1 = __importDefault(require("./routes/articleRoutes"));
const testimonialRoutes_1 = __importDefault(require("./routes/testimonialRoutes"));
const contactRoutes_1 = __importDefault(require("./routes/contactRoutes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const sessionTimeout_1 = __importDefault(require("./middlewares/sessionTimeout"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : ["http://localhost:3000"];
if (process.env.NODE_ENV === 'production') {
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        allowedOrigins.push(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
    }
}
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const stringOrigins = allowedOrigins.filter(o => typeof o === 'string');
        if (stringOrigins.includes(origin))
            return callback(null, true);
        if (process.env.NODE_ENV === 'production') {
            const railwayPatterns = [
                /^https:\/\/.*\.railway\.app$/,
                /^https:\/\/.*\.up\.railway\.app$/
            ];
            if (railwayPatterns.some(pattern => pattern.test(origin))) {
                return callback(null, true);
            }
        }
        logger_1.default.warn(`CORS origin denied: ${origin}. Allowed: ${stringOrigins.join(',')}`);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
app.use(upload.any());
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use((0, morgan_1.default)(morganFormat, {
    stream: { write: (message) => logger_1.default.http(message.trim()) },
}));
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        logger_1.default.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});
app.use(sessionTimeout_1.default);
app.use("/api/files", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
app.use("/api/auth", authRoutes_1.default);
app.use("/api/categories", eventCategoryRoutes_1.default);
app.use("/api/events", events_1.default);
app.use("/api/participants", participants_1.default);
app.use("/api/admin/auth", adminAuthRoutes_1.default);
app.use("/api/admin", adminRoutes_1.default);
app.use("/api/files", fileRoutes_1.default);
app.use("/api/certificates", certificateRoutes_1.default);
app.use("/api/certificate-templates", certificateTemplateRoutes_1.default);
app.use("/api/statistics", statisticsRoutes_1.default);
app.use("/api/payment", paymentRoutes_1.default);
app.use("/api/articles", articleRoutes_1.default);
app.use("/api/testimonials", testimonialRoutes_1.default);
app.use("/api/contact", contactRoutes_1.default);
app.get("/api/health", (_req, res) => {
    res.json({
        status: "OK",
        application: "Ramein Event Management System",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
    });
});
app.use(errorHandler_1.notFoundHandler);
app.use((err, req, _res, next) => {
    logger_1.default.error(`Error: ${err.message || "Unknown error"}`, {
        path: req.path,
        method: req.method,
        body: req.body,
        stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    });
    next(err);
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map