import { Router } from "express";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  analyzeReportFull,
  extractTextFromFile,
  inferReportType,
  validateUploadMime,
} from "../core/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "../../../uploads/ai-scans");

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^\w.-]/g, "_")}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (validateUploadMime(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF, PNG, JPG allowed"));
  },
});

export const scanAnalyzerRoutes = Router();

scanAnalyzerRoutes.post("/text", async (req, res) => {
  try {
    const { name, category, text } = req.body;
    if (!name || !category) return res.status(400).json({ error: "name and category required" });
    const analysis = await analyzeReportFull(name, category, text ?? "");
    return res.json({ success: true, analysis });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Failed" });
  }
});

scanAnalyzerRoutes.post("/file", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "file required" });

  try {
    const name = (req.body.name as string) || file.originalname;
    const category = (req.body.category as string) || "General";
    const { text, method } = await extractTextFromFile(file.path, file.mimetype);
    const imageBuffer = file.mimetype.startsWith("image/")
      ? await fs.readFile(file.path)
      : undefined;
    const analysis = await analyzeReportFull(name, category, text, {
      mimeType: file.mimetype,
      imageBuffer,
      extractionMethod: method,
    });
    const reportType = inferReportType(file.originalname, file.mimetype);

    await fs.unlink(file.path).catch(() => {});

    return res.json({
      success: true,
      extractedText: text.slice(0, 2000),
      extractionMethod: method,
      reportType,
      analysis,
    });
  } catch (e) {
    if (file.path) await fs.unlink(file.path).catch(() => {});
    return res.status(500).json({ error: e instanceof Error ? e.message : "Scan failed" });
  }
});
