import "./load-env";
import { PrismaClient } from "@prisma/client";
import compression from "compression";
import cors from "cors";
import express, {
  type Application,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { prisma } from "./db";
import { errorHandler } from "./middleware/errorHandler";
// Import routes
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import integrationRoutes from "./routes/integration";
import notificationRoutes from "./routes/notification";
import subscriptionRoutes from "./routes/subscription";
import userRoutes from "./routes/user";
import webhookRoutes from "./routes/webhook";
import workflowRoutes from "./routes/workflow";
import { KeepAliveService } from "./services/keepAlive.service";
import { getDatabaseUrl } from "./utils/env";
import { createLogger } from "./utils/logger";

// Initialize logger
const logger = createLogger();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Initialize database connection
const initializeDatabase = async (): Promise<void> => {
  try {
    // Get the properly formatted database URL
    const dbUrl = getDatabaseUrl();

    // Log the database host (without credentials) for debugging
    const parsedUrl = new URL(dbUrl);
    logger.info(
      `Attempting to connect to database at: ${parsedUrl.hostname}:${parsedUrl.port}`,
    );

    await prisma.$connect();
    logger.info("Database connected successfully");

    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Database connection test successful");
  } catch (error) {
    logger.error("Database connection error:", error);
    if (process.env.NODE_ENV === "production") {
      logger.error("Exiting due to database connection failure in production");
      process.exit(1);
    } else {
      logger.warn("Continuing without database in development mode");
    }
  }
};

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// CORS configuration
const getAllowedOrigins = (): string[] => {
  const originsEnv = process.env.ALLOWED_ORIGINS;

  if (!originsEnv) {
    logger.error("ALLOWED_ORIGINS environment variable is not set");
    return [];
  }

  // Split by comma and trim whitespace
  return originsEnv
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0); // Remove empty strings
};

const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        callback(null, true);
        return;
      }

      // In development, be more permissive
      if (process.env.NODE_ENV === "development") {
        callback(null, true);
        return;
      }

      // In production, strictly check against allowed origins
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(
          `Blocked request from unauthorized origin: ${origin}. Allowed origins: ${allowedOrigins.join(", ")}`,
        );
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // More lenient in development
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    body: req.method !== "GET" ? req.body : undefined,
  });
  next();
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/workflow", workflowRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// Health check endpoint
app.get("/api/health", async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    const keepAliveStatus = KeepAliveService.getStatus();

    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      database: "connected",
      keepAlive: {
        running: keepAliveStatus.running,
        intervalMinutes: keepAliveStatus.interval / 1000 / 60,
      },
    });
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error:
        process.env.NODE_ENV === "development"
          ? error
          : "Database connection failed",
    });
  }
});

// API documentation endpoint
app.get("/api/docs", (req: Request, res: Response) => {
  res.json({
    name: "FlowAPI Server",
    version: "1.0.0",
    description: "Automation workflow platform API",
    endpoints: {
      auth: "/api/auth",
      user: "/api/user",
      workflow: "/api/workflow",
      integration: "/api/integration",
      health: "/api/health",
    },
    documentation: "https://docs.flowapi.com",
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    await prisma.$disconnect();
    logger.info("Database disconnected");

    process.exit(0);
  } catch (error) {
    logger.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start server
const startServer = async (): Promise<void> => {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      logger.info(`🚀 FlowAPI Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`📖 API docs: http://localhost:${PORT}/api/docs`);

      // Start keep-alive service to prevent server from sleeping
      KeepAliveService.start();
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  KeepAliveService.stop();
  process.exit(1);
});

process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    KeepAliveService.stop();
    process.exit(1);
  },
);

// Handle graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  KeepAliveService.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  KeepAliveService.stop();
  process.exit(0);
});

startServer();

export default app;
