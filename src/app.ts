import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import logger from "./utils/logger";

// Import routes
import eventCategoryRoutes from "./routes/eventCategoryRoutes";
import authRoutes from "./routes/authRoutes";
import eventRoutes from "./routes/events";
import participantRoutes from "./routes/participants";
import adminRoutes from "./routes/adminRoutes";
import adminAuthRoutes from "./routes/adminAuthRoutes";
import fileRoutes from "./routes/fileRoutes";
import certificateRoutes from "./routes/certificateRoutes";
import certificateTemplateRoutes from "./routes/certificateTemplateRoutes";
import statisticsRoutes from "./routes/statisticsRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import articleRoutes from "./routes/articleRoutes";
import testimonialRoutes from "./routes/testimonialRoutes";
import contactRoutes from "./routes/contactRoutes";

// Import middleware
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import sessionTimeout from "./middlewares/sessionTimeout";

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
// Normalize ALLOWED_ORIGINS from env (trim whitespace) and handle CORS checks via function
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no origin)
      if (!origin) return callback(null, true);

      // If the origin is explicitly allowed, accept it
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Otherwise log and reject (CORS middleware will not set CORS headers)
      logger.warn(`CORS origin denied: ${origin}. Allowed: ${allowedOrigins.join(',')}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    // Ensure preflight responses use 200 for broader compatibility
    optionsSuccessStatus: 200,
  }),
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(
  morgan(morganFormat, {
    stream: { write: (message) => logger.http(message.trim()) },
  }),
);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`,
    );
  });

  next();
});

// Session timeout middleware (apply to all routes)
app.use(sessionTimeout);

// Static file serving for uploads
app.use("/api/files", express.static(path.join(__dirname, "../uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", eventCategoryRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/participants", participantRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/certificate-templates", certificateTemplateRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/contact", contactRoutes);

// Error handling middleware

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    application: "Ramein Event Management System",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// 404 handler
app.use(notFoundHandler);

// Custom error logger
app.use(
  (
    err: any,
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => {
    logger.error(`Error: ${err.message || "Unknown error"}`, {
      path: req.path,
      method: req.method,
      body: req.body,
      stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    });
    next(err);
  },
);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
