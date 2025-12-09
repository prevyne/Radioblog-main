import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import * as Sentry from "@sentry/node";
import dbConnection from "./dbConfig.js";
import router from "./routes/index.js";
import uploadRouter from "./upload.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import { globalLimiter, authLimiter, likeLimiter, commentLimiter, createPostLimiter } from "./middleware/rateLimiter.js";

dotenv.config();

// Initialize Sentry for error tracking (optional - requires SENTRY_DSN env var)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

const app = express();
const PORT = process.env.PORT || 8800;
// If CORS_ALLOWED_ORIGINS is not set, default to an empty string so
// the `defaultOrigins` list is used. Previously this defaulted to
// localhost which prevented `defaultOrigins` from being applied.
const clientOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const defaultOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  // Common Render deployments used by this project — include your deployed origins here
  "https://radioblog-mai.onrender.com",
  "https://admin-9m1f.onrender.com",
  "https://masenoradio.onrender.com",
];
// Always include the built-in `defaultOrigins` and merge any origins provided
// via `CORS_ALLOWED_ORIGINS` so an incomplete env value doesn't accidentally
// block valid deployed origins. Remove duplicates while preserving order.
const allowedOrigins = Array.from(
  new Set([...defaultOrigins, ...clientOrigins])
);

const corsOptions = {
  origin: (origin, callback) => {
    // Development convenience: allow any origin when not in production.
    // This avoids CORS friction when running proxied apps locally.
    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    // Production / strict mode: normalize origin and check whitelist.
    const normalized = origin ? origin.replace(/\/$/, "") : origin;
    if (!normalized || allowedOrigins.includes(normalized)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS policy.`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
  exposedHeaders: ["Authorization"],
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(globalLimiter);
// Sentry request handler (must be before routes)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
// Serve uploaded files from the uploads directory
// Ensure uploaded files can be loaded cross-origin by setting CORP to allow cross-origin
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(process.cwd(), "uploads"))
);
app.use("/api/storage", uploadRouter);


// mount API routes under /api
app.use("/api", router);

app.get("/", (req, res) => res.send("Server running"));

// Health check endpoint (for liveness probes)
app.get("/health", (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness check endpoint (for readiness probes)
app.get("/ready", async (req, res) => {
  try {
    // Quick DB check
    const dbStatus = await dbConnection();
    res.status(200).json({ status: 'ready', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'not ready', error: err.message, timestamp: new Date().toISOString() });
  }
});

// Sentry error handler (must be before custom error middleware)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// error middleware must be registered after routes
app.use(errorMiddleware);

dbConnection()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to start server due to DB error:", err.message || err);
    process.exit(1);
  });



