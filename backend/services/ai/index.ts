import { loadEnv } from "../../src/config/env.js";
loadEnv();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { aiRouter } from "./routes/ai.routes.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "ai" }));
app.use("/api/ai", aiRouter);

const port = process.env.AI_PORT ?? 4002;
app.listen(port, () => console.log(`[ai] listening on :${port}`));
