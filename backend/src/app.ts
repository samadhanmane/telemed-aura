import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { apiRouter } from "./api/routes/index.js";
import { errorHandler } from "./shared/middleware/error-handler.js";
import { getDatabaseStatus } from "./database/connection.js";
import { corsOriginCheck } from "./config/frontend-origins.js";
import { apiRateLimiter } from "./shared/middleware/rate-limit.middleware.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: corsOriginCheck,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(mongoSanitize({ replaceWith: "_" }));
  app.use("/api/v1", apiRateLimiter);

  app.get("/health", (_req, res) => {
    const db = getDatabaseStatus();
    res.json({
      status: db.connected ? "ok" : "degraded",
      service: "api",
      database: {
        name: db.dbName,
        connected: db.connected,
      },
    });
  });
  app.use("/api/v1", apiRouter);
  app.use(errorHandler);

  return app;
}
