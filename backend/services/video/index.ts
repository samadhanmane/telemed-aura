import { loadEnv } from "../../src/config/env.js";
loadEnv();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "node:http";
import { videoRouter } from "./routes/video.routes.js";
import { attachSignaling } from "./signaling/socket.server.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "video" }));
app.use("/api/video", videoRouter);

const httpServer = createServer(app);
attachSignaling(httpServer);

const port = process.env.VIDEO_PORT ?? 4003;
httpServer.listen(port, () => console.log(`[video] listening on :${port}`));
