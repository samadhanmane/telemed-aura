/**
 * Email microservice entry — Nodemailer notifications to users & doctors.
 */
import { loadEnv } from "../../src/config/env.js";
loadEnv();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { emailRouter } from "./routes/email.routes.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "email" }));
app.use("/api/email", emailRouter);

const port = process.env.EMAIL_PORT ?? 4001;
app.listen(port, () => console.log(`[email] listening on :${port}`));
