import express from "express";
import cors from "cors";
import helmet from "helmet";
import { apiRouter } from "./api/routes/index.js";
import { errorHandler } from "./shared/middleware/error-handler.js";
import { getDatabaseStatus } from "./database/connection.js";

export function createApp() {
  const app = express();
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  app.use(helmet());
  app.use(cors({ origin: frontendUrl, credentials: true }));
  app.use(express.json());

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
